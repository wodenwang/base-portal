import { describe, expect, it } from 'vitest';
import {
  closeAllTabs,
  closeOtherTabs,
  createHomeTabId,
  createInitialWorkspace,
  exitImmersiveTab,
  openMenuTab,
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
      openMode: 'iframe'
    });
  });

  it('opens immersive_iframe menus as internal iframe tabs by default', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, {
      ...menu,
      id: 'menu-ops-immersive',
      openMode: 'immersive_iframe'
    }).state;

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]?.openMode).toBe('iframe');
  });

  it('opens menus without an open mode as internal iframe tabs by default', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, {
      ...menu,
      id: 'menu-ops-default',
      openMode: null
    }).state;

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]?.openMode).toBe('iframe');
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

  it('exits immersive mode by restoring the tab to iframe mode', () => {
    const state = openMenuTab(createInitialWorkspace([domain]), domain, menu).state;
    const immersive = {
      ...state,
      maximized: true,
      tabs: state.tabs.map((tab) => ({ ...tab, openMode: 'immersive_iframe' as const }))
    };

    expect(exitImmersiveTab(immersive, `menu:${menu.id}`)).toMatchObject({
      maximized: false,
      tabs: [
        expect.objectContaining({
          openMode: 'iframe'
        })
      ]
    });
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
