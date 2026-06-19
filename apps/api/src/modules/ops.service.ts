import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from './prisma.service';
import type { PortalSession } from './session.service';

export type PortalAppPackage = {
  packageKey: string;
  version: string;
  domain: {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    coverColor: string;
    sortOrder: number;
    status?: string;
  };
  menus: Array<{
    id: string;
    parentId?: string;
    key: string;
    title: string;
    icon: string;
    level: number;
    sortOrder: number;
    status?: string;
    isLeaf: boolean;
    resourceKey?: string;
    url?: string;
    openMode?: 'iframe' | 'immersive_iframe' | 'new_tab';
    confirmOnClose?: boolean;
  }>;
  permissionGroups?: Array<{
    key: string;
    name: string;
    description: string;
    points: string[];
  }>;
};

export type ImportSummary = {
  domains: { create: number; update: number };
  menus: { create: number; update: number; disable: number };
  permissionPoints: number;
  permissionGroups: number;
  bindings: number;
  warnings: string[];
};

export type ImportResult = {
  ok: true;
  dryRun: boolean;
  packageKey: string;
  version: string;
  summary: ImportSummary;
};

export type SyncResult = {
  ok: boolean;
  dryRun: boolean;
  packageKey?: string;
  summary: {
    permissionPoints: number;
    permissionGroups: number;
    bindings: number;
  };
  stages: Array<{
    name: string;
    ok: boolean;
    status?: number;
    key?: string;
    error?: string;
  }>;
};

type ImportOptions = {
  dryRun: boolean;
};

type SyncOptions = {
  dryRun?: boolean;
  package?: PortalAppPackage;
};

type DeveloperItem = {
  id?: string;
  key?: string;
};

