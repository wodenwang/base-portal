import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpsService, type PortalAppPackage } from '../src/modules/ops.service';
import type { PortalSession } from '../src/modules/session.service';

describe('OpsService app package import', () => {
  let fakePrisma: ReturnType<typeof createFakePrisma>;
  let audit: { record: ReturnType<typeof vi.fn> };
  let service: OpsService;

  beforeEach(() => {
    fakePrisma = createFakePrisma();
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    service = new OpsService(fakePrisma as never, audit as never);
  });

  it('rejects leaf menus without base-portal resource keys', async () => {
    const invalid = clonePackage();
    invalid.menus[1].resourceKey = 'external.demo.embedded';

    await expect(service.importAppPackage(session, invalid, { dryRun: true })).rejects.toMatchObject({
      response: expect.objectContaining({
        error: expect.objectContaining({ code: 'APP_PACKAGE_INVALID' })
      })
    });
  });

  it('rejects permission groups that bind unknown points', async () => {
    const invalid = clonePackage();
    invalid.permissionGroups = [{ ...invalid.permissionGroups![0], points: ['base-portal.demo.missing'] }];

    await expect(service.importAppPackage(session, invalid, { dryRun: true })).rejects.toMatchObject({
      response: expect.objectContaining({
        error: expect.objectContaining({ code: 'APP_PACKAGE_INVALID' })
      })
    });
  });

  it('rejects unknown menu open modes with a safe validation error', async () => {
    const invalid = clonePackage();
    invalid.menus[1].openMode = 'popup' as never;

    await expect(service.importAppPackage(session, invalid, { dryRun: true })).rejects.toMatchObject({
      response: expect.objectContaining({
        error: expect.objectContaining({
          code: 'APP_PACKAGE_INVALID',
          details: expect.arrayContaining(['invalid openMode: demo-embedded'])
        })
      })
    });
  });

  it('summarizes dry-run import without writing domain or menus', async () => {
    const result = await service.importAppPackage(session, clonePackage(), { dryRun: true });

    expect(result).toMatchObject({
      ok: true,
      dryRun: true,
      packageKey: 'base-portal.demo',
      summary: {
        domains: { create: 1, update: 0 },
        menus: { create: 3, update: 0, disable: 0 },
        permissionPoints: 2,
        permissionGroups: 1,
        bindings: 2
      }
    });
    expect(fakePrisma.portalDomain.upsert).not.toHaveBeenCalled();
    expect(fakePrisma.portalMenu.upsert).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('warns and normalizes historical immersive iframe open modes on import', async () => {
    const appPackage = clonePackage();
    appPackage.menus[1].openMode = 'immersive_iframe';

    const dryRun = await service.importAppPackage(session, appPackage, { dryRun: true });
    await service.importAppPackage(session, appPackage, { dryRun: false });

    expect(dryRun.summary.warnings).toEqual(['menu demo-embedded openMode immersive_iframe normalized to iframe']);
    expect(fakePrisma.portalMenu.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        key: 'demo-embedded',
        openMode: 'iframe'
      }),
      update: expect.objectContaining({
        openMode: 'iframe'
      })
    }));
    expect(JSON.stringify(dryRun)).not.toContain('unit-test-placeholder');
  });

  it('applies the same package twice as idempotent upserts', async () => {
    await service.importAppPackage(session, clonePackage(), { dryRun: false });
    await service.importAppPackage(session, clonePackage(), { dryRun: false });

    expect(fakePrisma.portalDomain.upsert).toHaveBeenCalledTimes(2);
    expect(fakePrisma.portalMenu.upsert).toHaveBeenCalledTimes(6);
    expect(audit.record).toHaveBeenCalledTimes(2);
  });
});

