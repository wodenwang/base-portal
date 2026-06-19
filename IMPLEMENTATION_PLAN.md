# Base Portal v0.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 `base-portal` v0.1.0：按定稿设计重构 Portal 前端、解决 GitHub issues #1-#5，并通过 Docker Compose 部署到 `bpmt@120.24.236.92:/home/bpmt/base-portal`，最终以 `https://base-portal.riversoft.com.cn` 对外提供服务。

**Architecture:** 前端只重构 Portal 壳、Tab 工作区和 iframe 承载交互，不改变 Feishu IAM OAuth、session、审计和权限边界。部署侧以版本化 Docker image + Docker Compose 为生产运行模型，`install.sh` 负责首次安装，`upgrade.sh` 负责版本升级，服务器 nginx 位于 `~/nginx` 并反向代理到应用端口。

**Tech Stack:** React 19、TypeScript、Vite、lucide-react、CSS variables、NestJS、Prisma、PostgreSQL、Docker Compose、阿里云 CLI、nginx、ACME 证书工具、Vitest、Playwright。

---

## Plan Eng Review 收口

已确认决策：

- D1=A：v0.1.0 同时包含前端、issues、部署治理、脚本和生产部署。
- D2=A：生产使用不可变版本镜像 tag，不使用 `latest`。
- D3=A：Step 15 完成阿里云 DNS、服务器证书、`~/nginx` 反向代理和健康检查。

主要工程风险：

- 部署面新增 DNS、证书、nginx 和远端 Docker Compose，必须和前端改动分层实施，避免在同一任务中混杂 UI 和生产运维。
- 当前 `deploy/docker-compose.yml` 使用 `build:`，生产需要增加固定镜像路径或拆分生产 Compose 覆盖文件。
- 当前缺少 `install.sh` 和 `upgrade.sh`，不能把手工 `docker compose up` 当作 v0.1.0 完成。
- 真实 `deploy/.env`、IAM secret、阿里云凭证、证书私钥不得读取、回显、提交或进入截图。

不在本轮范围：

- 不新增第二套 UI 框架。
- 不重写 Feishu IAM OAuth 协议和权限 API。
- 不做复杂 Portal 首页聚合、BI dashboard、通知中心、全局搜索或最近访问。
- 不把第三方 iframe 内部页面改造成移动端页面。
- 不自动 merge、push、tag、release 或部署，除非进入 `/ship` / `/land-and-deploy` 阶段并获得明确授权。

## 已有文件和复用点

- `DESIGN.md`：项目级 UI/UX 规范，已引用 Product Design 方案 2。
- `design/base-portal-final-design-option-2.md`：本轮前端定稿设计说明。
- `design/base-portal-selected-option-2-light-command-workspace.png`：本轮静态视觉稿。
- `docs/superpowers/plans/2026-06-19-high-fidelity-portal-restoration.md`：Product Design `design-qa` 后续高保真修复计划。
- `apps/portal-web/src/workspace.ts`：Portal tab 和 workspace 状态管理。
- `apps/portal-web/src/App.tsx`：Portal 壳 UI 组合。
- `apps/portal-web/src/styles.css`：当前前端样式入口。
- `apps/portal-web/src/workspace.test.ts`：workspace 行为测试。
- `deploy/docker-compose.yml`：当前 Docker Compose 基线。
- `deploy/web.Dockerfile`：当前应用镜像构建基线。
- `deploy/.env.example`：无 secret 的环境变量示例。
- `DEPLOY.md`：v0.1.0 部署与升级规范。

## 文件清单

### 前端重构

- Modify: `apps/portal-web/src/workspace.ts`
- Modify: `apps/portal-web/src/workspace.test.ts`
- Modify: `apps/portal-web/src/App.tsx`
- Modify: `apps/portal-web/src/styles.css`

### 部署和版本

- Modify: `deploy/docker-compose.yml`
- Modify: `deploy/web.Dockerfile`
- Modify: `deploy/.env.example`
- Create: `install.sh`
- Create: `upgrade.sh`
- Modify: `DEPLOY.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Create/Modify: `CLAUDE.md`

### 验证制品

- Create: `design/design-qa-v0.1.0.md`
- Create: `docs/qa/v0.1.0.md`
- Create: `docs/release-v0.1.0.md`

## 状态与数据流

```text
Menu click
  |
  v