@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async importAppPackage(session: PortalSession, appPackage: PortalAppPackage, options: ImportOptions): Promise<ImportResult> {
    validateAppPackage(appPackage);
    const warnings = openModeNormalizationWarnings(appPackage);
    const existingDomain = await this.prisma.portalDomain.findUnique({ where: { key: appPackage.domain.key } });
    const existingMenus = await this.prisma.portalMenu.findMany({ where: { domainId: appPackage.domain.id } });
    const existingMenusByKey = new Map(existingMenus.map((menu) => [menu.key, menu]));
    const packageMenuIds = new Set(appPackage.menus.map((menu) => menu.id));
    const disableCount = existingMenus.filter((menu) => menu.status === 'active' && !packageMenuIds.has(menu.id)).length;
    const summary: ImportSummary = {
      domains: { create: existingDomain ? 0 : 1, update: existingDomain ? 1 : 0 },
      menus: {
        create: appPackage.menus.filter((menu) => !existingMenusByKey.has(menu.key)).length,
        update: appPackage.menus.filter((menu) => existingMenusByKey.has(menu.key)).length,
        disable: disableCount
      },
      permissionPoints: leafPermissionKeys(appPackage).length,
      permissionGroups: appPackage.permissionGroups?.length ?? 0,
      bindings: appPackage.permissionGroups?.reduce((total, group) => total + group.points.length, 0) ?? 0,
      warnings
    };

    if (!options.dryRun) {
      await this.prisma.portalDomain.upsert({
        where: { key: appPackage.domain.key },
        create: {
          id: appPackage.domain.id,
          key: appPackage.domain.key,
          name: appPackage.domain.name,
          description: appPackage.domain.description,
          icon: appPackage.domain.icon,
          coverColor: appPackage.domain.coverColor,
          sortOrder: appPackage.domain.sortOrder,
          status: appPackage.domain.status ?? 'active'
        },
        update: {
          name: appPackage.domain.name,
          description: appPackage.domain.description,
          icon: appPackage.domain.icon,
          coverColor: appPackage.domain.coverColor,
          sortOrder: appPackage.domain.sortOrder,
          status: appPackage.domain.status ?? 'active'
        }
      });

      for (const menu of appPackage.menus) {
        await this.prisma.portalMenu.upsert({
          where: { key: menu.key },
          create: {
            id: menu.id,
            domainId: appPackage.domain.id,
            parentId: menu.parentId ?? null,
            key: menu.key,
            title: menu.title,
            icon: menu.icon,
            level: menu.level,
            sortOrder: menu.sortOrder,
            status: menu.status ?? 'active',
            isLeaf: menu.isLeaf,
            resourceKey: menu.resourceKey ?? null,
            url: menu.url ?? null,
            openMode: normalizeImportOpenMode(menu.openMode),
            confirmOnClose: menu.confirmOnClose ?? false
          },
          update: {
            domainId: appPackage.domain.id,
            parentId: menu.parentId ?? null,
            title: menu.title,
            icon: menu.icon,
            level: menu.level,
            sortOrder: menu.sortOrder,
            status: menu.status ?? 'active',
            isLeaf: menu.isLeaf,
            resourceKey: menu.resourceKey ?? null,
            url: menu.url ?? null,
            openMode: normalizeImportOpenMode(menu.openMode),
            confirmOnClose: menu.confirmOnClose ?? false
          }
        });
      }

      if (disableCount > 0) {
        await this.prisma.portalMenu.updateMany({
          where: { domainId: appPackage.domain.id, id: { notIn: [...packageMenuIds] }, status: 'active' },
          data: { status: 'disabled' }
        });
      }

      await this.audit.record({
        eventType: 'app_package_import',
        session,
        domainKey: appPackage.domain.key,
        domainName: appPackage.domain.name,
        detail: {
          dryRun: false,
          packageKey: appPackage.packageKey,
          version: appPackage.version,
          summary
        }
      });
    }

    return {
      ok: true,
      dryRun: options.dryRun,
      packageKey: appPackage.packageKey,
      version: appPackage.version,
      summary
    };
  }

  async syncIamResources(session: PortalSession, options: SyncOptions): Promise<SyncResult> {
    if (options.package) validateAppPackage(options.package);
    const source = options.package ? buildSyncSourceFromPackage(options.package) : await this.buildSyncSourceFromDatabase();
    const dryRun = options.dryRun ?? !process.env.FEISHU_IAM_DEVELOPER_API_TOKEN;
    const result: SyncResult = {
      ok: true,
      dryRun,
      packageKey: options.package?.packageKey,
      summary: {
        permissionPoints: source.points.length,
        permissionGroups: source.groups.length,
        bindings: source.groups.reduce((total, group) => total + group.points.length, 0)
      },
      stages: []
    };

    if (!dryRun) {
      result.stages.push(...await this.applyIamSync(source.points, source.groups));
      result.ok = result.stages.every((stage) => stage.ok);
    }

    await this.audit.record({
      eventType: 'iam_resource_sync',
      session,
      detail: {
        dryRun,
        packageKey: options.package?.packageKey,
        summary: result.summary,
        stages: result.stages
      }
    });

    return result;
  }

  private async buildSyncSourceFromDatabase(): Promise<SyncSource> {
    const menus = await this.prisma.portalMenu.findMany({
      where: { status: 'active', isLeaf: true, resourceKey: { not: null } },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
    });
    return {
      points: menus.map((menu) => ({
        key: menu.resourceKey ?? '',
        name: menu.title,
        description: `Base Portal 菜单：${menu.title}`
      })),
      groups: []
    };
  }

  private async applyIamSync(points: SyncPoint[], groups: SyncGroup[]): Promise<SyncResult['stages']> {
    const stages: SyncResult['stages'] = [];
    const existingPoints = await this.getDeveloperItems('permission-points', stages);
    const existingGroups = await this.getDeveloperItems('permission-groups', stages);
    const pointIdsByKey = new Map(existingPoints.flatMap((point) => point.key && point.id ? [[point.key, point.id]] : []));
    const groupIdsByKey = new Map(existingGroups.flatMap((group) => group.key && group.id ? [[group.key, group.id]] : []));

    for (const point of points) {
      const existingId = pointIdsByKey.get(point.key);
      const stageName = `${existingId ? 'update' : 'create'}-point:${point.key}`;
      const response = await this.developerRequest(existingId ? 'PATCH' : 'POST', existingId ? `permission-points/${encodeURIComponent(existingId)}` : 'permission-points', point, stageName, point.key);
      stages.push(response.stage);
      const item = response.body;
      if (response.stage.ok && item?.id) {
        pointIdsByKey.set(point.key, item.id);
      } else if (response.stage.ok && response.stage.status === 409) {
        const refreshedPoints = await this.getDeveloperItems('permission-points', stages);
        const refreshed = refreshedPoints.find((candidate) => candidate.key === point.key);
        if (refreshed?.id) pointIdsByKey.set(point.key, refreshed.id);
      }
    }

    for (const group of groups) {
      const existingId = groupIdsByKey.get(group.key);
      const groupResponse = await this.developerRequest(
        existingId ? 'PATCH' : 'POST',
        existingId ? `permission-groups/${encodeURIComponent(existingId)}` : 'permission-groups',
        { key: group.key, name: group.name, description: group.description },
        `${existingId ? 'update' : 'create'}-group:${group.key}`,
        group.key
      );
      stages.push(groupResponse.stage);
      let groupId = existingId ?? groupResponse.body?.id;
      if (!groupId && groupResponse.stage.ok && groupResponse.stage.status === 409) {
        const refreshedGroups = await this.getDeveloperItems('permission-groups', stages);
        groupId = refreshedGroups.find((candidate) => candidate.key === group.key)?.id;
      }
      if (!groupId) {
        stages.push({ name: `bind-group:${group.key}`, ok: false, key: group.key, error: 'missing_group_id' });
        continue;
      }
      if (groupResponse.stage.ok && groupResponse.body?.id) {
        groupIdsByKey.set(group.key, groupResponse.body.id);
      }
      const pointIds = group.points.map((pointKey) => pointIdsByKey.get(pointKey)).filter((value): value is string => Boolean(value));
      if (pointIds.length !== group.points.length) {
        stages.push({ name: `bind-group:${group.key}`, ok: false, key: group.key, error: 'missing_point_id' });
        continue;
      }
      const bindResponse = await this.developerRequest(
        'PUT',
        `permission-groups/${encodeURIComponent(groupId)}/points`,
        { pointIds },
        `bind-group:${group.key}`,
        group.key
      );
      stages.push(bindResponse.stage);
    }

    return stages;
  }

  private async getDeveloperItems(resource: 'permission-points' | 'permission-groups', stages: SyncResult['stages']): Promise<DeveloperItem[]> {
    const response = await this.developerRequest('GET', resource, undefined, `list-${resource}`);
    stages.push(response.stage);
    const body = response.body;
    return response.stage.ok && Array.isArray(body?.items) ? body.items : [];
  }

  private async developerRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT',
    resource: string,
    body: Record<string, unknown> | SyncPoint | undefined,
    stageName: string,
    key?: string
  ): Promise<{ stage: SyncResult['stages'][number]; body?: DeveloperItem & { items?: DeveloperItem[] } }> {
    const baseUrl = requiredEnv('FEISHU_IAM_URL');
    const appKey = process.env.FEISHU_IAM_APP_KEY ?? 'base-portal';
    const token = requiredEnv('FEISHU_IAM_DEVELOPER_API_TOKEN');
    const response = await fetch(new URL(`/api/v1/developer/apps/${appKey}/${resource}`, baseUrl), {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok && response.status !== 409) {
      return { stage: { name: stageName, ok: false, status: response.status, key, error: `iam_${response.status}` } };
    }
    const json = await response.json().catch(() => undefined) as DeveloperItem & { items?: DeveloperItem[] } | undefined;
    return { stage: { name: stageName, ok: true, status: response.status, key }, body: json };
  }
}

