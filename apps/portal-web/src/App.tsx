import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import {
  Boxes,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Maximize2,
  Menu,
  PanelsTopLeft,
  RefreshCw,
  ReceiptText,
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
    if (!menu.isLeaf || !menu.url || !menu.openMode) return;
    void recordMenuOpened({
      domainKey: activeDomain.key,
      domainName: activeDomain.name,
      menuId: menu.id,
      menuTitle: menu.title,
      openMode: menu.openMode
    });
    if (menu.openMode === 'new_tab') {
      window.open(menu.url, '_blank', 'noopener,noreferrer');
      return;
    }
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

  function handleCloseOthers(): void {
    const current = requireWorkspace();
    const closing = current.tabs.filter((tab) => tab.id !== current.activeTabId);
    if (closing.length === 0 || !confirmClose(closing)) return;
    setWorkspace(closeOtherTabs(current, current.activeTabId));
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
            <UserCircle size={20} />
            <span>{user.name}</span>
            <button className="text-button" onClick={() => void handleLogout()}>退出</button>
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
            <MenuTree menus={activeDomain.menus} collapsed={sidebarCollapsed} onOpen={handleOpenMenu} />
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
              onExitImmersive={() => {
                if (activeBusinessTab) {
                  setWorkspace({
                    ...workspace,
                    tabs: workspace.tabs.map((tab) =>
                      tab.id === activeBusinessTab.id ? { ...tab, openMode: 'iframe' as const } : tab
                    )
                  });
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
                onToggleMaximize={() => setWorkspace({ ...workspace, maximized: !workspace.maximized })}
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
  return (
    <nav className="domain-nav" aria-label="功能域">
      {props.domains.slice(0, 8).map((domain) => (
        <button
          key={domain.key}
          className={domain.key === props.activeKey ? 'active' : ''}
          onClick={() => props.onSwitch(domain)}
        >
          {domain.name}
        </button>
      ))}
      {props.domains.length > 8 && (
        <button className="more-domain">
          更多 <ChevronDown size={14} />
        </button>
      )}
    </nav>
  );
}

function MenuTree(props: {
  menus: NavigationMenu[];
  collapsed: boolean;
  onOpen: (menu: NavigationMenu) => void;
}): ReactElement {
  return (
    <div className="menu-tree">
      {props.menus.map((menu) => (
        <MenuNode key={menu.id} menu={menu} collapsed={props.collapsed} onOpen={props.onOpen} />
      ))}
    </div>
  );
}

function MenuNode(props: {
  menu: NavigationMenu;
  collapsed: boolean;
  onOpen: (menu: NavigationMenu) => void;
}): ReactElement {
  const Icon = icons[props.menu.icon as keyof typeof icons] ?? PanelsTopLeft;
  return (
    <div className={`menu-node level-${props.menu.level}`}>
      <button
        className={props.menu.isLeaf ? 'menu-leaf' : 'menu-group'}
        onClick={() => props.menu.isLeaf && props.onOpen(props.menu)}
        title={props.collapsed ? props.menu.title : undefined}
      >
        <Icon size={17} />
        {!props.collapsed && <span>{props.menu.title}</span>}
      </button>
      {!props.collapsed && props.menu.children.length > 0 && (
        <div className="menu-children">
          {props.menu.children.map((child) => (
            <MenuNode key={child.id} menu={child} collapsed={props.collapsed} onOpen={props.onOpen} />
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
  onCloseOthers: () => void;
  onExitImmersive: () => void;
  immersive: boolean;
}): ReactElement {
  const homeId = createHomeTabId(props.domain.key);
  return (
    <div className="tab-strip">
      <div className="tabs-scroll">
        <button
          className={`tab fixed ${props.workspace.activeTabId === homeId ? 'active' : ''}`}
          onClick={() => props.onActivate(homeId)}
        >
          {props.domain.name}
        </button>
        {props.workspace.tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${props.workspace.activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => props.onActivate(tab.id)}
          >
            <span>{tab.title}</span>
            <span
              className="tab-close"
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
        <button onClick={props.onCloseOthers}>关闭其他</button>
        <button onClick={props.onCloseAll}>关闭全部</button>
      </div>
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
  onToggleMaximize: () => void;
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
      <div className="embed-toolbar">
        <span>{props.tab.title}</span>
        <div>
          <button onClick={() => window.open(props.tab.url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink size={15} /> 新窗口
          </button>
          <button onClick={props.onToggleMaximize}>
            <Maximize2 size={15} /> {props.maximized ? '退出最大化' : '最大化'}
          </button>
        </div>
      </div>
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
