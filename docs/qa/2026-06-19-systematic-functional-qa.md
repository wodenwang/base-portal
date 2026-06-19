# Base Portal Systematic Functional QA

日期：2026-06-19

my-harness step: 11 - systematic functional QA

## 初始 Findings

| ID | 严重度 | 状态 | 发现 |
|---|---|---|---|
| QA-001 | P1 | fixed | 已登录但空权限时，`activeDomain` 为空会落入 `LoginScreen`，错误显示登录入口，而不是空权限状态。 |
| QA-002 | P1 | fixed | 业务 tab 支持退出沉浸，但 UI 没有进入沉浸模式入口，无法覆盖 `DESIGN.md` 要求的沉浸模式路径。 |
| QA-003 | P2 | fixed | `SidebarHeader` DOM 重复嵌套，可能导致布局和可访问性树异常。 |
| QA-004 | P2 | fixed | iframe fallback 的 `刷新` 调用 `window.location.reload()`，会刷新整个 Portal，而不是刷新当前 iframe。 |
| QA-005 | P2 | fixed | `closeOtherTabs` 的目标 tab 不存在时会关闭全部 tab；从防御性行为看应保持当前状态，避免错误调用造成数据丢失。 |
| QA-006 | P1 | fixed | `/api/session` 返回 5xx 时被当成未登录，后端或初始化故障会错误显示登录入口，而不是初始化失败状态。 |

## 覆盖范围

- 登录态 / 未登录
- 初始化失败
- 已登录但空权限
- 左侧菜单展开、收起、手机抽屉
- tab 打开、关闭、关闭其他、关闭全部
- `confirm_on_close`
- tab 上限
- tab 右键菜单
- iframe fallback
- 沉浸模式
- 最大化模式
- 桌面、平板、手机视口

## 证据

### 修复记录

- QA-001：`App.tsx` 在已登录且无 `activeDomain` 时渲染 `EmptyPermissionScreen`，不再回退到登录页。
- QA-002：`TabStrip` 右键菜单增加“沉浸模式”，调用 `enterImmersiveTab`。
- QA-003：复核当前 `SidebarHeader` 结构，未保留重复 DOM；通过桌面/手机截图验证侧栏结构正常。
- QA-004：`EmbedFrame` 的 fallback 刷新改为递增 `frameVersion`，只重挂载当前 iframe。
- QA-005：`closeOtherTabs` 遇到不存在的目标 tab 时保持原状态，并补回归测试。
- QA-006：`fetchSession` 只把 401/403 当作未登录，5xx 抛出初始化失败，并补回归测试。

### 浏览器回归截图

| 覆盖项 | 结果 | 证据 |
|---|---|---|
| 未登录 | pass | `output/playwright/qa-01-unauthenticated-login.png` |
| session 初始化失败 | pass | `output/playwright/qa-02-session-initialization-failed.png` |
| navigation 初始化失败 | pass | `output/playwright/qa-03-navigation-initialization-failed.png` |
| 空权限 | pass | `output/playwright/qa-04-empty-permissions.png` |
| 登录态桌面工作台 | pass | `output/playwright/qa-05-authenticated-desktop-workspace.png` |
| 左侧菜单收起 | pass | `output/playwright/qa-06-sidebar-collapsed.png` |
| 左侧菜单展开 | pass | `output/playwright/qa-07-sidebar-expanded.png` |
| tab 打开 / iframe 加载 | pass | `output/playwright/qa-08-open-customer-tab.png` |
| 右键菜单 / 关闭其他 | pass | `output/playwright/qa-09-tab-context-menu.png`, `output/playwright/qa-09-tab-context-close-others-result.png` |
| 最大化模式 | pass | `output/playwright/qa-10-maximized-mode.png` |
| 沉浸模式 | pass | `output/playwright/qa-11-immersive-mode.png` |
| 关闭全部 | pass | `output/playwright/qa-13-close-all-tabs.png` |
| tab 上限 | pass | `output/playwright/qa-14-tab-limit.png` |
| iframe fallback / 刷新当前 iframe | pass | `output/playwright/qa-15-iframe-fallback.png` |
| 桌面 1440x900 | pass | `output/playwright/qa-16-desktop-1440x900.png` |
| 平板 834x900 | pass | `output/playwright/qa-17-tablet-834x900.png` |
| 手机抽屉打开 | pass | `output/playwright/qa-18-mobile-drawer-open.png` |
| 手机打开叶子菜单后抽屉关闭 | pass | `output/playwright/qa-19-mobile-after-open-tab.png` |
| 正常登录态 final smoke | pass | `output/playwright/qa-20-final-smoke.png` |
| `confirm_on_close` 取消/确认分支 | pass | `output/playwright/qa-21-confirm-on-close-result.png` |

### Playwright 断言

- 未登录：401 session 渲染登录页。
- 初始化失败：500 session 与 500 navigation 均渲染“门户初始化失败”。
- 空权限：已登录但 `domains: []` 渲染“暂无可访问菜单”。
- tab：打开、关闭、关闭其他、关闭全部、上限 20 个业务 tab 均按预期。
- `confirm_on_close`：`window.confirm=false` 保留 tab，`window.confirm=true` 关闭 tab。
- 右键菜单：业务 tab 右键展示“新窗口打开 / 最大化 / 沉浸模式 / 关闭当前 / 关闭其他 / 关闭全部”。
- iframe fallback：阻塞 iframe 超时后显示 fallback，点击“刷新”后 Portal 外壳仍保持，不刷新整个应用。
- 视口：桌面、平板、手机均完成截图；手机抽屉打开后点击叶子菜单会自动关闭。
- Final smoke：正常登录态打开客户中心，console errors `[]`，failed requests `[]`。

### 命令验证

- `pnpm --filter @base-portal/portal-web typecheck`：通过。
- `pnpm --filter @base-portal/portal-web lint`：通过。
- `pnpm --filter @base-portal/portal-web test`：通过，2 个测试文件，13 个测试。
- `pnpm --filter @base-portal/portal-web build`：通过，产物 `dist/index.html`、CSS 22.21 kB、JS 322.06 kB。
- `pnpm --filter @base-portal/api test`：通过，1 个测试文件，2 个测试。
- `pnpm check`：通过，覆盖 API 与 Portal Web 的 typecheck、lint、test。
- `pnpm build`：通过，覆盖 API Nest build 与 Portal Web Vite build。

### 结论

系统化功能 QA 当前结论：`DONE`。本轮发现 6 个问题，已修复 6 个，未延期。Step 11 可进入 my-harness Step 12 `gstack /review`。
