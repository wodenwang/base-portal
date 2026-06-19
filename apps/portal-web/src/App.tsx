import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type ReactElement } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Copy,
  Database,
  ExternalLink,
  FileText,
  FolderClosed,
  FolderKanban,
  Gauge,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  PanelsTopLeft,
  Plus,
  RefreshCw,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  UserCog,
  UsersRound,
  Workflow,
  Wrench,
  X
} from 'lucide-react';
import { fetchNavigation, fetchSession, logout, recordMenuOpened } from './api';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from './components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './components/ui/dropdown-menu';
import type { NavigationDomain, NavigationMenu, PortalUser, WorkspaceTab } from './types';
import {
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  createHomeTabId,
  createInitialWorkspace,
  enterImmersiveTab,
  exitImmersiveTab,
  hasConfirmTabs,
  openMenuTab,
  reorderTabs,
  switchDomain,
  type WorkspaceState
} from './workspace';

const icons = {
  BarChart3,
  Boxes,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Database,
  FileText,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  ListChecks,
  PanelsTopLeft,
  ReceiptText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
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
  if (!user || !workspace) return <LoginScreen />;
  if (!activeDomain) return <EmptyPermissionScreen user={user} onRetry={() => void bootstrap()} onLogout={() => void handleLogout()} />;

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
    const result = openMenuTab(requireWorkspace(), activeDomain, menu);
    if (result.reason === 'limit') {
      window.alert('最多同时打开 20 个业务标签页，请关闭已有标签页后再打开。');
      return;
    }
    const openedTab = result.state.tabs.find((tab) => tab.menuId === menu.id);
    void recordMenuOpened({
      domainKey: activeDomain.key,
      domainName: activeDomain.name,
      menuId: menu.id,
      menuTitle: menu.title,
      openMode: openedTab?.openMode ?? 'iframe'
    });
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

  function handleReorderTabs(sourceTabId: string, targetTabId: string, placement: 'before' | 'after'): void {
    setWorkspace(reorderTabs(requireWorkspace(), sourceTabId, targetTabId, placement));
  }

  function handleMoveTab(tabId: string, direction: 'left' | 'right'): void {
    const current = requireWorkspace();
    const index = current.tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const target = current.tabs[targetIndex];
    if (!target) return;
    setWorkspace(reorderTabs(current, tabId, target.id, direction === 'left' ? 'before' : 'after'));
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
            <BrandMark />
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
              onReorder={handleReorderTabs}
              onMove={handleMoveTab}
              onEnterImmersive={(tabId) => setWorkspace(enterImmersiveTab(workspace, tabId))}
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="user-menu-trigger" type="button" title={props.user.name}>
          <span className="avatar" aria-hidden="true">
            {props.user.avatarUrl ? <img src={props.user.avatarUrl} alt="" /> : <UserCircle size={18} />}
          </span>
          <span className="user-name">{props.user.name}</span>
          <ChevronDown size={13} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="user-dropdown">
        <DropdownMenuLabel className="user-dropdown-profile">
          <span className="avatar avatar-lg" aria-hidden="true">
            {props.user.avatarUrl ? <img src={props.user.avatarUrl} alt="" /> : <UserCircle size={22} />}
          </span>
          <span>
            <strong>{props.user.name}</strong>
            <small>{props.user.id}</small>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={props.onLogout}>
          <LogOut size={14} />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <BrandMark large />
        <h1>Base Portal</h1>
        <p>企业门户入口，使用 Feishu IAM 登录后访问已授权的系统菜单。</p>
        <a className="primary-button" href="/api/auth/login">使用 Feishu IAM 登录</a>
        <a className="secondary-link" href="/api/auth/mock-login">本地 mock 登录</a>
      </div>
    </div>
  );
}

