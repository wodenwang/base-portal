# 2026-06-19 本地验证记录

## 环境

- 本地地址：http://localhost:3000
- 部署方式：`docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build`
- 数据库：PostgreSQL 16-alpine container
- 登录方式：`PORTAL_ENABLE_MOCK_AUTH=true`

## 自动化命令

- `pnpm check`：通过。覆盖 typecheck、lint、API Vitest、前端 workspace Vitest。
- `pnpm build`：通过。API Nest build 和 portal-web Vite build 均成功。
- `docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps`：`deploy-db-1` healthy，`deploy-web-1` running，端口 `3000:3000`。
- `curl -fsS http://localhost:3000/health`：返回 `{"status":"ok"}`。
- `curl -fsS http://localhost:3000/ready`：返回 database ok。
- `curl -fsS http://localhost:3000/placeholder/ops-orders`：返回前端 `index.html`，确认 SPA fallback 生效。

## API 链路

- `GET /api/auth/mock-login`：返回 302 到 `/`，写入 `bp_session` cookie。
- 本地 cookie 验证：`Set-Cookie` 不包含 `Secure`，可在 `http://localhost:3000` 下浏览器测试。
- `GET /api/session`：返回 `authenticated=true` 和 mock 用户。
- `GET /api/navigation`：返回 3 个功能域：`operations`、`management`、`services`。

## 浏览器交互验证

- 通过浏览器访问 `/api/auth/mock-login` 后进入门户首页。
- 点击“订单中心”：创建业务 tab，右侧 iframe 显示 `ops-orders` 占位页。
- 点击“客户视图”：进入 `immersive_iframe`，隐藏功能域导航和左侧菜单，保留 tab 和“退出沉浸”。
- 点击“最大化”：只展示当前功能页内容和工具条，按钮变为“退出最大化”。
- 点击“管理驾驶舱”：出现确认框，提示将关闭当前业务标签页。
- 接受确认后点击“经营概览”：管理域菜单出现，原运营域业务 tab 已清空。
- 点击“审批中心”：按 `new_tab` 模式打开新浏览器标签页 `/placeholder/mgmt-approval`。

## 视觉证据

- [desktop home](./base-portal-desktop-home.png)
- [mobile home](./base-portal-mobile-home.png)
- [mobile verified](./base-portal-mobile-verified.png)
- [current after wait](./base-portal-current-after-wait.png)

## 已发现并修复的问题

- API 启动路径错误：容器内 Nest build 输出在 `dist/src/main.js`，已修正启动脚本。
- 本地 HTTP cookie 带 `Secure`：浏览器本地测试无法稳定保存 session，已新增 `COOKIE_SECURE` 开关并在本地 compose 设为 `false`。
- iframe 内 `/placeholder/...` 返回 404 JSON：已新增 SPA fallback，前端占位页可在 iframe 中渲染。
- 前端 bootstrap 缺少异常兜底：已新增初始化错误态和重试入口，避免永久停留在加载态。

## 剩余风险

- 当前本地验证使用 mock 登录。真实 Feishu IAM 登录仍需要在部署环境注入 `FEISHU_IAM_CLIENT_SECRET`，并使用已登记的 HTTPS redirect URI。
- 开发者 API 同步接口已实现 dry-run 和真实 token 分支，但未使用真实 developer token 做线上调用验证。
