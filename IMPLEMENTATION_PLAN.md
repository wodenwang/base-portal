# Base Portal Implementation Plan

日期：2026-06-19

## 目标

实现首个本地可运行 vertical slice，覆盖 IAM 登录入口、session 模拟/真实边界、功能域和菜单模型、权限过滤、Portal 壳、Tab 工作区、iframe 占位页、审计、运维同步 API 骨架、Docker Compose 和本地验证。

远端部署本轮不执行，但保留本地环境给用户测试。

## 文件结构

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `apps/api`
- `apps/portal-web`
- `deploy/docker-compose.yml`
- `deploy/.env.example`
- `IMPLEMENTATION_PLAN.md`
- `design/base-portal-visual-target.md`

## 任务拆分

### 1. Monorepo 和工具链

- 创建根 `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`。
- 配置 `pnpm build`、`pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm check`。

完成标准：

- `pnpm install` 成功。
- workspace 能识别 `apps/api` 和 `apps/portal-web`。

### 2. 后端 API

- 创建 NestJS API。
- 配置 Prisma 和 PostgreSQL schema。
- 实现健康检查 `/health`、`/ready`、`/version`。
- 实现 session、auth、navigation、audit、ops 模块。
- 提供 dev mock login，便于没有真实 IAM secret 时本地测试 Portal。
- 保留真实 IAM OAuth 接入代码路径。

完成标准：

- API 可在 `localhost:3000` 启动。
- `GET /health`、`GET /ready`、`GET /version` 可用。
- `GET /api/navigation` 能按 session 权限过滤菜单。

### 3. 数据模型和 seed

- Prisma 定义 `PortalDomain`、`PortalMenu`、`PortalAuditEvent`。
- Prisma seed 写入默认功能域和菜单。
- 默认 URL 使用 `/placeholder/:menuKey`。

完成标准：

- `pnpm --filter @base-portal/api prisma:generate` 成功。
- seed 可重复运行。

### 4. 前端 Portal

- 创建 React/Vite app。
- 实现顶部、功能域、用户区、左侧菜单、Tab 工作区。
- 实现 `iframe`、`immersive_iframe`、`new_tab`。
- 实现应用内最大化。
- 实现 iframe fallback 面板。
- 实现手机兜底菜单。

完成标准：

- `localhost:5173` 可打开。
- dev mock login 后能看到功能域、菜单和 tab。
- 业务 tab 上限 20，固定首页 tab 不计入。

### 5. 审计和运维

- 前端打开菜单时调用 `POST /api/audit/menu-opened`。
- 后端写入 `PortalAuditEvent`。
- 实现 `POST /api/ops/sync-iam-resources` 骨架。
- 无 developer token 时返回清晰错误，不泄露 secret。

完成标准：

- 菜单打开不因审计失败阻塞。
- ops API 未登录或非管理员不可调用。

### 6. Docker Compose

- 提供 `deploy/docker-compose.yml`。
- 提供 `deploy/.env.example`。
- web 容器连接 db。

完成标准：

- 本地至少可通过 pnpm dev 跑通。
- Docker Compose 文件存在并通过基本配置检查。

### 7. 验证

运行：

- `pnpm install`
- `pnpm check`
- `pnpm build`
- 浏览器检查 Portal 主路径。

完成标准：

- 命令通过或失败原因明确。
- 本地服务保留运行，提供 URL 给用户测试。

## 不做

- 不执行远端部署。
- 不创建 release tag。
- 不把 secret 写入仓库。
- 不做完整管理 UI。
