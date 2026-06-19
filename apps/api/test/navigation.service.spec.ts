import { describe, expect, it } from 'vitest';
import type { PortalDomain, PortalMenu } from '@prisma/client';

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
