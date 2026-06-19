# Base Portal v0.1.2 发布记录

状态：`COMPLETE`

## 范围

v0.1.2 是 UX hardening patch release，包含：

- #6 Tab 关闭按钮固定居右，长标题省略，home tab 不显示关闭按钮。
- #7 业务 Tab 支持桌面拖拽排序，并提供 ContextMenu/DropdownMenu 的左移/右移 fallback。
- #8 菜单栏收缩态改为 Compact flyout sidebar，避免“菜单”文字挤压和只剩文件夹图标的问题。
- #9 ContextMenu/DropdownMenu 统一 cursor、hover、focus、disabled 和 separator 状态。

## 非范围

- 不新增菜单管理 UI。
- 不新增 Tab 持久化。
- 不新增工作台功能。
- 不引入第二套 UI 框架。
- 不改变 OAuth、权限、数据库 schema 或部署拓扑。

## 本地验证

```bash
pnpm check
pnpm build
BASE_PORTAL_IMAGE=base-portal-release:v0.1.2 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
bash -n install.sh
bash -n upgrade.sh
git diff --check
```

结果：2026-06-19 22:37 CST 通过。

## 浏览器验证

- 本地 QA URL：`http://127.0.0.1:3102`
- 本地 `/health`：通过。
- 本地 `/ready`：通过。
- 本地 `/version`：`version=0.1.2`。
- Tab fallback：右键菜单 `左移` 可重排，active tab 和 iframe src 保持一致。
- Tab drag/drop：拖拽后顺序读回为 `运营中心 / 订单中心 / 商机列表 / 客户列表`，active tab 为 `订单中心`，iframe src 为 `/placeholder/ops-orders`。
- 截图：
  - `output/playwright/base-portal-v0.1.2-desktop-flyout.png`
  - `output/playwright/base-portal-v0.1.2-tablet-834x1112.png`
  - `output/playwright/base-portal-v0.1.2-mobile-390x844.png`

## 发布状态

- GitHub Release：`https://github.com/wodenwang/base-portal/releases/tag/v0.1.2`
- 远端 image：`base-portal-release:v0.1.2`
- 远端 image id：`sha256:b7706779de49c974169c355a36fcf0137f7d3db4bb0fa29f22134b03575d0ed1`
- 远端 `.deploy/version`：`v0.1.2`
- 线上 `/health`：`{"status":"ok"}`
- 线上 `/ready`：`{"status":"ready","checks":{"database":"ok"}}`
- 线上 `/version`：`version=0.1.2`，commit 由最终 release tag 和线上读回校验。
- 生产 Playwright：登录页渲染通过，console error 0，截图见 `output/playwright/base-portal-v0.1.2-production-login.png`。
