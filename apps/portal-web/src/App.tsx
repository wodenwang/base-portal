import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import {
  Bell,
  Boxes,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  ExternalLink,
  FolderKanban,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  MoreVertical,
  PanelsTopLeft,
  RefreshCw,
  ReceiptText,
  Search,
  UserCircle,
  UsersRound,
  Workflow,
  Wrench,
  X
} from 'lucide-react';
import { fetchNavigation, fetchSession, logout, recordMenuOpened } from './api';
import type { NavigationDomain, NavigationMenu, PortalUser, WorkspaceTab } from './types';
import {
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  createHomeTabId,
  createInitialWorkspace,
  exitImmersiveTab,
  hasConfirmTabs,
  openMenuTab,
  switchDomain,
  type WorkspaceState
} from './workspace';

const icons = {
  Boxes,
  BookOpen,
  ChartNoAxesCombined,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  PanelsTopLeft,
  ReceiptText,
  UsersRound,
  Workflow,
  Wrench
};

export function App(): ReactElement {
  if (window.location.pathname.startsWith('/placeholder/')) {
    return <PlaceholderPage menuKey={window.location.pathname.split('/').pop() ?? 'unknown'} />;
  }

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [domains, setDomains] = useState<NavigationDomain[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap(): Promise<void> {
    setLoading(true);
    setBootstrapError(null);
    try {
      const session = await fetchSession();
      if (!session.authenticated || !session.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const navigation = await fetchNavigation();
      setUser(session.user);
      setDomains(navigation.domains);
      setWorkspace(createInitialWorkspace(navigation.domains));
    } catch {
      setBootstrapError('门户初始化失败，请刷新页面重试。');
    } finally {
      setLoading(false);
    }
  }

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.key === workspace?.activeDomainKey) ?? domains[0],
    [domains, workspace?.activeDomainKey]
  );
  const activeBusinessTab = workspace?.tabs.find((tab) => tab.id === workspace.activeTabId) ?? null;
  const activeMenuId = activeBusinessTab?.menuId ?? null;
  const isHomeActive = workspace ? workspace.activeTabId === createHomeTabId(workspace.activeDomainKey) : false;
  const isImmersive = activeBusinessTab?.openMode === 'immersive_iframe';
  const isMaximized = workspace?.maximized ?? false;

  if (loading) return <LoadingScreen />;
  if (bootstrapError) return <ErrorScreen message={bootstrapError} onRetry={() => void bootstrap()} />;
  if (!user || !workspace || !activeDomain) return <LoginScreen />;

  function requireWorkspace(): WorkspaceState {
    if (!workspace) throw new Error('workspace is not initialized');
    return workspace;
  }

  function handleDomainSwitch(domain: NavigationDomain): void {
    const current = requireWorkspace();
    if (domain.key === current.activeDomainKey) return;
    const count = current.tabs.length;
    if (count > 0 && !window.confirm(`切换功能域将关闭当前 ${count} 个业务标签页，是否继续？`)) return;
    setWorkspace(switchDomain(current, domain.key));
    setMobileMenuOpen(false);
  }

  function handleOpenMenu(menu: NavigationMenu): void {
    if (!menu.isLeaf || !menu.url) return;
    void recordMenuOpened({
      domainKey: activeDomain.key,
      domainName: activeDomain.name,
      menuId: menu.id,
      menuTitle: menu.title,
      openMode: menu.openMode ?? 'iframe'
    });
    const result = openMenuTab(requireWorkspace(), activeDomain, menu);
    if (result.reason === 'limit') {
      window.alert('最多同时打开 20 个业务标签页，请关闭已有标签页后再打开。');
      return;
    }
    setWorkspace(result.state);
    setMobileMenuOpen(false);
  }

  function confirmClose(tabs: WorkspaceTab[]): boolean {
    if (!hasConfirmTabs(tabs)) return true;
    return window.confirm('将关闭包含重要页面的标签页，是否继续？');
  }

  function handleCloseTab(tabId: string): void {
    const current = requireWorkspace();
    const tab = current.tabs.find((item) => item.id === tabId);
    if (!tab || !confirmClose([tab])) return;
    setWorkspace(closeTab(current, tabId));
  }

  function handleCloseAll(): void {
    const current = requireWorkspace();
    if (current.tabs.length === 0 || !confirmClose(current.tabs)) return;
    setWorkspace(closeAllTabs(current));
  }

  function handleCloseOthers(tabId?: string): void {
    const current = requireWorkspace();
    const targetTabId = tabId ?? current.activeTabId;
    const closing = current.tabs.filter((tab) => tab.id !== targetTabId);
    if (closing.length === 0 || !confirmClose(closing)) return;
    setWorkspace(closeOtherTabs(current, targetTabId));
  }

  function handleMaximizeTab(tabId: string): void {
    setWorkspace({ ...requireWorkspace(), activeTabId: tabId, maximized: true });
  }

  async function handleLogout(): Promise<void> {
    await logout();
    window.location.href = '/';
  }

  const shellClass = [
    'app-shell',
    sidebarCollapsed ? 'sidebar-collapsed' : '',
    isImmersive ? 'immersive' : '',
    isMaximized ? 'maximized' : ''
  ].join(' ');

  return (
    <main className={shellClass}>
      {!isMaximized && (
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileMenuOpen(true)} aria-label="打开菜单">
            <Menu size={18} />
          </button>
          <div className="brand">
            <span className="brand-mark">BP</span>
            <span>Base Portal</span>
          </div>
          {!isImmersive && <DomainNav domains={domains} activeKey={activeDomain.key} onSwitch={handleDomainSwitch} />}
          <div className="user-area">
            <div className="topbar-tools" aria-label="门户工具">
              <button className="icon-button" type="button" aria-label="搜索" title="搜索">
                <Search size={18} />
              </button>
              <button className="icon-button" type="button" aria-label="帮助" title="帮助">
                <CircleHelp size={18} />
              </button>
              <button className="icon-button" type="button" aria-label="通知" title="通知">
                <Bell size={18} />
              </button>
            </div>
            <UserMenu user={user} onLogout={() => void handleLogout()} />
          </div>
        </header>
      )}

      <section className="body">
        {!isImmersive && !isMaximized && (
          <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
              <span>{sidebarCollapsed ? '菜单' : activeDomain.name}</span>
              <button className="icon-button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label="收起菜单">
                {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              </button>
              <button className="icon-button mobile-only" onClick={() => setMobileMenuOpen(false)} aria-label="关闭菜单">
                <X size={16} />
              </button>
            </div>
            <button
              className={`workbench-link ${isHomeActive ? 'active' : ''}`}
              type="button"
              onClick={() => setWorkspace({ ...workspace, activeTabId: createHomeTabId(activeDomain.key), maximized: false })}
            >
              <Home size={17} />
              {!sidebarCollapsed && <span>工作台</span>}
            </button>
            <MenuTree
              menus={activeDomain.menus}
              collapsed={sidebarCollapsed}
              activeMenuId={activeMenuId}
              onOpen={handleOpenMenu}
            />
          </aside>
        )}

        <section className="workspace">
          {!isMaximized && (
            <TabStrip
              domain={activeDomain}
              workspace={workspace}
              onActivate={(tabId) => setWorkspace({ ...workspace, activeTabId: tabId, maximized: false })}
              onClose={handleCloseTab}
              onCloseAll={handleCloseAll}
              onCloseOthers={handleCloseOthers}
              onMaximize={handleMaximizeTab}
              onExitImmersive={() => {
                if (activeBusinessTab) {
                  setWorkspace(exitImmersiveTab(workspace, activeBusinessTab.id));
                }
              }}
              immersive={isImmersive}
            />
          )}
          <div className="workspace-content">
            {isHomeActive ? (
              <DomainHome domain={activeDomain} />
            ) : activeBusinessTab ? (
              <EmbedFrame
                tab={activeBusinessTab}
                maximized={isMaximized}
                onExitMaximize={() => setWorkspace({ ...workspace, maximized: false })}
              />
            ) : (
              <DomainHome domain={activeDomain} />
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function UserMenu(props: { user: PortalUser; onLogout: () => void }): ReactElement {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }
    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest('.user-menu')) setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <div className="user-menu">
      <button
        className="user-menu-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={props.user.name}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar" aria-hidden="true">
          {props.user.avatarUrl ? <img src={props.user.avatarUrl} alt="" /> : <UserCircle size={20} />}
        </span>
        <span className="user-name">{props.user.name}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown-menu user-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              props.onLogout();
            }}
          >
            <LogOut size={15} />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingScreen(): ReactElement {
  return <div className="center-screen">正在加载 Base Portal...</div>;
}

function ErrorScreen(props: { message: string; onRetry: () => void }): ReactElement {
  return (
    <div className="center-screen">
      <div className="status-panel">
        <h1>Base Portal</h1>
        <p>{props.message}</p>
        <button className="primary-button" onClick={props.onRetry}>重试</button>
      </div>
    </div>
  );
}

function LoginScreen(): ReactElement {
  return (
    <div className="login-screen">
      <div className="login-panel">
        <span className="brand-mark">BP</span>
        <h1>Base Portal</h1>
        <p>企业门户入口，使用 Feishu IAM 登录后访问已授权的系统菜单。</p>
        <a className="primary-button" href="/api/auth/login">使用 Feishu IAM 登录</a>
        <a className="secondary-link" href="/api/auth/mock-login">本地 mock 登录</a>
      </div>
    </div>
  );
}

function DomainNav(props: {
  domains: NavigationDomain[];
  activeKey: string;
  onSwitch: (domain: NavigationDomain) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const activeDomain = props.domains.find((domain) => domain.key === props.activeKey) ?? props.domains[0];

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }
    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest('.domain-nav')) setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <nav className="domain-nav" aria-label="功能域">
      <button
        className="domain-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        title={activeDomain?.name}
      >
        <PanelsTopLeft size={16} />
        <span>{activeDomain?.name ?? '功能域'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown-menu domain-dropdown" role="menu">
          {props.domains.map((domain) => (
            <button
              key={domain.key}
              type="button"
              role="menuitem"
              className={domain.key === props.activeKey ? 'active' : ''}
              onClick={() => {
                setOpen(false);
                props.onSwitch(domain);
              }}
              title={domain.name}
            >
              <span>{domain.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="domain-inline-list" aria-hidden="true">
        {props.domains.slice(0, 3).map((domain) => (
        <button
          key={domain.key}
          className={domain.key === props.activeKey ? 'active' : ''}
          onClick={() => props.onSwitch(domain)}
          tabIndex={-1}
        >
          {domain.name}
        </button>
        ))}
      </div>
    </nav>
  );
}

function MenuTree(props: {
  menus: NavigationMenu[];
  collapsed: boolean;
  activeMenuId: string | null;
  onOpen: (menu: NavigationMenu) => void;
}): ReactElement {
  return (
    <div className="menu-tree">
      {props.menus.map((menu) => (
        <MenuNode
          key={menu.id}
          menu={menu}
          collapsed={props.collapsed}
          activeMenuId={props.activeMenuId}
          onOpen={props.onOpen}
        />
      ))}
    </div>
  );
}

function MenuNode(props: {
  menu: NavigationMenu;
  collapsed: boolean;
  activeMenuId: string | null;
  onOpen: (menu: NavigationMenu) => void;
}): ReactElement {
  const Icon = icons[props.menu.icon as keyof typeof icons] ?? PanelsTopLeft;
  const active = props.activeMenuId === props.menu.id;
  return (
    <div className={`menu-node level-${props.menu.level}`}>
      <button
        className={`${props.menu.isLeaf ? 'menu-leaf' : 'menu-group'} ${active ? 'active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => props.menu.isLeaf && props.onOpen(props.menu)}
        title={props.collapsed ? props.menu.title : undefined}
      >
        <Icon size={17} />
        {!props.collapsed && <span>{props.menu.title}</span>}
        {!props.collapsed && !props.menu.isLeaf && <ChevronDown className="menu-chevron" size={14} />}
      </button>
      {!props.collapsed && props.menu.children.length > 0 && (
        <div className="menu-children">
          {props.menu.children.map((child) => (
            <MenuNode
              key={child.id}
              menu={child}
              collapsed={props.collapsed}
              activeMenuId={props.activeMenuId}
              onOpen={props.onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabStrip(props: {
  domain: NavigationDomain;
  workspace: WorkspaceState;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onCloseAll: () => void;
  onCloseOthers: (tabId?: string) => void;
  onMaximize: (tabId: string) => void;
  onExitImmersive: () => void;
  immersive: boolean;
}): ReactElement {
  const homeId = createHomeTabId(props.domain.key);
  const [contextMenu, setContextMenu] = useState<{
    tab: WorkspaceTab;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setContextMenu(null);
    }
    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest('.tab-context-menu')) setContextMenu(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [contextMenu]);

  function closeContextMenu(): void {
    setContextMenu(null);
  }

  return (
    <div className="tab-strip">
      <div className="tabs-scroll">
        <button
          className={`tab fixed ${props.workspace.activeTabId === homeId ? 'active' : ''}`}
          onClick={() => props.onActivate(homeId)}
          title={props.domain.name}
        >
          {props.domain.name}
        </button>
        {props.workspace.tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${props.workspace.activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => props.onActivate(tab.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              props.onActivate(tab.id);
              setContextMenu({ tab, x: event.clientX, y: event.clientY });
            }}
            title={tab.title}
          >
            <span>{tab.title}</span>
            <span
              className="tab-close"
              title="关闭当前标签"
              onClick={(event) => {
                event.stopPropagation();
                props.onClose(tab.id);
              }}
            >
              <X size={13} />
            </span>
          </button>
        ))}
      </div>
      <div className="tab-actions">
        {props.immersive && <button onClick={props.onExitImmersive}>退出沉浸</button>}
        <button className="icon-button" type="button" aria-label="标签操作提示" title="右键业务标签打开更多操作">
          <MoreVertical size={16} />
        </button>
      </div>
      {contextMenu && (
        <div
          className="dropdown-menu tab-context-menu"
          role="menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              window.open(contextMenu.tab.url, '_blank', 'noopener,noreferrer');
              closeContextMenu();
            }}
          >
            <ExternalLink size={15} />
            <span>新窗口打开</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              props.onMaximize(contextMenu.tab.id);
              closeContextMenu();
            }}
          >
            <Maximize2 size={15} />
            <span>最大化</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              props.onClose(contextMenu.tab.id);
              closeContextMenu();
            }}
          >
            <X size={15} />
            <span>关闭当前</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              props.onCloseOthers(contextMenu.tab.id);
              closeContextMenu();
            }}
          >
            <span>关闭其他</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              props.onCloseAll();
              closeContextMenu();
            }}
          >
            <span>关闭全部</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DomainHome({ domain }: { domain: NavigationDomain }): ReactElement {
  const Icon = icons[domain.icon as keyof typeof icons] ?? PanelsTopLeft;
  return (
    <section className="domain-home" style={{ '--cover': domain.coverColor } as CSSProperties}>
      <div className="domain-orb">
        <Icon size={34} />
      </div>
      <div>
        <p className="eyebrow">当前功能域</p>
        <h1>{domain.name}</h1>
        <p>{domain.description}</p>
      </div>
    </section>
  );
}

function EmbedFrame(props: {
  tab: WorkspaceTab;
  maximized: boolean;
  onExitMaximize: () => void;
}): ReactElement {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, [props.tab.url]);

  return (
    <div className="embed-shell">
      {props.maximized && (
        <button className="maximize-exit" type="button" onClick={props.onExitMaximize}>
          <Minimize2 size={15} />
          <span>退出最大化</span>
        </button>
      )}
      {timedOut && !loaded && (
        <div className="fallback-panel">
          <strong>页面可能无法加载</strong>
          <span>你可以刷新当前页、复制链接，或在新窗口打开。</span>
          <div>
            <button onClick={() => window.location.reload()}>
              <RefreshCw size={14} /> 刷新
            </button>
            <button onClick={() => void navigator.clipboard?.writeText(props.tab.url)}>复制链接</button>
            <button onClick={() => window.open(props.tab.url, '_blank', 'noopener,noreferrer')}>新窗口打开</button>
          </div>
        </div>
      )}
      <iframe title={props.tab.title} src={props.tab.url} onLoad={() => setLoaded(true)} />
    </div>
  );
}

function PlaceholderPage({ menuKey }: { menuKey: string }): ReactElement {
  return (
    <div className="placeholder-page">
      <div>
        <p>Base Portal 占位页</p>
        <h1>{menuKey}</h1>
      </div>
    </div>
  );
}
