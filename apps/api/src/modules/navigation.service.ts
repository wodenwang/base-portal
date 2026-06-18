import { Injectable } from '@nestjs/common';
import type { PortalDomain, PortalMenu } from '@prisma/client';
import { PrismaService } from './prisma.service';

export type NavigationMenu = {
  id: string;
  key: string;
  title: string;
  icon: string;
  level: number;
  isLeaf: boolean;
  resourceKey: string | null;
  url: string | null;
  openMode: string | null;
  confirmOnClose: boolean;
  children: NavigationMenu[];
};

export type NavigationDomain = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  coverColor: string;
  menus: NavigationMenu[];
};

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNavigation(permissionPoints: string[]): Promise<NavigationDomain[]> {
    const domains = await this.prisma.portalDomain.findMany({
      where: { status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        menus: {
          where: { status: 'active' },
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
        }
      }
    });

    return domains
      .map((domain) => buildDomain(domain, permissionPoints))
      .filter((domain) => domain.menus.length > 0);
  }
}

function buildDomain(domain: PortalDomain & { menus: PortalMenu[] }, permissionPoints: string[]): NavigationDomain {
  const visibleLeaves = new Set(
    domain.menus
      .filter((menu) => menu.isLeaf && menu.resourceKey && permissionPoints.includes(menu.resourceKey))
      .map((menu) => menu.id)
  );
  const included = new Set<string>(visibleLeaves);
  let changed = true;
  while (changed) {
    changed = false;
    for (const menu of domain.menus) {
      if (menu.parentId && included.has(menu.id) && !included.has(menu.parentId)) {
        included.add(menu.parentId);
        changed = true;
      }
    }
  }

  const menusByParent = new Map<string | null, PortalMenu[]>();
  for (const menu of domain.menus) {
    if (!included.has(menu.id)) continue;
    const bucket = menusByParent.get(menu.parentId) ?? [];
    bucket.push(menu);
    menusByParent.set(menu.parentId, bucket);
  }

  return {
    id: domain.id,
    key: domain.key,
    name: domain.name,
    description: domain.description,
    icon: domain.icon,
    coverColor: domain.coverColor,
    menus: buildMenuTree(menusByParent, null)
  };
}

function buildMenuTree(menusByParent: Map<string | null, PortalMenu[]>, parentId: string | null): NavigationMenu[] {
  return (menusByParent.get(parentId) ?? []).map((menu) => ({
    id: menu.id,
    key: menu.key,
    title: menu.title,
    icon: menu.icon,
    level: menu.level,
    isLeaf: menu.isLeaf,
    resourceKey: menu.resourceKey,
    url: menu.url,
    openMode: menu.openMode,
    confirmOnClose: menu.confirmOnClose,
    children: buildMenuTree(menusByParent, menu.id)
  }));
}