openMenuTab(menu)
  |-- invalid / group node -> no business tab
  |-- valid leaf URL -> internal iframe business tab
  `-- repeated click -> activate existing tab

Business tab context menu
  |-- open external window
  |-- maximize active tab
  |-- close current
  |-- close other
  `-- close all

Deploy
  |
  v
build versioned image -> publish/load image -> install/upgrade script
  |
  v
docker compose up -> health/ready -> DNS -> cert -> nginx proxy -> production smoke
```

## Task 1: Workspace 行为收口

**Files:**
- Modify: `apps/portal-web/src/workspace.ts`
- Modify: `apps/portal-web/src/workspace.test.ts`

- [x] **Step 1: 写失败测试，证明菜单 `openMode` 不再控制默认打开方式**

Run:

```bash
pnpm --filter @base-portal/portal-web test
```

Expected before implementation: `new_tab` / `immersive_iframe` 菜单默认内部打开的新增测试失败。

- [x] **Step 2: 修改 `openMenuTab`，所有合法叶子菜单都打开内部 `iframe` 业务 tab**

Expected behavior:

- `new_tab` 菜单生成的 `WorkspaceTab.openMode === "iframe"`。
- `immersive_iframe` 菜单生成的 `WorkspaceTab.openMode === "iframe"`。
- 重复点击激活已有 tab。
- 第 21 个业务 tab 仍被上限拦截。

- [x] **Step 3: 补最大化和沉浸模式状态回落测试**

Expected behavior:

- 最大化只切换 workspace `maximized`。
- 退出最大化恢复到进入前的标准或沉浸状态。
- 退出沉浸会把当前 tab 的 `openMode` 改回 `iframe`。

## Task 2: Tab 右键菜单和 iframe 无感容器

**Files:**
- Modify: `apps/portal-web/src/App.tsx`
- Modify: `apps/portal-web/src/styles.css`

- [x] **Step 1: 用业务 tab 右键菜单替换常驻批量操作按钮**

Expected behavior:

- 业务 tab 右键菜单包含：`新窗口打开`、`最大化`、`关闭当前`、`关闭其他`、`关闭全部`。
- 固定首页 tab 不显示破坏性关闭操作。
- 菜单支持外部点击和 Escape 关闭。
- 菜单项都有 `aria-label` 或清晰文本。

- [x] **Step 2: 移除标准 iframe 常驻工具栏**

Expected behavior:

- 标准 iframe 区域不展示明显外框和顶部常驻工具按钮。
- fallback 面板仍提供 `刷新`、`复制链接`、`新窗口打开`。
- 最大化态有明确 `退出最大化` 控制。

## Task 3: TopBar 用户菜单

**Files:**
- Modify: `apps/portal-web/src/App.tsx`
- Modify: `apps/portal-web/src/styles.css`

- [x] **Step 1: 把常驻退出按钮收进 UserMenu**

Expected behavior:

- TopBar 右侧只展示头像、用户名称和下拉指示。
- 点击或键盘激活打开菜单。
- 菜单包含 `退出登录`。
- 登出仍调用现有 `logout()` 流程。

## Task 4: 响应式和 no-wrap 加固

**Files:**
- Modify: `apps/portal-web/src/App.tsx`
- Modify: `apps/portal-web/src/styles.css`

- [x] **Step 1: 为 TopBar、DomainNav、Sidebar、MenuNode、Tab、ContextMenu、UserMenu 和按钮增加单行约束**

Expected behavior:

- 1440px、1030px、834px、390px 下文本不换行。
- 长标题使用 ellipsis 和 `title` / tooltip。
- 按钮保持稳定高度和宽度。

- [x] **Step 2: 调整平板和手机 Portal 壳**

Expected behavior:

- 手机显示菜单入口、品牌短名和用户入口。
- Sidebar 以抽屉打开和关闭。
- TabStrip 单行横向滚动，不改变行高。
- 最大化退出入口始终可见。

## Task 5: 生产 Compose 和镜像版本化

**Files:**
- Modify: `deploy/docker-compose.yml`
- Modify: `deploy/web.Dockerfile`
- Modify: `deploy/.env.example`

- [x] **Step 1: 为生产部署增加固定镜像路径**

Expected behavior:

- 生产 Compose 可通过 `BASE_PORTAL_IMAGE=<registry>/base-portal:v0.1.0` 运行。
- 本地开发仍可保留 build 路径或通过单独 override 使用 build。
- Compose 不使用 `latest`。

- [x] **Step 2: 补齐版本和运行参数**

Expected behavior:

- `.env.example` 包含 `BASE_PORTAL_VERSION=v0.1.0`、`BASE_PORTAL_IMAGE`、`APP_VERSION`、`GIT_COMMIT`。
- 生产默认 `PORTAL_ENABLE_MOCK_AUTH=false`、`COOKIE_SECURE=true`。
- `.env.example` 不包含真实 secret。

- [x] **Step 3: 验证 Compose 配置**

Run:

```bash
docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
```

Expected: command exits 0 and rendered config uses fixed image tag for production path.

## Task 6: 首次安装脚本

**Files:**
- Create: `install.sh`
- Modify: `DEPLOY.md`
- Modify: `README.md`

- [x] **Step 1: 创建 `install.sh` 的参数和前置检查**

Expected behavior:

- 支持 `--host bpmt@120.24.236.92`、`--remote-dir /home/bpmt/base-portal`、`--version v0.1.0`。
- 检查本地 `ssh`、`tar`、远端 `docker compose` 或必要命令。
- 检查目标版本不是 `latest`。

- [x] **Step 2: 实现远端首次安装流程**

Expected behavior:

- 远端已有 `.deploy/version` 时拒绝重复安装。
- 创建 `/home/bpmt/base-portal`、`releases/v0.1.0`、`data/postgres`、`backups`。
- 同步 Compose、`.env.example`、脚本和必要 release 资产。
- 远端 `deploy/.env` 缺失时只生成模板并停止，提示人工补真实配置。
- 不覆盖远端已有 `deploy/.env`。

- [x] **Step 3: 启动服务并验证健康检查**

Expected behavior:

- `docker compose up -d` 在远端执行。
- `curl -fsS http://127.0.0.1:<HOST_WEB_PORT>/health` 通过。
- `curl -fsS http://127.0.0.1:<HOST_WEB_PORT>/ready` 通过。
- 成功后写入 `.deploy/version`。

