import { describe, expect, it } from 'vitest';
import { closeAllTabs, createHomeTabId, createInitialWorkspace, openMenuTab, switchDomain } from './workspace';
import type { NavigationDomain, NavigationMenu } from './types';

describe('workspace model', () => {
  it('does not count fixed home tab as a business tab', () => {
    const state = createInitialWorkspace([domain]);
    expect(state.activeTabId).toBe(createHomeTabId(domain.key));
    expect(state.tabs).toHaveLength(0);
  });

  it('opens the same menu as a single tab instance', () => {
    const first = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;
    const second = openMenuTab(first, domain, menu).state;
    expect(second.tabs).toHaveLength(1);
    expect(second.activeTabId).toBe(`menu:${menu.id}`);
  });

  it('clears business tabs when switching domains', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;
    expect(switchDomain(state, 'management')).toMatchObject({
      activeDomainKey: 'management',
      activeTabId: 'home:management',
      tabs: []
    });
  });

  it('close all returns to the active domain home tab', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;
    expect(closeAllTabs(state).activeTabId).toBe('home:operations');
  });
});

const menu: NavigationMenu = {
  id: 'menu-ops-orders',
  key: 'ops-orders',
  title: '订单中心',
  icon: 'ReceiptText',
  level: 2,
  isLeaf: true,
  resourceKey: 'base-portal.ops.orders',
  url: '/placeholder/ops-orders',
  openMode: 'iframe',
  confirmOnClose: false,
  children: []
};

const domain: NavigationDomain = {
  id: 'domain-operations',
  key: 'operations',
  name: '运营中心',
  description: '统一进入运营类系统。',
  icon: 'PanelsTopLeft',
  coverColor: '#0f766e',
  menus: [menu]
};
