# Base Portal 设计规格

日期：2026-06-19

## 背景

Base Portal 是独立第三方应用「基础门户」，通过 Feishu IAM 完成登录、用户信息读取和权限点读取。Portal 不替代 IAM，也不承载第三方系统内部鉴权。Portal 的职责是提供企业门户壳、功能域切换、菜单树、Tab 工作区和第三方页面入口。

首版目标是交付切实可用的企业门户管理平台：用户侧门户体验完整，管理侧先弱化为数据库初始化和受保护运维 API。后续可能演进为企业工作台，但通知、待办、搜索、个性化首页等工作台能力不进入首版范围。

## 非目标

- 不做完整管理 UI。
- 不做微前端。
- 不做同窗口跳转。
- 不做通知、待办、搜索、最近访问、个性化首页。
- 不做第三方 URL 白名单。
- 不替第三方系统做二次鉴权。
- 不持久化用户打开的 tabs。
- 不做多语言，首版界面文案为中文。

## 技术基线

参考 `feishu-iam` 的工程组织：

- `pnpm` monorepo。
- 后端：NestJS + Prisma + PostgreSQL。
- 前端：React + Vite + React Router。
- UI：Tailwind CSS + Radix UI + lucide-react。
- 测试：Vitest、Testing Library、Playwright 或等价浏览器验证。
- 部署：Docker Compose，包含 `db + web`。

建议目录：

- `apps/api`
- `apps/portal-web`
- `deploy`
- `docs/superpowers/specs`

## 产品边界

首版包含：

- 用户侧门户：顶部品牌和功能域、右上角用户信息和退出、左侧三层菜单、右侧 Tab 工作区。
- 功能域：顶部展示 6-12 个功能域。切换前确认；确认后清空当前 tabs，打开新功能域固定首页 tab。
- 菜单：最多三层，父级只分组，叶子菜单可打开。
- 工作区：最多 20 个 tabs；同一菜单单实例；支持关闭当前、关闭全部、关闭其他。
- 嵌入方式：`iframe`、`immersive_iframe`、`new_tab`。
- 运维：SQL 初始化数据，受保护 API 同步权限资源到 IAM。
- 审计：记录登录、登出、权限同步、错误和菜单访问。
- 健康检查：`/health`、`/ready`、`/version`。

## IAM 接入

Portal 作为 Feishu IAM 第三方应用接入。

公开接入信息：

- `FEISHU_IAM_URL=https://feishu-iam.riversoft.com.cn`
- `app_key=base-portal`
- `client_id=bic_0b6cfcd9f4fa4cef8f6cfb96b8d86874`
- 登记回调地址：`https://base-portal.riversoft.com.cn`

敏感配置必须通过本地或部署环境变量提供，不得写入仓库：

- `FEISHU_IAM_CLIENT_SECRET`
- `FEISHU_IAM_DEVELOPER_API_TOKEN`

建议环境变量：

- `FEISHU_IAM_URL`
- `FEISHU_IAM_APP_KEY`
- `FEISHU_IAM_CLIENT_ID`
- `FEISHU_IAM_CLIENT_SECRET`
- `FEISHU_IAM_DEVELOPER_API_TOKEN`
- `PORTAL_ADMIN_USER_IDS`

### OAuth 流程

1. 浏览器跳转到 IAM `/oauth/authorize`，携带 `response_type=code`、`client_id`、`redirect_uri`、`state`、`scope`。
2. Portal 后端在登记回调地址收到 `code`。
3. Portal 后端调用 IAM `/oauth/token` 换取 access token。
4. Portal 后端调用 IAM `/oauth/userinfo` 获取用户信息。
5. Portal 后端调用 IAM `/api/v1/apps/base-portal/me/permissions` 获取权限组和权限点。
6. Portal 后端建立服务端 session。
7. 前端通过 `/api/session` 和 `/api/navigation` 渲染门户。

回调地址必须与 IAM 登记值精确匹配。由于当前登记值是根路径 `https://base-portal.riversoft.com.cn`，实现时必须支持根路径收到 `code/state` 的情况。

### 权限边界

Portal 登录后一次性拉取当前用户的权限集合，并基于权限点过滤功能域和菜单。点击菜单后，第三方页面内部鉴权由第三方系统自行接入 IAM 完成。Portal 不做第三方页面的资源级网关鉴权。

菜单权限粒度为叶子菜单级。叶子菜单绑定 `resource_key`；功能域和父级菜单只做结构容器，根据有权限的叶子菜单自动显隐。

### Developer API 同步

Portal 数据库是菜单 `resource_key` 的来源。受保护运维 API 读取 active 叶子菜单并调用 IAM developer API 创建或更新权限点和权限组。

Developer API 边界：

- 使用 `Authorization: Bearer <developer_api_token>`。
- 只能维护本应用权限点、权限组和权限组权限点绑定。
- 不能修改应用配置、回调地址、登录凭证、角色授权或管理员授权。
- 权限点 key 必须以 `base-portal.` 开头。

相关接口：