type SyncPoint = {
  key: string;
  name: string;
  description: string;
};

type SyncGroup = {
  key: string;
  name: string;
  description: string;
  points: string[];
};

type SyncSource = {
  points: SyncPoint[];
  groups: SyncGroup[];
};

export function validateAppPackage(appPackage: PortalAppPackage): void {
  const errors: string[] = [];
  if (!appPackage || typeof appPackage !== 'object') {
    throw new BadRequestException({ error: { code: 'APP_PACKAGE_INVALID', message: '应用接入包不合法', details: ['package body is required'] } });
  }
  if (!appPackage.packageKey?.startsWith('base-portal.')) errors.push('packageKey must start with base-portal.');
  if (!appPackage.domain?.key) errors.push('domain.key is required');
  const menuIds = new Set<string>();
  const menuKeys = new Set<string>();
  const leafKeys = new Set<string>();
  const menus = Array.isArray(appPackage.menus) ? appPackage.menus : [];
  if (menus.length === 0) errors.push('menus are required');
  for (const menu of menus) {
    if (menuIds.has(menu.id)) errors.push(`duplicate menu id: ${menu.id}`);
    menuIds.add(menu.id);
    if (menuKeys.has(menu.key)) errors.push(`duplicate menu key: ${menu.key}`);
    menuKeys.add(menu.key);
    if (![1, 2, 3].includes(menu.level)) errors.push(`invalid menu level: ${menu.key}`);
    if (menu.parentId && !menuIds.has(menu.parentId) && !menus.some((candidate) => candidate.id === menu.parentId)) {
      errors.push(`unknown parentId: ${menu.parentId}`);
    }
    if (menu.openMode !== undefined && !['iframe', 'immersive_iframe', 'new_tab'].includes(String(menu.openMode))) {
      errors.push(`invalid openMode: ${menu.key}`);
    }
    if (menu.isLeaf) {
      if (!menu.resourceKey || !menu.url) errors.push(`leaf menu requires resourceKey and url: ${menu.key}`);
      if (!menu.resourceKey?.startsWith('base-portal.')) errors.push(`leaf resourceKey must start with base-portal.: ${menu.key}`);
      if (menu.resourceKey) leafKeys.add(menu.resourceKey);
    }
  }
  const permissionGroups = Array.isArray(appPackage.permissionGroups) ? appPackage.permissionGroups : [];
  for (const group of permissionGroups) {
    if (!group.key.startsWith('base-portal.')) errors.push(`permission group key must start with base-portal.: ${group.key}`);
    for (const point of group.points) {
      if (!leafKeys.has(point)) errors.push(`permission group binds unknown point: ${point}`);
    }
  }
  if (errors.length > 0) {
    throw new BadRequestException({ error: { code: 'APP_PACKAGE_INVALID', message: '应用接入包不合法', details: errors } });
  }
}

