import type { NavigationDomain, NavigationMenu, WorkspaceTab } from './types';

export const MAX_BUSINESS_TABS = 20;

export type WorkspaceState = {
  activeDomainKey: string;
  activeTabId: string;
  tabs: WorkspaceTab[];
  maximized: boolean;
};

export function createHomeTabId(domainKey: string): string {
  return `home:${domainKey}`;
}

export function createInitialWorkspace(domains: NavigationDomain[]): WorkspaceState {
  const domain = domains[0];
  return {
    activeDomainKey: domain?.key ?? '',
    activeTabId: domain ? createHomeTabId(domain.key) : '',
    tabs: [],
    maximized: false
  };
}

export function switchDomain(state: WorkspaceState, domainKey: string): WorkspaceState {
  return {
    activeDomainKey: domainKey,
    activeTabId: createHomeTabId(domainKey),
    tabs: [],
    maximized: false
  };
}

export function openMenuTab(
  state: WorkspaceState,
  domain: NavigationDomain,
  menu: NavigationMenu
): { state: WorkspaceState; opened: boolean; reason?: 'limit' | 'invalid' } {
  if (!menu.isLeaf || !menu.url) {
    return { state, opened: false, reason: 'invalid' };
  }
  const existing = state.tabs.find((tab) => tab.menuId === menu.id);
  if (existing) {
    return { state: { ...state, activeTabId: existing.id, maximized: false }, opened: false };
  }
  if (state.tabs.length >= MAX_BUSINESS_TABS) {
    return { state, opened: false, reason: 'limit' };
  }
  const tab: WorkspaceTab = {
    id: `menu:${menu.id}`,
    menuId: menu.id,
    domainKey: domain.key,
    domainName: domain.name,
    title: menu.title,
    url: menu.url,
    openMode: 'iframe',
    confirmOnClose: menu.confirmOnClose
  };
  return {
    state: {
      ...state,
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
      maximized: false
    },
    opened: true
  };
}

export function closeTab(state: WorkspaceState, tabId: string): WorkspaceState {
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) return state;
  const tabs = state.tabs.filter((tab) => tab.id !== tabId);
  const activeTabId =
    state.activeTabId === tabId
      ? tabs[Math.max(0, index - 1)]?.id ?? createHomeTabId(state.activeDomainKey)
      : state.activeTabId;
  return { ...state, tabs, activeTabId, maximized: false };
}

export function closeAllTabs(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    tabs: [],
    activeTabId: createHomeTabId(state.activeDomainKey),
    maximized: false
  };
}

export function closeOtherTabs(state: WorkspaceState, tabId: string): WorkspaceState {
  const target = state.tabs.find((tab) => tab.id === tabId);
  if (!target) return state;
  return {
    ...state,
    tabs: [target],
    activeTabId: target.id,
    maximized: false
  };
}

export function hasConfirmTabs(tabs: WorkspaceTab[]): boolean {
  return tabs.some((tab) => tab.confirmOnClose);
}

export function exitImmersiveTab(state: WorkspaceState, tabId: string): WorkspaceState {
  return {
    ...state,
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, openMode: 'iframe' } : tab)),
    maximized: false
  };
}

export function enterImmersiveTab(state: WorkspaceState, tabId: string): WorkspaceState {
  return {
    ...state,
    activeTabId: tabId,
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, openMode: 'immersive_iframe' } : tab)),
    maximized: false
  };
}
