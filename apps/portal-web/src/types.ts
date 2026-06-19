export type PortalUser = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type SessionResponse = {
  authenticated: boolean;
  user?: PortalUser;
  permissionPoints?: string[];
};

export type OpenMode = 'iframe' | 'immersive_iframe' | 'new_tab';
export type WorkspaceOpenMode = 'iframe';

export type NavigationMenu = {
  id: string;
  key: string;
  title: string;
  icon: string;
  level: number;
  isLeaf: boolean;
  resourceKey: string | null;
  url: string | null;
  openMode: OpenMode | null;
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

export type NavigationResponse = {
  domains: NavigationDomain[];
};

export type WorkspaceTab = {
  id: string;
  menuId: string;
  domainKey: string;
  domainName: string;
  title: string;
  url: string;
  openMode: WorkspaceOpenMode;
  refreshKey: number;
  confirmOnClose: boolean;
};