function buildSyncSourceFromPackage(appPackage: PortalAppPackage): SyncSource {
  return {
    points: appPackage.menus.filter(isPermissionMenu).map((menu) => ({
      key: menu.resourceKey,
      name: menu.title,
      description: `Base Portal 菜单：${menu.title}`
    })),
    groups: (appPackage.permissionGroups ?? []).map((group) => ({
      key: group.key,
      name: group.name,
      description: group.description,
      points: group.points
    }))
  };
}

function leafPermissionKeys(appPackage: PortalAppPackage): string[] {
  return appPackage.menus.filter(isPermissionMenu).map((menu) => menu.resourceKey);
}

function isPermissionMenu(menu: PortalAppPackage['menus'][number]): menu is PortalAppPackage['menus'][number] & { resourceKey: string } {
  return menu.isLeaf && typeof menu.resourceKey === 'string';
}

function normalizeImportOpenMode(openMode: PortalAppPackage['menus'][number]['openMode']): PortalAppPackage['menus'][number]['openMode'] | null {
  if (!openMode) return null;
  if (openMode === 'immersive_iframe') return 'iframe';
  return openMode;
}

function openModeNormalizationWarnings(appPackage: PortalAppPackage): string[] {
  return appPackage.menus
    .filter((menu) => menu.openMode === 'immersive_iframe')
    .map((menu) => `menu ${menu.key} openMode immersive_iframe normalized to iframe`);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