- `https://feishu-iam.riversoft.com.cn/api/v1/developer/apps/base-portal/permission-points`
- `https://feishu-iam.riversoft.com.cn/api/v1/developer/apps/base-portal/permission-groups`
- `https://feishu-iam.riversoft.com.cn/api/v1/developer/apps/base-portal/permission-groups/{group_id}/points`

## 数据模型

### 功能域

`portal_domains`：

- `id`
- `key`
- `name`
- `description`
- `icon`
- `cover_color`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

每个功能域有一个固定首页 tab。首页展示标题、说明、图标和封面色，不展示快捷入口或操作按钮。

### 菜单

`portal_menus`：

- `id`
- `domain_id`
- `parent_id`
- `key`
- `title`
- `icon`
- `level`
- `sort_order`
- `status`
- `is_leaf`
- `resource_key`
- `url`
- `open_mode`
- `confirm_on_close`
- `created_at`
- `updated_at`

约束：

- 菜单最多三层。
- 父级菜单只负责分组和展开折叠，不能配置 URL。
- 叶子菜单可以出现在第 1、2、3 层。
- 只有叶子菜单可打开。
- 叶子菜单必须绑定 `resource_key`。
- `open_mode` 取值为 `iframe`、`immersive_iframe`、`new_tab`。

### Session

首版使用内存 session。session 保存：

- IAM 用户信息。
- 当前用户 permission points / groups。
- 登录时间。
- session 过期时间。

刷新页面不恢复 tabs，但登录态保留到 session 过期或服务重启。服务重启后用户重新登录。

### 审计

`portal_audit_events` 记录：

- 登录成功。
- 登录失败。
- 登出。
- IAM 权限资源同步 API 调用。
- 后端错误。
- 菜单访问事件。

菜单访问字段：

- 用户 ID。
- 用户名。
- 菜单 ID。
- 菜单标题。
- 功能域。
- 打开方式。
- 访问时间。

前端打开 tab 时调用后端记录菜单访问审计。审计失败不阻塞用户打开页面。

## 前端设计

### 品牌与视觉

界面品牌显示为 `Base Portal`。首版视觉方向是运营工作台感：比传统后台更现代、更有工作效率工具气质，但不做工作台功能。最终视觉细节交给后续 Product Design / 设计制品阶段决策。

### 布局

顶部栏：

- 左侧：品牌区。
- 中部：功能域一级菜单。
- 右侧：头像/姓名 + 退出登录。

功能域：

- 预计 6-12 个。
- 桌面横向展示。
- 溢出用“更多”菜单或横向滚动。
- 平板和窄屏降级为下拉。
- 切换功能域前提示用户确认。
- 确认后清空当前 tabs，打开新功能域固定首页 tab。

左侧菜单：

- 最多三层。
- 父级只展开折叠。
- 叶子菜单点击打开 tab。
- 桌面支持展开/收起，收起后保留图标和 tooltip。
- 平板和手机收为菜单按钮或抽屉。

### Tab 工作区

- 每个功能域有固定首页 tab，不可关闭。
- 固定首页 tab 不计入 20 个业务 tab 上限。
- 同一菜单只打开一个 tab，重复点击激活已有 tab。
- tab 上限 20 个。
- 达到上限时提示用户关闭已有 tab。
- 桌面 tab 横向滚动。
- 窄屏用“更多”下拉管理。
- 支持关闭当前、关闭全部、关闭其他。
- 默认直接关闭。
- `confirm_on_close=true` 的 tab 在关闭或批量关闭时触发确认。

### 打开方式

`iframe`：在标准 Portal 壳内打开，顶部、左侧和 tab 都保留。

`immersive_iframe`：隐藏左侧菜单和顶部功能域，只保留 tab 条与退出沉浸按钮。

`new_tab`：浏览器新标签页打开，不占 Portal 内部 tab，但仍记录菜单访问审计。

### 最大化

当前 tab 支持应用内最大化，不调用浏览器 Fullscreen API。最大化是临时覆盖态，优先级高于标准和沉浸模式。最大化时隐藏顶部、左侧和 tab，让功能页内容占满浏览器窗口，并保留退出最大化按钮；退出最大化后回到进入前的标准或沉浸模式。

### 加载失败

iframe 无法可靠捕获跨域页面的真实加载失败原因。首版采用超时 fallback 和手动操作面板：当嵌入页超过设定时间没有完成可观察加载，或用户需要排障时，展示基础 fallback 面板：

- 页面可能无法加载。
- 刷新。
- 复制链接。
- 新窗口打开。

首版不承诺识别 CSP、网络、登录状态等具体原因。

### 响应式

桌面和平板优先。手机端做兜底，最低标准是功能域选择可用、菜单可打开、tab 可关闭、当前 iframe 不挤出 Portal 壳层。嵌入页面自身适配由第三方应用负责。

## 后端 API

后端模块：

- `AuthModule`：IAM OAuth 登录、callback、token exchange、userinfo、permissions 拉取、session 建立、退出登录。
- `SessionModule`：内存 session、session guard、当前用户上下文。
- `NavigationModule`：读取功能域和菜单树，根据权限点过滤可见菜单。
- `WorkspaceModule`：菜单访问审计 API，不持久化 tabs。
- `PortalConfigModule`：读取数据库中的功能域、菜单、打开方式和说明页配置。
- `IamDeveloperModule`：封装 IAM developer API。
- `OpsModule`：受保护运维 API。
- `HealthModule`：`/health`、`/ready`、`/version`。