describe('OpsService IAM resource sync', () => {
  let fakePrisma: ReturnType<typeof createFakePrisma>;
  let audit: { record: ReturnType<typeof vi.fn> };
  let service: OpsService;

  beforeEach(() => {
    fakePrisma = createFakePrisma();
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    service = new OpsService(fakePrisma as never, audit as never);
    process.env.FEISHU_IAM_URL = 'https://feishu-iam.example.test';
    process.env.FEISHU_IAM_APP_KEY = 'base-portal';
    process.env.FEISHU_IAM_DEVELOPER_API_TOKEN = 'unit-test-placeholder';
    vi.stubGlobal('fetch', vi.fn(mockIamFetch));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dry-runs package permission points, groups, and bindings without calling IAM', async () => {
    const result = await service.syncIamResources(session, { dryRun: true, package: clonePackage() });

    expect(result).toMatchObject({
      ok: true,
      dryRun: true,
      summary: { permissionPoints: 2, permissionGroups: 1, bindings: 2 },
      stages: []
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('applies permission points, groups, and group bindings with pointIds', async () => {
    const result = await service.syncIamResources(session, { dryRun: false, package: clonePackage() });

    expect(result.ok).toBe(true);
    expect(result.stages.map((stage) => stage.name)).toEqual([
      'list-permission-points',
      'list-permission-groups',
      'create-point:base-portal.demo.embedded',
      'create-point:base-portal.demo.new-tab',
      'create-group:base-portal.demo.users',
      'bind-group:base-portal.demo.users'
    ]);
    const calls = vi.mocked(fetch).mock.calls.map(([url, init]) => ({
      url: String(url),
      method: init?.method,
      body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined
    }));
    expect(calls.at(-1)).toMatchObject({
      url: 'https://feishu-iam.example.test/api/v1/developer/apps/base-portal/permission-groups/group-demo-users/points',
      method: 'PUT',
      body: { pointIds: ['point-demo-embedded', 'point-demo-new-tab'] }
    });
    expect(JSON.stringify(result)).not.toContain('unit-test-placeholder');
  });

  it('treats 409 from IAM as a successful idempotent sync stage', async () => {
    let listedPoints = false;
    let listedGroups = false;
    vi.stubGlobal('fetch', vi.fn((url: URL | RequestInfo, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const path = new URL(String(url)).pathname;
      if (method === 'GET' && path.endsWith('/permission-points')) {
        const items = listedPoints ? [
          { id: 'point-demo-embedded', key: 'base-portal.demo.embedded' },
          { id: 'point-demo-new-tab', key: 'base-portal.demo.new-tab' }
        ] : [];
        listedPoints = true;
        return jsonResponse({ items });
      }
      if (method === 'GET' && path.endsWith('/permission-groups')) {
        const items = listedGroups ? [{ id: 'group-demo-users', key: 'base-portal.demo.users' }] : [];
        listedGroups = true;
        return jsonResponse({ items });
      }
      if (method === 'POST' && path.endsWith('/permission-points')) return jsonResponse({ error: 'already_exists' }, 409);
      if (method === 'POST' && path.endsWith('/permission-groups')) return jsonResponse({ error: 'already_exists' }, 409);
      if (method === 'PUT' && path.endsWith('/points')) return jsonResponse({ ok: true });
      return jsonResponse({ error: 'unexpected' }, 500);
    }));

    const result = await service.syncIamResources(session, { dryRun: false, package: clonePackage() });

    expect(result.stages.filter((stage) => stage.status === 409).every((stage) => stage.ok)).toBe(true);
    expect(result.stages.at(-1)).toMatchObject({ name: 'bind-group:base-portal.demo.users', ok: true });
  });

  it('returns safe error codes without token or raw body values on IAM failure', async () => {
    vi.stubGlobal('fetch', vi.fn((url: URL | RequestInfo, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const path = new URL(String(url)).pathname;
      if (method === 'GET' && path.endsWith('/permission-points')) return jsonResponse({ items: [] });
      if (method === 'GET' && path.endsWith('/permission-groups')) return jsonResponse({ items: [] });
      if (method === 'POST' && path.endsWith('/permission-points')) return jsonResponse({ error: 'raw body contains unit-test-placeholder' }, 500);
      return jsonResponse({ ok: true });
    }));

    const result = await service.syncIamResources(session, { dryRun: false, package: clonePackage() });
    const serialized = JSON.stringify(result);

    expect(result.ok).toBe(false);
    expect(serialized).toContain('iam_500');
    expect(serialized).not.toContain('unit-test-placeholder');
    expect(serialized).not.toContain('raw body contains');
  });
});

const session: PortalSession = {
  id: 'session-1',
  user: { id: 'admin-1', name: '运维用户' },
  permissionPoints: ['base-portal.ops.admin'],
  permissionGroups: ['base-portal.admins'],
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600_000).toISOString()
};

function clonePackage(): PortalAppPackage {
  return structuredClone(packageFixture);
}

function createFakePrisma() {
  const domains = new Map<string, Record<string, unknown>>();
  const menus = new Map<string, Record<string, unknown>>();
  return {
    portalDomain: {
      findUnique: vi.fn(({ where }: { where: { key: string } }) => Promise.resolve(domains.get(where.key) ?? null)),
      upsert: vi.fn(({ where, create, update }: { where: { key: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const value = domains.has(where.key) ? { ...domains.get(where.key), ...update } : create;
        domains.set(where.key, value);
        return Promise.resolve(value);
      })
    },
    portalMenu: {
      findMany: vi.fn(({ where }: { where?: { domainId?: string } } = {}) => {
        const all = [...menus.values()];
        if (!where?.domainId) return Promise.resolve(all);
        return Promise.resolve(all.filter((menu) => menu.domainId === where.domainId));
      }),
      upsert: vi.fn(({ where, create, update }: { where: { key: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const value = menus.has(where.key) ? { ...menus.get(where.key), ...update } : create;
        menus.set(where.key, value);
        return Promise.resolve(value);
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 })
    }
  };
}

function mockIamFetch(url: URL | RequestInfo, init?: RequestInit): Response {
  const method = init?.method ?? 'GET';
  const path = new URL(String(url)).pathname;
  if (method === 'GET' && path.endsWith('/permission-points')) {
    return jsonResponse({ items: [] });
  }
  if (method === 'GET' && path.endsWith('/permission-groups')) {
    return jsonResponse({ items: [] });
  }
  if (method === 'POST' && path.endsWith('/permission-points')) {
    const body = init?.body ? JSON.parse(String(init.body)) as { key: string } : { key: '' };
    const id = body.key.endsWith('embedded') ? 'point-demo-embedded' : 'point-demo-new-tab';
    return jsonResponse({ id, key: body.key }, 201);
  }
  if (method === 'POST' && path.endsWith('/permission-groups')) {
    return jsonResponse({ id: 'group-demo-users', key: 'base-portal.demo.users' }, 201);
  }
  if (method === 'PUT' && path.endsWith('/points')) {
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ error: 'unexpected' }, 500);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

const packageFixture: PortalAppPackage = {
  packageKey: 'base-portal.demo',
  version: '2026-06-20',
  domain: {
    id: 'domain-demo-services',
    key: 'demo-services',
    name: '示例接入',
    description: '用于验证 v0.3.1 第三方应用无感接入、权限同步和真实用户路径。',
    icon: 'Workflow',
    coverColor: '#0f766e',
    sortOrder: 90,
    status: 'active'
  },
  menus: [
    {
      id: 'menu-demo-root',
      key: 'demo-root',
      title: '示例系统',
      icon: 'FolderKanban',
      level: 1,
      sortOrder: 10,
      status: 'active',
      isLeaf: false
    },
    {
      id: 'menu-demo-embedded',
      parentId: 'menu-demo-root',
      key: 'demo-embedded',
      title: 'SSO Demo',
      icon: 'PanelsTopLeft',
      level: 2,
      sortOrder: 10,
      status: 'active',
      isLeaf: true,
      resourceKey: 'base-portal.demo.embedded',
      url: 'https://feishu-iam-sso-demo.riversoft.com.cn/',
      openMode: 'iframe',
      confirmOnClose: false
    },
    {
      id: 'menu-demo-new-tab',
      parentId: 'menu-demo-root',
      key: 'demo-new-tab',
      title: '新窗口恢复入口',
      icon: 'ExternalLink',
      level: 2,
      sortOrder: 20,
      status: 'active',
      isLeaf: true,
      resourceKey: 'base-portal.demo.new-tab',
      url: 'https://feishu-iam-sso-demo.riversoft.com.cn/',
      openMode: 'new_tab',
      confirmOnClose: false
    }
  ],
  permissionGroups: [
    {
      key: 'base-portal.demo.users',
      name: 'Base Portal 示例接入用户',
      description: '允许访问 v0.3.1 示例第三方应用接入包。',
      points: ['base-portal.demo.embedded', 'base-portal.demo.new-tab']
    }
  ]
};
