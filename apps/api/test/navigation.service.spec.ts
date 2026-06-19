import { describe, expect, it } from 'vitest';
import type { PortalDomain, PortalMenu } from '@prisma/client';
import { NavigationService } from '../src/modules/navigation.service';

describe('navigation filtering contract', () => {
  it('documents that parent menus are visible only when a child leaf is permitted', () => {
    const permissionPoints = ['base-portal.ops.orders'];
    const leaves = menus.filter((menu) => menu.isLeaf && menu.resourceKey && permissionPoints.includes(menu.resourceKey));
    const included = new Set(leaves.map((menu) => menu.id));
    for (const menu of menus) {
      if (menu.parentId && included.has(menu.id)) included.add(menu.parentId);
    }

    expect([...included].sort()).toEqual(['menu-ops-business', 'menu-ops-orders']);
  });

  it('includes the customer parent path when the customer view is permitted', () => {
    const permissionPoints = ['base-portal.ops.customers'];
    const leaves = menus.filter((menu) => menu.isLeaf && menu.resourceKey && permissionPoints.includes(menu.resourceKey));
    const included = new Set(leaves.map((menu) => menu.id));
    for (const menu of menus) {
      if (menu.parentId && included.has(menu.id)) included.add(menu.parentId);
    }

    expect([...included].sort()).toEqual(['menu-ops-customer', 'menu-ops-customers']);
  });

  it('returns no domains when the user has no leaf permissions', async () => {
    const service = new NavigationService(fakePrisma() as never);

    await expect(service.getNavigation([])).resolves.toEqual([]);
  });

  it('returns only the permitted package leaf and its parent for partial permissions', async () => {
    const service = new NavigationService(fakePrisma(demoDomain, demoMenus) as never);

    await expect(service.getNavigation(['base-portal.demo.embedded'])).resolves.toMatchObject([
      {
        key: 'demo-services',
        menus: [
          {
            key: 'demo-root',
            children: [{ key: 'demo-embedded', children: [] }]
          }
        ]
      }
    ]);
  });

  it('returns all package leaves when the user has all package permissions', async () => {
    const service = new NavigationService(fakePrisma(demoDomain, demoMenus) as never);
    const domains = await service.getNavigation(['base-portal.demo.embedded', 'base-portal.demo.new-tab']);

    expect(domains[0].menus[0].children.map((menu) => menu.key)).toEqual(['demo-embedded', 'demo-new-tab']);
  });
});

const domain: PortalDomain = {
  id: 'domain-operations',
  key: 'operations',
  name: '运营中心',
  description: 'desc',
  icon: 'PanelsTopLeft',
  coverColor: '#0f766e',
  sortOrder: 10,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

const menus: PortalMenu[] = [
  {
    id: 'menu-ops-customer',
    domainId: domain.id,
    parentId: null,
    key: 'ops-customer',
    title: '客户管理',
    icon: 'UsersRound',
    level: 1,
    sortOrder: 10,
    status: 'active',
    isLeaf: false,
    resourceKey: null,
    url: null,
    openMode: null,
    confirmOnClose: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'menu-ops-customers',
    domainId: domain.id,
    parentId: 'menu-ops-customer',
    key: 'ops-customers',
    title: '客户视图',
    icon: 'UsersRound',
    level: 2,
    sortOrder: 10,
    status: 'active',
    isLeaf: true,
    resourceKey: 'base-portal.ops.customers',
    url: '/placeholder/ops-customers',
    openMode: 'iframe',
    confirmOnClose: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'menu-ops-business',
    domainId: domain.id,
    parentId: null,
    key: 'ops-business',
    title: '业务办理',
    icon: 'FolderKanban',
    level: 1,
    sortOrder: 10,
    status: 'active',
    isLeaf: false,
    resourceKey: null,
    url: null,
    openMode: null,
    confirmOnClose: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'menu-ops-orders',
    domainId: domain.id,
    parentId: 'menu-ops-business',
    key: 'ops-orders',
    title: '订单中心',
    icon: 'ReceiptText',
    level: 2,
    sortOrder: 10,
    status: 'active',
    isLeaf: true,
    resourceKey: 'base-portal.ops.orders',
    url: '/placeholder/ops-orders',
    openMode: 'iframe',
    confirmOnClose: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

function fakePrisma(activeDomain: PortalDomain = domain, activeMenus: PortalMenu[] = menus) {
  return {
    portalDomain: {
      findMany: async () => [{ ...activeDomain, menus: activeMenus }]
    }
  };
}

const demoDomain: PortalDomain = {
  id: 'domain-demo-services',
  key: 'demo-services',
  name: '示例接入',
  description: 'desc',
  icon: 'Workflow',
  coverColor: '#0f766e',
  sortOrder: 90,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

const demoMenus: PortalMenu[] = [
  {
    id: 'menu-demo-root',
    domainId: demoDomain.id,
    parentId: null,
    key: 'demo-root',
    title: '示例系统',
    icon: 'FolderKanban',
    level: 1,
    sortOrder: 10,
    status: 'active',
    isLeaf: false,
    resourceKey: null,
    url: null,
    openMode: null,
    confirmOnClose: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'menu-demo-embedded',
    domainId: demoDomain.id,
    parentId: 'menu-demo-root',
    key: 'demo-embedded',
    title: '内嵌入口',
    icon: 'PanelsTopLeft',
    level: 2,
    sortOrder: 10,
    status: 'active',
    isLeaf: true,
    resourceKey: 'base-portal.demo.embedded',
    url: '/placeholder/demo-embedded',
    openMode: 'iframe',
    confirmOnClose: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'menu-demo-new-tab',
    domainId: demoDomain.id,
    parentId: 'menu-demo-root',
    key: 'demo-new-tab',
    title: '新窗口入口',
    icon: 'ExternalLink',
    level: 2,
    sortOrder: 20,
    status: 'active',
    isLeaf: true,
    resourceKey: 'base-portal.demo.new-tab',
    url: '/placeholder/demo-new-tab',
    openMode: 'new_tab',
    confirmOnClose: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
