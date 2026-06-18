# Base Portal 工程评审

日期：2026-06-19

## 结论

当前方案可以进入实施计划。首版采用 `pnpm monorepo + NestJS API + Prisma/PostgreSQL + React/Vite + Tailwind/Radix/lucide + Docker Compose`，与 `feishu-iam` 保持技术同源。

## 架构边界

- `apps/api` 承载 OAuth、session、导航过滤、审计、运维同步、健康检查和静态资源托管。
- `apps/portal-web` 承载 Portal 壳、功能域、菜单、tab、iframe 容器、沉浸和最大化交互。
- PostgreSQL 是功能域、菜单、审计和初始化数据的持久化源。
- 内存 session 只作为首版单实例本地和初期部署方案，多实例不在首版范围内。

## 关键决策

- OAuth callback 必须兼容根路径 `https://base-portal.riversoft.com.cn` 收到 `code/state`。
- 登录成功后一次性拉取 IAM 权限集合，session 内缓存，用于导航过滤。
- Portal 不做第三方 URL 二次鉴权。
- 运维 API 由已登录用户 + `PORTAL_ADMIN_USER_IDS` 控制。
- Developer API token 只在后端环境变量中使用。
- 固定首页 tab 是前端内置虚拟 tab，不写入数据库。
- 业务 tab 状态不持久化，刷新后从当前功能域首页重新开始。

## 数据和迁移

Prisma 模型包含：

- `PortalDomain`
- `PortalMenu`
- `PortalAuditEvent`

初始化数据通过 Prisma seed 写入，使用稳定 key 做 upsert，确保本地重复执行不会重复创建。

## 测试策略

后端：

- OAuth service URL 构造和 callback 处理。
- session guard。
- navigation permission filtering。
- audit service。
- ops sync guard。
- health/ready/version。

前端：

- tab reducer。
- domain switch clears business tabs。
- fixed home tab not counted in business tab limit。
- close all / close others respects confirm flag。
- maximize exits back to previous mode。
- sidebar and domain nav responsive states。

浏览器：

- 本地 app 可以打开。
- 门户壳可见。
- 菜单打开 iframe tab。
- tab 操作可用。
- 沉浸和最大化可进入退出。

## 发布和部署边界

当前目标到本地发布收口，不执行远端部署。需要保留本地测试环境给用户访问。

本地验收地址优先使用：

- API/生产构建服务：`http://localhost:3000`
- Vite 开发服务：`http://localhost:5173`

若端口占用，使用下一个可用端口并在交付说明中写明。