function EmptyPermissionScreen(props: { user: PortalUser; onRetry: () => void; onLogout: () => void }): ReactElement {
  return (
    <div className="center-screen">
      <div className="status-panel">
        <BrandMark large />
        <h1>暂无可访问菜单</h1>
        <p>{props.user.name} 当前没有 Base Portal 可访问权限，请联系管理员授权后刷新。</p>
        <div className="status-actions">
          <button className="primary-button" type="button" onClick={props.onRetry}>刷新权限</button>
          <button className="text-button" type="button" onClick={props.onLogout}>退出登录</button>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ large = false }: { large?: boolean }): ReactElement {
  return (
    <span className={`brand-mark ${large ? 'large' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" role="img" focusable="false">
        <path
          className="brand-mark-frame"
          d="M16 3.8 26.8 10.1c.8.5 1.2 1.2 1.2 2.1v9.1c0 .9-.5 1.8-1.3 2.2l-4.4 2.5v-9.6c0-.9-.5-1.8-1.3-2.2l-5-2.9-5 2.9c-.8.4-1.3 1.3-1.3 2.2V26l-4.4-2.5A2.6 2.6 0 0 1 4 21.3v-9.1c0-.9.5-1.7 1.2-2.1L16 3.8Z"
        />
        <path className="brand-mark-door" d="M16 12.8 20.6 15.5v9.2L16 27.4V12.8Z" />
        <path className="brand-mark-floor" d="M16 27.4 8.5 23.1 16 18.8l7.5 4.3L16 27.4Z" />
      </svg>
    </span>
  );
}

function DomainNav(props: {
  domains: NavigationDomain[];
  activeKey: string;
  onSwitch: (domain: NavigationDomain) => void;
}): ReactElement {
  const activeDomain = props.domains.find((domain) => domain.key === props.activeKey) ?? props.domains[0];

  return (
    <nav className="domain-nav" aria-label="功能域">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="domain-trigger" type="button" title={activeDomain?.name}>
            <PanelsTopLeft size={15} />
            <span>{activeDomain?.name ?? '功能域'}</span>
            <ChevronDown size={13} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="domain-dropdown">
          {props.domains.map((domain) => (
            <DropdownMenuItem
              key={domain.key}
              className={domain.key === props.activeKey ? 'active' : ''}
              onSelect={() => props.onSwitch(domain)}
              title={domain.name}
            >
              <span>{domain.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
  const active = props.activeMenuId === props.menu.id;
  const children = props.menu.children ?? [];
  const hasChildren = children.length > 0;
  const activePath = menuContainsActive(props.menu, props.activeMenuId);
  const [expanded, setExpanded] = useState(true);
  const childrenId = `menu-children-${props.menu.id}`;
  const flyoutId = `menu-flyout-${props.menu.id}`;

  function handleMenuClick(): void {
    if (props.menu.isLeaf) {
      props.onOpen(props.menu);
      return;
    }
    if (hasChildren) setExpanded((value) => !value);
  }

  return (
    <div className={`menu-node level-${props.menu.level} ${activePath ? 'active-path' : ''}`}>
      <button
        type="button"
        className={`${props.menu.isLeaf ? 'menu-leaf' : 'menu-group'} ${active ? 'active' : ''} ${activePath ? 'active-path' : ''} ${expanded ? 'expanded' : 'collapsed'}`}
        aria-current={active ? 'page' : undefined}
        aria-haspopup={props.collapsed && !props.menu.isLeaf && hasChildren ? 'menu' : undefined}
        aria-expanded={!props.collapsed && !props.menu.isLeaf && hasChildren ? expanded : undefined}
        aria-controls={!props.collapsed && !props.menu.isLeaf && hasChildren ? childrenId : undefined}
        onClick={handleMenuClick}
        title={props.collapsed ? props.menu.title : undefined}
      >
        <MenuGlyph isLeaf={props.menu.isLeaf} active={active || activePath} />
        {!props.collapsed && <span>{props.menu.title}</span>}
        {!props.collapsed && !props.menu.isLeaf && hasChildren && (
          <ChevronDown className={`menu-chevron ${expanded ? 'expanded' : ''}`} size={14} />
        )}
      </button>
      {!props.collapsed && hasChildren && expanded && (
        <div id={childrenId} className="menu-children">
          {children.map((child) => (
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
      {props.collapsed && !props.menu.isLeaf && hasChildren && (
        <div id={flyoutId} className="menu-flyout" role="menu" aria-label={props.menu.title}>
          <div className="menu-flyout-title">{props.menu.title}</div>
          <MenuFlyoutItems menus={children} activeMenuId={props.activeMenuId} onOpen={props.onOpen} />
        </div>
      )}
    </div>
  );
}

function MenuFlyoutItems(props: {
  menus: NavigationMenu[];
  activeMenuId: string | null;
  onOpen: (menu: NavigationMenu) => void;
}): ReactElement {
  return (
    <div className="menu-flyout-list">
      {props.menus.map((menu) =>
        menu.isLeaf ? (
          <button
            key={menu.id}
            type="button"
            role="menuitem"
            className={`menu-flyout-item ${props.activeMenuId === menu.id ? 'active' : ''}`}
            onClick={() => props.onOpen(menu)}
          >
            <MenuGlyph isLeaf active={props.activeMenuId === menu.id} />
            <span>{menu.title}</span>
          </button>
        ) : (
          <div key={menu.id} className={`menu-flyout-group ${menuContainsActive(menu, props.activeMenuId) ? 'active-path' : ''}`}>
            <div className="menu-flyout-group-title">
              <MenuGlyph isLeaf={false} active={menuContainsActive(menu, props.activeMenuId)} />
              <span>{menu.title}</span>
            </div>
            <MenuFlyoutItems menus={menu.children ?? []} activeMenuId={props.activeMenuId} onOpen={props.onOpen} />
          </div>
        )
      )}
    </div>
  );
}

function menuContainsActive(menu: NavigationMenu, activeMenuId: string | null): boolean {
  if (!activeMenuId) return false;
  if (menu.id === activeMenuId) return true;
  return (menu.children ?? []).some((child) => menuContainsActive(child, activeMenuId));
}

function MenuGlyph({ isLeaf, active }: { isLeaf: boolean; active: boolean }): ReactElement {
  if (isLeaf) {
    return (
      <span className={`menu-leaf-dot ${active ? 'active' : ''}`} aria-hidden="true">
        <span />
      </span>
    );
  }

  return (
    <span className="menu-folder-icon" aria-hidden="true">
      <FolderClosed size={15} />
    </span>
  );
}

function TabStrip(props: {
  domain: NavigationDomain;
  workspace: WorkspaceState;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onCloseAll: () => void;
  onCloseOthers: (tabId?: string) => void;
  onReorder: (sourceTabId: string, targetTabId: string, placement: 'before' | 'after') => void;
  onMove: (tabId: string, direction: 'left' | 'right') => void;
  onEnterImmersive: (tabId: string) => void;
  onMaximize: (tabId: string) => void;
  onExitImmersive: () => void;
  immersive: boolean;
}): ReactElement {
  const homeId = createHomeTabId(props.domain.key);
  const activeBusinessTab = props.workspace.tabs.find((tab) => tab.id === props.workspace.activeTabId) ?? null;
  const activeBusinessIndex = activeBusinessTab ? props.workspace.tabs.findIndex((tab) => tab.id === activeBusinessTab.id) : -1;
  const hasBusinessTabs = props.workspace.tabs.length > 0;
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ tabId: string; placement: 'before' | 'after' } | null>(null);

  function getDropPlacement(event: DragEvent<HTMLButtonElement>): 'before' | 'after' {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left + bounds.width / 2 ? 'before' : 'after';
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, tabId: string): void {
    setDraggingTabId(tabId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tabId);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>, targetTabId: string): void {
    const sourceTabId = draggingTabId ?? event.dataTransfer.getData('text/plain');
    if (!sourceTabId || sourceTabId === targetTabId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropIndicator({ tabId: targetTabId, placement: getDropPlacement(event) });
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>, targetTabId: string): void {
    event.preventDefault();
    const sourceTabId = draggingTabId ?? event.dataTransfer.getData('text/plain');
    const placement = dropIndicator?.tabId === targetTabId ? dropIndicator.placement : getDropPlacement(event);
    setDraggingTabId(null);
    setDropIndicator(null);
    if (!sourceTabId || sourceTabId === targetTabId) return;
    props.onReorder(sourceTabId, targetTabId, placement);
  }

  function clearDragState(): void {
    setDraggingTabId(null);
    setDropIndicator(null);
  }

  return (
    <div className="tab-strip">
      <div className="tabs-scroll">
        <button
          className={`tab home-tab ${props.workspace.activeTabId === homeId ? 'active' : ''}`}
          onClick={() => props.onActivate(homeId)}
          title={props.domain.name}
        >
          {props.domain.name}
        </button>
        {props.workspace.tabs.map((tab, index) => (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger asChild>
              <button
                className={`tab ${props.workspace.activeTabId === tab.id ? 'active' : ''}`}
                draggable
                data-dragging={draggingTabId === tab.id ? 'true' : undefined}
                data-drop-position={dropIndicator?.tabId === tab.id ? dropIndicator.placement : undefined}
                onClick={() => props.onActivate(tab.id)}
                onContextMenu={() => props.onActivate(tab.id)}
                onDragStart={(event) => handleDragStart(event, tab.id)}
                onDragOver={(event) => handleDragOver(event, tab.id)}
                onDrop={(event) => handleDrop(event, tab.id)}
                onDragEnd={clearDragState}
                title={tab.title}
              >
                <span>{tab.title}</span>
                <span
                  className="tab-close"
                  title="关闭当前标签"
                  onMouseDown={(event) => event.stopPropagation()}
                  onDragStart={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onClose(tab.id);
                  }}
                >
                  <X size={12} />
                </span>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => window.open(tab.url, '_blank', 'noopener,noreferrer')}>
                <ExternalLink size={14} />
                <span>新窗口打开</span>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => props.onMaximize(tab.id)}>
                <Maximize2 size={14} />
                <span>最大化</span>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => props.onEnterImmersive(tab.id)}>
                <PanelsTopLeft size={14} />
                <span>沉浸模式</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled={index === 0} onSelect={() => props.onMove(tab.id, 'left')}>
                <ChevronsLeft size={14} />
                <span>左移</span>
              </ContextMenuItem>
              <ContextMenuItem disabled={index === props.workspace.tabs.length - 1} onSelect={() => props.onMove(tab.id, 'right')}>
                <ChevronsRight size={14} />
                <span>右移</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => props.onClose(tab.id)}>
                <X size={14} />
                <span>关闭当前</span>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => props.onCloseOthers(tab.id)}>
                <Copy size={14} />
                <span>关闭其他</span>
              </ContextMenuItem>
              <ContextMenuItem onSelect={props.onCloseAll}>
                <MoreHorizontal size={14} />
                <span>关闭全部</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      <div className="tab-actions">
        {props.immersive && <button onClick={props.onExitImmersive}>退出沉浸</button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="icon-button" type="button" aria-label="标签操作" title="标签操作">
              <MoreVertical size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="tab-action-menu">
            <DropdownMenuItem
              disabled={!activeBusinessTab}
              onSelect={() => {
                if (activeBusinessTab) window.open(activeBusinessTab.url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink size={14} />
              <span>新窗口打开</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!activeBusinessTab}
              onSelect={() => {
                if (activeBusinessTab) props.onMaximize(activeBusinessTab.id);
              }}
            >
              <Maximize2 size={14} />
              <span>最大化</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!activeBusinessTab}
              onSelect={() => {
                if (activeBusinessTab) props.onEnterImmersive(activeBusinessTab.id);
              }}
            >
              <PanelsTopLeft size={14} />
              <span>沉浸模式</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!activeBusinessTab || activeBusinessIndex <= 0}
              onSelect={() => {
                if (activeBusinessTab) props.onMove(activeBusinessTab.id, 'left');
              }}
            >
              <ChevronsLeft size={14} />
              <span>左移</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!activeBusinessTab || activeBusinessIndex < 0 || activeBusinessIndex >= props.workspace.tabs.length - 1}
              onSelect={() => {
                if (activeBusinessTab) props.onMove(activeBusinessTab.id, 'right');
              }}
            >
              <ChevronsRight size={14} />
              <span>右移</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!activeBusinessTab}
              onSelect={() => {
                if (activeBusinessTab) props.onClose(activeBusinessTab.id);
              }}
            >
              <X size={14} />
              <span>关闭当前</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!activeBusinessTab}
              onSelect={() => {
                if (activeBusinessTab) props.onCloseOthers(activeBusinessTab.id);
              }}
            >
              <Copy size={14} />
              <span>关闭其他</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasBusinessTabs} onSelect={props.onCloseAll}>
              <MoreHorizontal size={14} />
              <span>关闭全部</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
  onExitMaximize: () => void;
}): ReactElement {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [frameVersion, setFrameVersion] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, [props.tab.url, frameVersion]);

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
            <button onClick={() => setFrameVersion((value) => value + 1)}>
              <RefreshCw size={14} /> 刷新
            </button>
            <button onClick={() => void navigator.clipboard?.writeText(props.tab.url)}>复制链接</button>
            <button onClick={() => window.open(props.tab.url, '_blank', 'noopener,noreferrer')}>新窗口打开</button>
          </div>
        </div>
      )}
      <iframe key={`${props.tab.id}:${frameVersion}`} title={props.tab.title} src={props.tab.url} onLoad={() => setLoaded(true)} />
    </div>
  );
}

type MockTableRow = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'pending' | 'risk' | 'done';
  segment: string;
  region: string;
  owner: string;
  date: string;
  amount?: string;
};

type MockContent = {
  appName: string;
  title: string;
  subtitle: string;
  tabs: string[];
  primaryAction: string;
  columns: string[];
  rows: MockTableRow[];
};

const mockContent: Record<string, MockContent> = {
  'ops-customers': {
    appName: '客户管理系统',
    title: '客户视图',
    subtitle: '统一维护客户档案、商机归属和经营状态',
    tabs: ['客户', '商机', '合同', '设置'],
    primaryAction: '新建客户',
    columns: ['客户名称', '客户编码', '客户状态', '所属行业', '所属区域', '负责人', '创建时间', '操作'],
    rows: [
      { id: '1', name: '广州河川科技有限公司', code: 'CUS-2026-0018', status: 'active', segment: '企业服务', region: '华南一区', owner: '周晨', date: '2026-06-18' },
      { id: '2', name: '深圳云景智造集团', code: 'CUS-2026-0017', status: 'pending', segment: '智能制造', region: '华南二区', owner: '林可', date: '2026-06-17' },
      { id: '3', name: '上海星澜供应链', code: 'CUS-2026-0016', status: 'risk', segment: '供应链', region: '华东一区', owner: '陈越', date: '2026-06-16' },
      { id: '4', name: '成都明岚能源科技', code: 'CUS-2026-0015', status: 'active', segment: '新能源', region: '西南区', owner: '李思', date: '2026-06-15' },
      { id: '5', name: '北京北辰数据服务', code: 'CUS-2026-0014', status: 'done', segment: '数据服务', region: '华北区', owner: '王宁', date: '2026-06-14' }
    ]
  },
  'ops-orders': {
    appName: '订单履约中心',
    title: '订单中心',
    subtitle: '跟踪订单流转、交付节点和异常处理',
    tabs: ['全部订单', '待处理', '履约中', '异常'],
    primaryAction: '新建订单',
    columns: ['订单名称', '订单编号', '订单状态', '业务类型', '交付区域', '负责人', '更新时间', '操作'],
    rows: [
      { id: '1', name: '华南门店设备更新', code: 'ORD-2026-0062', status: 'active', segment: '设备采购', region: '广州', owner: '赵一', date: '2026-06-18', amount: '¥184,000' },
      { id: '2', name: '数据中台接口扩容', code: 'ORD-2026-0061', status: 'pending', segment: '技术服务', region: '深圳', owner: '沈洁', date: '2026-06-18', amount: '¥96,500' },
      { id: '3', name: '客户成功续费包', code: 'ORD-2026-0060', status: 'risk', segment: '续约服务', region: '上海', owner: '刘洋', date: '2026-06-17', amount: '¥58,900' },
      { id: '4', name: '西南渠道培训计划', code: 'ORD-2026-0059', status: 'done', segment: '培训服务', region: '成都', owner: '唐璐', date: '2026-06-16', amount: '¥31,800' }
    ]
  }
};

const fallbackMockContent: MockContent = {
  appName: '业务系统',
  title: '业务列表',
  subtitle: '当前为设计验证 mock 页面，用于校验 Portal iframe 承载密度。',
  tabs: ['概览', '列表', '规则', '日志'],
  primaryAction: '新建记录',
  columns: ['名称', '编码', '状态', '分类', '区域', '负责人', '更新时间', '操作'],
  rows: [
    { id: '1', name: '示例业务记录 A', code: 'REC-2026-0004', status: 'active', segment: '常规业务', region: '华南', owner: '系统用户', date: '2026-06-18' },
    { id: '2', name: '示例业务记录 B', code: 'REC-2026-0003', status: 'pending', segment: '协作事项', region: '华东', owner: '系统用户', date: '2026-06-17' },
    { id: '3', name: '示例业务记录 C', code: 'REC-2026-0002', status: 'done', segment: '归档数据', region: '华北', owner: '系统用户', date: '2026-06-16' }
  ]
};

function PlaceholderPage({ menuKey }: { menuKey: string }): ReactElement {
  const content = mockContent[menuKey] ?? { ...fallbackMockContent, title: menuKey };

  return (
    <main className="mock-app">
      <header className="mock-topbar">
        <div className="mock-brand">
          <span className="mock-logo">{content.appName.slice(0, 2)}</span>
          <span>{content.appName}</span>
        </div>
        <div className="mock-global-actions">
          <button type="button" aria-label="筛选">
            <SlidersHorizontal size={14} />
          </button>
          <button type="button" aria-label="刷新">
            <RefreshCw size={14} />
          </button>
          <span className="mock-avatar">ZW</span>
        </div>
      </header>
      <section className="mock-page">
        <div className="mock-page-heading">
          <div>
            <p>运营中心 / {content.appName}</p>
            <h1>{content.title}</h1>
            <span>{content.subtitle}</span>
          </div>
          <button className="mock-primary" type="button">
            <Plus size={14} />
            <span>{content.primaryAction}</span>
          </button>
        </div>
        <nav className="mock-tabs" aria-label="业务系统标签">
          {content.tabs.map((tab, index) => (
            <button key={tab} className={index === 0 ? 'active' : ''} type="button">
              {tab}
            </button>
          ))}
        </nav>
        <div className="mock-filters">
          <label>
            <span>关键词</span>
            <input value="" placeholder="搜索名称 / 编码" readOnly />
          </label>
          <label>
            <span>状态</span>
            <select value="all" aria-label="状态" onChange={() => undefined}>
              <option value="all">全部状态</option>
            </select>
          </label>
          <label>
            <span>区域</span>
            <select value="all" aria-label="区域" onChange={() => undefined}>
              <option value="all">全部区域</option>
            </select>
          </label>
          <button type="button">查询</button>
          <button type="button">重置</button>
        </div>
        <section className="mock-table-card" aria-label={content.title}>
          <div className="mock-table-toolbar">
            <strong>数据列表</strong>
            <div>
              <button type="button">导入</button>
              <button type="button">导出</button>
              <button type="button" aria-label="更多">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
          <table className="mock-table">
            <thead>
              <tr>
                {content.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    {row.amount && <small>{row.amount}</small>}
                  </td>
                  <td>{row.code}</td>
                  <td><MockStatus status={row.status} /></td>
                  <td>{row.segment}</td>
                  <td>{row.region}</td>
                  <td>{row.owner}</td>
                  <td>{row.date}</td>
                  <td>
                    <button type="button">查看</button>
                    <button type="button">编辑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mock-pagination">
            <span>共 128 条</span>
            <button type="button">上一页</button>
            <button className="active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">下一页</button>
          </div>
        </section>
      </section>
    </main>
  );
}

function MockStatus({ status }: { status: MockTableRow['status'] }): ReactElement {
  const label = {
    active: '进行中',
    pending: '待确认',
    risk: '有风险',
    done: '已完成'
  }[status];

  return (
    <span className={`mock-status ${status}`}>
      <CheckCircle2 size={12} />
      {label}
    </span>
  );
}
