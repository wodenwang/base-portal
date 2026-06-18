import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const domains = [
  {
    id: 'domain-operations',
    key: 'operations',
    name: '运营中心',
    description: '统一进入运营类系统，处理日常业务、数据维护和跨系统协作。',
    icon: 'PanelsTopLeft',
    coverColor: '#0f766e',
    sortOrder: 10
  },
  {
    id: 'domain-management',
    key: 'management',
    name: '管理驾驶舱',
    description: '面向管理视角的系统入口，用于查看组织、流程和经营相关系统。',
    icon: 'LayoutDashboard',
    coverColor: '#4f46e5',
    sortOrder: 20
  },
  {
    id: 'domain-services',
    key: 'services',
    name: '共享服务',
    description: '集中访问公共能力、内部工具和共享服务系统。',
    icon: 'Boxes',
    coverColor: '#b45309',
    sortOrder: 30
  }
];

const menus = [
  {
    id: 'menu-ops-business',
    domainId: 'domain-operations',
    key: 'ops-business',
    title: '业务办理',
    icon: 'FolderKanban',
    level: 1,
    sortOrder: 10,
    isLeaf: false
  },
  {
    id: 'menu-ops-orders',
    domainId: 'domain-operations',
    parentId: 'menu-ops-business',
    key: 'ops-orders',
    title: '订单中心',
    icon: 'ReceiptText',
    level: 2,
    sortOrder: 10,
    isLeaf: true,
    resourceKey: 'base-portal.ops.orders',
    url: '/placeholder/ops-orders',
    openMode: 'iframe'
  },
  {
    id: 'menu-ops-customers',
    domainId: 'domain-operations',
    parentId: 'menu-ops-business',
    key: 'ops-customers',
    title: '客户视图',
    icon: 'UsersRound',
    level: 2,
    sortOrder: 20,
    isLeaf: true,
    resourceKey: 'base-portal.ops.customers',
    url: '/placeholder/ops-customers',
    openMode: 'immersive_iframe',
    confirmOnClose: true
  },
  {
    id: 'menu-mgmt-overview',
    domainId: 'domain-management',
    key: 'mgmt-overview',
    title: '经营概览',
    icon: 'ChartNoAxesCombined',
    level: 1,
    sortOrder: 10,
    isLeaf: true,
    resourceKey: 'base-portal.management.overview',
    url: '/placeholder/mgmt-overview',
    openMode: 'iframe'
  },
  {
    id: 'menu-mgmt-workflow',
    domainId: 'domain-management',
    key: 'mgmt-workflow',
    title: '流程管理',
    icon: 'Workflow',
    level: 1,
    sortOrder: 20,
    isLeaf: false
  },
  {
    id: 'menu-mgmt-approval',
    domainId: 'domain-management',
    parentId: 'menu-mgmt-workflow',
    key: 'mgmt-approval',
    title: '审批中心',
    icon: 'ListChecks',
    level: 2,
    sortOrder: 10,
    isLeaf: true,
    resourceKey: 'base-portal.management.approval',
    url: '/placeholder/mgmt-approval',
    openMode: 'new_tab'
  },
  {
    id: 'menu-svc-tools',
    domainId: 'domain-services',
    key: 'svc-tools',
    title: '内部工具',
    icon: 'Wrench',
    level: 1,
    sortOrder: 10,
    isLeaf: false
  },
  {
    id: 'menu-svc-docs',
    domainId: 'domain-services',
    parentId: 'menu-svc-tools',
    key: 'svc-docs',
    title: '文档中心',
    icon: 'BookOpen',
    level: 2,
    sortOrder: 10,
    isLeaf: true,
    resourceKey: 'base-portal.services.docs',
    url: '/placeholder/svc-docs',
    openMode: 'iframe'
  }
];

async function main(): Promise<void> {
  for (const domain of domains) {
    await prisma.portalDomain.upsert({
      where: { key: domain.key },
      update: domain,
      create: domain
    });
  }

  for (const menu of menus) {
    await prisma.portalMenu.upsert({
      where: { key: menu.key },
      update: menu,
      create: menu
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
