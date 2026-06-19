import { describe, expect, it } from 'vitest';
import {
  closeAllTabs,
  closeOtherTabs,
  createHomeTabId,
  createInitialWorkspace,
  openMenuTab,
  refreshTabFrame,
  reorderTabs,
  switchDomain
} from './workspace';
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

  it('opens new_tab menus as internal iframe tabs by default', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, {
      ...menu,
      id: 'menu-ops-external',
      openMode: 'new_tab'
    }).state;

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toMatchObject({
      id: 'menu:menu-ops-external',
      openMode: 'iframe',
      refreshKey: 0
    });
  });

  it('opens immersive_iframe menus as internal iframe tabs by default', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, {
      ...menu,
      id: 'menu-ops-immersive',
      openMode: 'immersive_iframe'
    }).state;

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toMatchObject({
      openMode: 'iframe',
      refreshKey: 0
    });
  });

  it('opens menus without an open mode as internal iframe tabs by default', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, {
      ...menu,
      id: 'menu-ops-default',
      openMode: null
    }).state;

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toMatchObject({
      openMode: 'iframe',
      refreshKey: 0
    });
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

  it('close other tabs keeps the target tab and exits maximized state', () => {
    const first = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;
    const second = openMenuTab(first, domain, {
      ...menu,
      id: 'menu-ops-invoices',
      key: 'ops-invoices',
      title: '发票中心'
    }).state;
    const maximized = { ...second, maximized: true };

    expect(closeOtherTabs(maximized, 'menu:menu-ops-invoices')).toMatchObject({
      activeTabId: 'menu:menu-ops-invoices',
      maximized: false
    });
    expect(closeOtherTabs(maximized, 'menu:menu-ops-invoices').tabs).toHaveLength(1);
  });

  it('close other tabs ignores an unknown target tab instead of closing everything', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;

    expect(closeOtherTabs(state, 'menu:missing')).toBe(state);
  });

  it('reorders business tabs before a target while preserving active and maximized state', () => {
    const state = openThreeTabs();
    const maximized = { ...state, activeTabId: 'menu:menu-ops-orders', maximized: true };

    const reordered = reorderTabs(maximized, 'menu:menu-ops-audit', 'menu:menu-ops-invoices', 'before');

    expect(reordered.tabs.map((tab) => tab.id)).toEqual([
      'menu:menu-ops-orders',
      'menu:menu-ops-audit',
      'menu:menu-ops-invoices'
    ]);
    expect(reordered.activeTabId).toBe('menu:menu-ops-orders');
    expect(reordered.maximized).toBe(true);
    expect(reordered.tabs.find((tab) => tab.id === 'menu:menu-ops-audit')).toMatchObject({
      openMode: 'iframe',
      confirmOnClose: true
    });
  });

  it('reorders business tabs after a target without moving the fixed home tab', () => {
    const state = openThreeTabs();

    const reordered = reorderTabs(state, 'menu:menu-ops-orders', 'menu:menu-ops-audit', 'after');

    expect(reordered.tabs.map((tab) => tab.id)).toEqual([
      'menu:menu-ops-invoices',
      'menu:menu-ops-audit',
      'menu:menu-ops-orders'
    ]);
    expect(reordered.activeTabId).toBe(state.activeTabId);
    expect(createHomeTabId(reordered.activeDomainKey)).toBe('home:operations');
  });

  it('keeps invalid reorder requests as no-ops', () => {
    const state = openThreeTabs();

    expect(reorderTabs(state, 'menu:missing', 'menu:menu-ops-orders', 'before')).toBe(state);
    expect(reorderTabs(state, 'menu:menu-ops-orders', 'menu:missing', 'after')).toBe(state);
    expect(reorderTabs(state, 'menu:menu-ops-orders', 'menu:menu-ops-orders', 'before')).toBe(state);
    expect(reorderTabs(state, 'menu:menu-ops-orders', 'menu:menu-ops-invoices', 'before')).toBe(state);
  });

  it('refreshes only the target business tab frame revision', () => {
    const state = openThreeTabs();
    const maximized = { ...state, activeTabId: 'menu:menu-ops-orders', maximized: true };

    const refreshed = refreshTabFrame(maximized, 'menu:menu-ops-invoices');

    expect(refreshed.activeTabId).toBe('menu:menu-ops-orders');
    expect(refreshed.maximized).toBe(true);
    expect(refreshed.tabs.map((tab) => tab.id)).toEqual(state.tabs.map((tab) => tab.id));
    expect(refreshed.tabs.find((tab) => tab.id === 'menu:menu-ops-orders')?.refreshKey).toBe(0);
    expect(refreshed.tabs.find((tab) => tab.id === 'menu:menu-ops-invoices')?.refreshKey).toBe(1);
    expect(refreshed.tabs.find((tab) => tab.id === 'menu:menu-ops-audit')?.refreshKey).toBe(0);
  });

  it('keeps refresh requests for a missing tab as no-ops', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;

    expect(refreshTabFrame(state, 'menu:missing')).toBe(state);
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

function openThreeTabs() {
  const first = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;
  const second = openMenuTab(first, domain, {
    ...menu,
    id: 'menu-ops-invoices',
    key: 'ops-invoices',
    title: '发票中心'
  }).state;
  return openMenuTab(second, domain, {
    ...menu,
    id: 'menu-ops-audit',
    key: 'ops-audit',
    title: '审计工作台',
    confirmOnClose: true
  }).state;
}