## Task 7: 升级脚本

**Files:**
- Create: `upgrade.sh`
- Modify: `DEPLOY.md`
- Modify: `README.md`

- [x] **Step 1: 创建 `upgrade.sh` 的版本检查**

Expected behavior:

- 读取远端 `.deploy/version`。
- 默认拒绝同版本升级、降级和未声明跨版本跳跃。
- 支持 `--from` / `--to` 或等价显式参数。

- [x] **Step 2: 实现配置和数据保护**

Expected behavior:

- 备份远端 `deploy/.env`。
- 不回显真实 `.env` 内容。
- 对比 `.env.example` 并报告新增必填变量。
- 在修改服务前准备数据库备份或明确记录 v0.1.0 无上一个生产版本。

- [x] **Step 3: 执行 Compose 升级和健康检查**

Expected behavior:

- 同步目标版本资产。
- 重启服务。
- 执行 `/health`、`/ready`。
- 通过后更新 `.deploy/version`。

## Task 8: DNS、证书和 nginx 反向代理

**Files:**
- Modify: `install.sh`
- Modify: `upgrade.sh`
- Modify: `DEPLOY.md`
- Create: `docs/release-v0.1.0.md`

- [x] **Step 1: 增加阿里云 CLI DNS 检查和写入步骤**

Expected behavior:

- `aliyun sts GetCallerIdentity` 可验证凭证。
- `DescribeSubDomainRecords` 检查 `base-portal.riversoft.com.cn`。
- 记录不存在时新增 A 记录到 `120.24.236.92`。
- 记录存在但值不一致时更新。
- 使用 `dig +short base-portal.riversoft.com.cn` 验证。

- [x] **Step 2: 探测服务器 `~/nginx` 结构**

Expected behavior:

- 识别 nginx 是宿主机进程还是 Docker Compose 服务。
- 识别配置目录、证书目录、reload/recreate 命令。
- 不读取或输出证书私钥。

- [ ] **Step 3: 配置证书和反向代理**

Expected behavior:

- 证书覆盖 `base-portal.riversoft.com.cn`。
- HTTP 跳转 HTTPS。
- HTTPS 反向代理到 `127.0.0.1:<HOST_WEB_PORT>`。
- 设置 `X-Forwarded-*` 头。
- reload 或 recreate nginx 后，生产 URL 可访问。

Current evidence:

- `system-nginx` 已写入 base-portal managed block 并通过 `nginx -t`。
- 通配符证书覆盖 `base-portal.riversoft.com.cn`，TLS 校验通过。
- 生产 URL 当前返回 `502`，因为远端 `deploy/.env` 仍是模板，应用容器尚未启动。

## Task 9: 自动化验证

**Files:**
- Read: `DESIGN.md`
- Read: `DEPLOY.md`
- Read: `apps/portal-web/src/*`
- Read: `apps/api/src/*`

- [x] **Step 1: 前端验证**

Run:

```bash
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web build
```

Expected: all commands exit 0.

- [x] **Step 2: 后端验证**

Run:

```bash
pnpm --filter @base-portal/api test
pnpm --filter @base-portal/api typecheck
pnpm --filter @base-portal/api lint
pnpm --filter @base-portal/api build
```

Expected: all commands exit 0.

- [x] **Step 3: 部署脚本验证**

Run:

```bash
bash -n install.sh
bash -n upgrade.sh
docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
```

Expected: all commands exit 0.

## Task 10: 浏览器、视觉和功能 QA

**Files:**
- Create: `design/design-qa-v0.1.0.md`
- Create: `docs/qa/v0.1.0.md`

- [x] **Step 1: 本地浏览器验证**

Expected:

- mock login path reaches Portal shell.
- opening `订单中心` creates an internal tab.
- right-click tab menu exposes tab/window actions.
- iframe standard mode has no toolbar shell.
- user menu contains logout.
- long menu/tab/user names do not wrap.

- [x] **Step 2: 截图覆盖**

Expected screenshots:

- Desktop 1440px.
- Tablet 834px.
- Phone 390px.
- Standard iframe.
- Fallback panel.
- Maximized iframe.
- User menu.
- Tab context menu.

- [ ] **Step 3: 生产 smoke**

Expected:

- `https://base-portal.riversoft.com.cn` loads.
- `/health` and `/ready` pass.
- HTTPS certificate is valid for the domain.
- Browser console has no unexpected runtime errors in the Portal shell.

Current blocker:

- 远端 `deploy/.env` 仍需补真实 `POSTGRES_PASSWORD`、`DATABASE_URL`、`FEISHU_IAM_CLIENT_SECRET`、`FEISHU_IAM_DEVELOPER_API_TOKEN`。
- `install.sh` 已验证会在启动前阻止模板配置，只输出问题 key，不输出 secret 值。

## Completion Standard

- `DEPLOY.md` exists and is linked from `AGENTS.md` and `CLAUDE.md`.
- `IMPLEMENTATION_PLAN.md` describes v0.1.0 frontend + issues + deployment scope.
- `install.sh` exists and passes `bash -n install.sh`.
- `upgrade.sh` exists and passes `bash -n upgrade.sh`.
- `docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config` passes.
- Frontend test/typecheck/lint/build pass.
- Backend test/typecheck/lint/build pass.
- Browser evidence covers desktop, tablet and phone.
- Issues #1-#5 each have implemented behavior and verification evidence.
- Production DNS resolves `base-portal.riversoft.com.cn` to `120.24.236.92`.
- Production HTTPS certificate is valid.
- `~/nginx` reverse proxy serves the app.
- Remote `.deploy/version` reads `v0.1.0`.
- Production `/health` and `/ready` pass.
- No real secret, token, cookie, cert private key or `.env` content is written to repo, logs, screenshots or chat.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Eng Review | `gstack /plan-eng-review` | 锁定 v0.1.0 架构、测试和部署边界 | 1 | issues_open | 原计划缺少生产部署契约、固定镜像、install/upgrade、DNS/证书/nginx 任务；本文件已吸收为实施任务 |
| Design Review | `gstack /plan-design-review` | UI/UX 定稿和状态覆盖 | 1 | cleared | Product Design 方案 2 已定稿，并记录到 `design/` |

- **UNRESOLVED:** 0
- **VERDICT:** ENG PLAN READY FOR WRITING-PLANS HANDOFF；正式编码前仍需按本计划执行第 7 步 implementation。