主要 API：

- `GET /api/session`
- `GET /api/auth/login` 或 `POST /api/auth/login`
- `GET /oauth/callback`
- 根路径 OAuth callback 兼容处理
- `POST /api/logout`
- `GET /api/navigation`
- `POST /api/audit/menu-opened`
- `POST /api/ops/sync-iam-resources`
- `GET /health`
- `GET /ready`
- `GET /version`

运维 API 权限：

- 首版不做管理 UI。
- 管理员身份通过 `PORTAL_ADMIN_USER_IDS` 配置。
- 调用运维 API 时必须已有 Portal 登录态，且 IAM user ID 在管理员名单里。

## 初始化数据

首版通过 SQL 初始化一套默认数据。默认菜单 URL 使用 Portal 自带占位页，例如 `/placeholder/:menuKey`。

占位页极简，只用于证明 iframe、tab 和嵌入链路可用。不模拟第三方系统界面。

首版不做配置后台、不做导入 API、不做多环境 seed。

## 部署

同仓库提供 Docker Compose：

- `db`：PostgreSQL，使用持久化 volume。
- `web`：NestJS API + 构建后的 portal web 静态资源。

要求：

- `web` 容器启动前应用 Prisma migration。
- 运行配置通过 `.env` 或部署环境变量注入。
- 仓库只提交 `.env.example`。
- 不提交真实 secret。

## 测试与验收

### IAM 链路

- 可以从 Portal 触发 Feishu IAM 登录。
- IAM 登录后能回到登记的 `https://base-portal.riversoft.com.cn`。
- 后端能用 `code` 换取 access token。
- 后端能读取 `/oauth/userinfo`。
- 后端能读取 `/api/v1/apps/base-portal/me/permissions`。
- 登录成功后能建立 httpOnly session cookie。
- 刷新页面后登录态仍在，但 tabs 不恢复。
- 退出登录后 session 清理。
- 无权限菜单不会出现在左侧菜单中。
- 运维 API 能使用 developer API 创建或更新 `base-portal.*` 权限点和权限组。

### Portal 工作区

- 顶部功能域可展示 6-12 个域，并处理溢出。
- 切换功能域前有确认提示。
- 确认切换后清空当前 tabs，打开新功能域固定首页 tab。
- 切换确认提示应显示将关闭的业务 tab 数量。
- 左侧菜单最多三层，父级只展开折叠，叶子可打开。
- 同一菜单重复点击只激活已有 tab。
- tab 上限 20 个。
- 支持关闭当前、关闭全部、关闭其他。
- `confirm_on_close=true` 的 tab 在关闭和批量关闭时触发确认。
- `iframe`、`immersive_iframe`、`new_tab` 三种打开方式可用。
- 应用内最大化可进入和退出。
- iframe fallback 面板提供刷新、复制链接、新窗口打开。
- 桌面和平板体验稳定；手机端不崩，有菜单兜底入口。

### 审计

- 登录成功/失败、登出、权限同步、菜单打开事件能写入审计表。
- 菜单打开审计至少包含用户 ID、用户名、菜单 ID、菜单标题、功能域、打开方式、访问时间。
- 审计失败不阻塞用户打开菜单。

### 工程门禁

- 提供 `/health`、`/ready`、`/version`。
- Docker Compose 可以启动 `db + web`。
- Prisma migration 和初始化 SQL 有明确幂等边界。
- `.env.example` 不含 secret。
- 仓库、日志、截图、测试快照不出现 `client_secret`、developer API token、access token、authorization code、cookie、密码。
- 测试至少覆盖 OAuth 回调服务逻辑、权限过滤、菜单树过滤、tab 状态逻辑、运维同步 API 权限保护、审计写入。
- 浏览器验证覆盖登录后门户壳、功能域切换、菜单打开、tab 操作、沉浸模式、最大化、响应式关键视口。

## 首个 Vertical Slice 建议

1. 初始化项目骨架和 Docker Compose。
2. 建立 IAM 登录、session 和 `/api/session`。
3. 建立功能域/菜单模型和 SQL 初始化。
4. 登录后拉权限并过滤导航。
5. 前端实现 Portal 壳、固定首页 tab、菜单打开 iframe tab。
6. 实现菜单访问审计。
7. 实现权限点同步 API。
8. 用占位页完成浏览器端验证。

## 后续评审关注点

后续 my-harness 阶段需要继续挑战这些问题：

- Product Design 阶段确认最终视觉目标、组件选择、响应式策略和运营工作台感的表达边界。
- `plan-design-review` 挑战功能域切换清空 tabs、沉浸模式和最大化是否会造成用户迷失。
- `plan-eng-review` 决定权限组同步策略、session 过期策略、Prisma migration 和初始化 SQL 的幂等边界。
- `writing-plans` 必须明确文件路径、测试命令、预期输出和完成标准。
