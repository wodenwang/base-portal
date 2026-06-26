# my-harness 当前状态

项目：`base-portal`

版本：`v0.3.1`

状态：`V0.3.1_DEPLOYED`

## v0.3.1 当前判断

推荐方向：部署治理和权限 UI 范围收口补丁版。

当前下一步：无。v0.3.1 已完成本地验证、GitHub release、生产部署和读回。

关键证据：

- 用户已确认本版本权限相关 UI 全部不做。
- 范围决策：`design/2026-06-27-v0.3.1-scope-decision.md`
- 实施计划：`docs/superpowers/plans/2026-06-27-v0.3.1-permission-ui-scope-closeout.md`
- Release notes：`docs/release-v0.3.1.md`
- 本地验证：`docs/verification/2026-06-27-v0.3.1-local-verification.md`
- 生产部署：`docs/verification/2026-06-27-v0.3.1-production-deploy.md`
- 版本默认值已更新到 `0.3.1` / `v0.3.1`。
- `deploy/docker-compose.yml` 的 `BASE_PORTAL_VERSION` / `APP_VERSION` fallback 已从旧版本修正为 `v0.3.1` / `0.3.1`。
- 生产 `.deploy/version` 读回 `v0.3.1`，`/health`、`/ready`、`/version` 通过。

## v0.3.1 15-Step Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | 用户从权限矩阵规划中明确改为本版本下架权限矩阵，并确认权限相关 UI 全部不做 |
| 2 | Product/design planning review | skipped | 本版本不新增 UI；`design/2026-06-27-v0.3.1-scope-decision.md` 明确不需要 Product Design 视觉稿 |
| 3 | Design artifact / visual target | complete | `design/2026-06-27-v0.3.1-scope-decision.md` 记录无新增视觉目标和后续恢复权限矩阵的入口条件 |
| 4 | Product design review | skipped | 无新增视觉制品；沿用 `DESIGN.md` 与 v0.3.0 `Light Command Workspace` |
| 5 | Eng review | skipped | 小版本仅改版本默认值、部署治理和文档范围；不改架构、数据流、权限 API 或 schema |
| 6 | Writing plan | complete | `docs/superpowers/plans/2026-06-27-v0.3.1-permission-ui-scope-closeout.md` |
| 7 | Executing plan | complete | 版本默认值、README、DEPLOY、release notes 和 `.my-harness/` 已更新 |
| 8 | Verification before completion | complete | `docs/verification/2026-06-27-v0.3.1-local-verification.md`；`pnpm check`、`pnpm build`、Compose config、脚本语法和 `git diff --check` 通过 |
| 9 | Browser verification | complete | 生产 `GET /` 返回 `200 text/html`，`/api/auth/login` 返回 `302` 到 Feishu IAM OAuth authorize；本版本无新增前端交互 |
| 10 | Visual QA | skipped | 不新增 UI；仅需确认线上页面未破坏 |
| 11 | Functional QA | complete | 生产 `.deploy/version=v0.3.1`，`/health`、`/ready`、`/version` 通过；登录入口 302 到 Feishu IAM |
| 12 | Review | complete | diff 边界限定为 v0.3.1 版本/部署默认值、Docker context 修复、范围文档和验证记录；secret 扫描未发现新增真实 secret |
| 13 | Git closeout | complete | release commit 包含 `.dockerignore`、版本 bump、部署默认值修正、release notes、本地验证和生产部署记录 |
| 14 | Ship | complete | GitHub Release `v0.3.1` |
| 15 | Land and deploy | complete | 已部署到 `bpmt@120.24.236.92:/home/bpmt/base-portal`，生产读回见 `docs/verification/2026-06-27-v0.3.1-production-deploy.md` |

## v0.3.0 当前判断

推荐方向：第三方无感接入体验版。

当前下一步：无。v0.3.0 已完成 release + deploy；后续可进入 v0.3.1 或将 SSO Demo 外部配合需求复制到 `feishu-iam-sso-demo` 项目继续推进。

关键证据：

- Step 1 已确认：版本定位为 `v0.3.0`，范围包含 GitHub `#11/#12/#13`，交付终点为 release + deploy。
- Step 2 已确认：SSO Demo 自己完成 OAuth/session；Base Portal 不传 token、cookie、code 或 secret，只负责入口编排、权限过滤、iframe/new-window/fallback 和可恢复体验。
- Step 2 已确认：移除沉浸模式；历史 `openMode=immersive_iframe` 运行时兼容降级为标准 iframe，不做高风险 schema migration。
- Step 2 已确认：Tab 右键菜单和 Tab 三点菜单都提供刷新当前 iframe。
- Step 3 设计制品：`design/2026-06-20-v0.3.0-design-decision.md`
- Step 3 治理同步：`DESIGN.md`、`design/base-portal-visual-target.md`、`design/base-portal-final-design-option-2.md`
- Step 4 Product Design review：`design/2026-06-20-v0.3.0-product-design-review.md`
- Step 5 Engineering review：`docs/superpowers/specs/2026-06-20-v0.3.0-engineering-review.md`
- Step 6 Implementation plan：`IMPLEMENTATION_PLAN.md`、`docs/superpowers/plans/2026-06-20-v0.3.0-embedded-sso-workspace.md`
- Step 7 Implementation：版本默认值、workspace refresh、移除沉浸入口、接入包兼容、seed 和 SSO Demo 菜单包已落地
- Step 8 Local verification：`docs/verification/2026-06-20-v0.3.0-local-verification.md`
- Step 9 Browser verification：`docs/verification/2026-06-20-v0.3.0-browser-verification.md`
- Step 10 Visual QA：`docs/qa/2026-06-20-v0.3.0-visual-qa.md`
- Step 11 Functional QA：`docs/qa/2026-06-20-v0.3.0-functional-qa.md`
- Step 12 Pre-landing review：`docs/reviews/2026-06-20-v0.3.0-pre-landing-review.md`
- Step 15 Production deploy：`docs/verification/2026-06-20-v0.3.0-production-deploy.md`
- SSO Demo 配合需求：`docs/external-requirements/2026-06-20-feishu-iam-sso-demo-embedded-sso.md`

## v0.3.0 15-Step Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | 用户确认 D1=B、D2=B、D3=C，v0.3.0 做第三方无感接入体验版并交付到 release + deploy |
| 2 | Product/design planning review | complete | 用户确认 D1=B、D2=B、D3=B，职责边界、移除沉浸模式和刷新入口已定 |
| 3 | Design artifact / visual target | complete | `design/2026-06-20-v0.3.0-design-decision.md`，并同步 `DESIGN.md` 与既有视觉目标中的沉浸模式冲突 |
| 4 | Product design review | complete | `design/2026-06-20-v0.3.0-product-design-review.md`，无关键设计阻塞，无需新增完整视觉稿 |
| 5 | Eng review | complete | `docs/superpowers/specs/2026-06-20-v0.3.0-engineering-review.md`，锁定 `new_tab` hint、`immersive_iframe` 降级、iframe refresh revision 和 SSO Demo 配合边界 |
| 6 | Writing plan | complete | `IMPLEMENTATION_PLAN.md`、`docs/superpowers/plans/2026-06-20-v0.3.0-embedded-sso-workspace.md` |
| 7 | Executing plan | complete | 版本默认值、workspace refresh、移除沉浸入口、接入包兼容、seed 和 SSO Demo 菜单包已落地 |
| 8 | Verification before completion | complete | `docs/verification/2026-06-20-v0.3.0-local-verification.md`，`pnpm check`、`pnpm build`、Compose config、脚本语法和 `git diff --check` 通过 |
| 9 | Browser verification | complete | `docs/verification/2026-06-20-v0.3.0-browser-verification.md`，桌面/平板/手机、SSO Demo iframe、tab refresh、无沉浸入口和最大化通过 |
| 10 | Visual QA | complete | `docs/qa/2026-06-20-v0.3.0-visual-qa.md` |
| 11 | Functional QA | complete | `docs/qa/2026-06-20-v0.3.0-functional-qa.md` |
| 12 | Review | complete | `docs/reviews/2026-06-20-v0.3.0-pre-landing-review.md`，未发现阻塞 ship / deploy 的问题 |
| 13 | Git closeout | complete | `main` 已包含 v0.3.0 closeout commit，最终以 `v0.3.0` tag / `origin/main` / 生产 `/version.commit` 对齐为准 |
| 14 | Ship | complete | GitHub Release `v0.3.0` |
| 15 | Land and deploy | complete | `docs/verification/2026-06-20-v0.3.0-production-deploy.md`，生产 `/health`、`/ready`、`/version`、SSO Demo 接入包、IAM sync、权限过滤和公网 smoke 均通过 |

## v0.2.0 当前判断

推荐方向：真实 Feishu IAM 接入验收 + 第三方应用接入运营化。

当前下一步：无。v0.2.0 已发布、部署，并完成真实 Feishu IAM 登录、用户信息读取、权限读取、无权限状态、权限过滤、审计和生产读回验收。

关键证据：

- `v0.1.2` 已闭环并部署，线上 `/version` 读回 `0.1.2`。
- `AGENTS.md` 已固定 Feishu IAM 接入、安全和 secret 边界。
- `DESIGN.md` 明确当前不是完整 Admin Console / CRUD 后台，也不是企业工作台。
- `DEPLOY.md` 要求版本化 Docker image、`install.sh` / `upgrade.sh`、健康检查和生产读回。
- 用户已确认 v0.2.0 范围为真实 IAM 验收 + 一个第三方应用接入包。
- ops API 已扩展 `/api/ops/import-app-package` 和 `/api/ops/sync-iam-resources`，覆盖 permission point、permission group、绑定、dry-run/apply 和审计边界。
- GitHub #6-#9 是 v0.1.2 housekeeping；#10 是视觉小修候选，不应抢占 v0.2.0 主目标。
- 用户已确认 Step 2 D1 选择 A：不新增配置 UI，只做文件导入 + ops API + 真实用户路径验收。
- Step 2 Product Design planning review 记录：`design/2026-06-19-v0.2.0-product-design-planning-review.md`
- Step 3 设计制品判断记录：`design/2026-06-19-v0.2.0-step3-design-artifact-decision.md`
- Step 5 工程评审记录：`docs/superpowers/specs/2026-06-19-v0.2.0-engineering-review.md`
- Step 6 实施计划：`IMPLEMENTATION_PLAN.md`、`docs/superpowers/plans/2026-06-19-v0.2.0-iam-app-package.md`
- Step 7 实现：`config/portal-apps/base-portal-demo.json`、`apps/api/src/modules/ops.service.ts`
- v0.2.0 发布说明：`docs/release-v0.2.0.md`
- 本地验证：`docs/verification/2026-06-19-v0.2.0-local-verification.md`
- Step 12 review：`docs/reviews/2026-06-19-v0.2.0-pre-landing-review.md`
- 生产部署验证：`docs/verification/2026-06-19-v0.2.0-production-deploy.md`
- OAuth 根路径回调修复：`apps/api/src/main.ts` 关闭静态中间件默认 `index`，并由 `apps/api/test/main.static.spec.ts` 覆盖 `/?code&state` 进入 Nest controller 的回归场景。
- 当前生产读回：`/version.version=0.2.0`，`/version.commit`、`origin/main` 和 `v0.2.0` tag 一致；远端镜像 `base-portal-release:v0.2.0` 为 `linux/amd64`。
- 真实 Feishu IAM 用户路径已完成：浏览器回到 `https://base-portal.riversoft.com.cn/`，`/api/session` 200 且 `authenticated=true`，`/api/navigation` 200。
- 当前真实用户权限点数量为 `0`，生产导航域数量为 `0`，覆盖真实无权限状态；权限过滤 full/partial/no-permission 已通过生产容器内脱敏验证。
- 生产审计最新 `login_success` 为 `mode=iam`；代码路径证明该事件只会在 `code -> token -> userinfo -> me/permissions` 全部成功后写入。

v0.2.0 Discovery 记录：`.my-harness/runs/2026-06-19-v0.2.0-discovery.md`

## v0.2.0 15-Step Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | 用户确认 D1=B，v0.2.0 做真实 IAM 验收 + 一个第三方应用接入包 |
| 2 | Product/design planning review | complete | 用户确认 D1=A，不新增配置 UI |
| 3 | Design artifact / visual target | skipped | 无新增主要 UI，沿用现有 `Light Command Workspace`，见 `design/2026-06-19-v0.2.0-step3-design-artifact-decision.md` |
| 4 | Product design review | skipped | Step 3 未产生新增设计制品，无需额外评审 |
| 5 | Eng review | complete | `docs/superpowers/specs/2026-06-19-v0.2.0-engineering-review.md` |
| 6 | Writing plan | complete | `IMPLEMENTATION_PLAN.md`、`docs/superpowers/plans/2026-06-19-v0.2.0-iam-app-package.md` |
| 7 | Executing plan | complete | 已实现接入包导入、IAM sync、权限过滤测试、版本默认值和 release docs |
| 8 | Verification before completion | complete | `pnpm check`、`pnpm build`、Compose config、shell syntax、diff check 通过；新增 `main.static.spec.ts` 防止 OAuth 根路径回调被 SPA 静态页截获 |
| 9 | Browser verification | complete | Playwright desktop/mobile/demo-domain 截图，console error 0 |
| 10 | Visual QA | skipped | v0.2.0 未新增主要 UI，Step 3 已判定沿用 Light Command Workspace |
| 11 | Functional QA | complete | 本地 mock-admin 覆盖导入 dry-run/apply、sync dry-run、导航可见性、审计读回 |
| 12 | Review | complete | `docs/reviews/2026-06-19-v0.2.0-pre-landing-review.md`，2 个边界问题已 auto-fixed 并复验 |
| 13 | Git closeout | complete | `main` pushed；最终 commit 以 `v0.2.0` tag、`origin/main` 和生产 `/version.commit` 一致读回为准 |
| 14 | Ship | complete | GitHub Release `v0.2.0` created and retagged after release asset sync fix |
| 15 | Land and deploy | complete | 生产 `/version=0.2.0`、`/version.commit` 与 `v0.2.0` tag 和 `origin/main` 一致；IAM developer API apply、权限过滤、真实用户 OAuth 登录、userinfo、me/permissions 和审计均完成 |

---

## v0.1.2 范围

- #6 Tab 关闭按钮固定居右。
- #7 Tab 支持桌面拖拽改变顺序，并提供菜单 fallback 左移/右移。
- #8 菜单栏收缩态改为 Compact flyout sidebar。
- #9 ContextMenu/DropdownMenu 统一 cursor、hover、focus、disabled 状态。

## 非范围

- 不引入菜单管理 UI。
- 不引入 Tab 持久化。
- 不扩展工作台功能。
- 不引入第二套 UI 框架。
- 不改变部署拓扑、OAuth、权限、数据库 schema 或 secret 处理边界。

## 15-Step Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | 用户确认 D1=B，v0.1.2 包含 #6-#9 |
| 2 | Product/design planning review | complete | Step 2 read-only review：#6/#9 局部收口，#7/#8 需明确视觉交互目标 |
| 3 | Design artifact / visual target | complete | Step 3 草案：Compact flyout sidebar、固定 close、拖拽状态矩阵、Radix 状态规则 |
| 4 | Product design review | complete | 接受方案 B、桌面拖拽 + 菜单 fallback、手机不强求触屏拖拽 |
| 5 | Eng review | complete | 原生 HTML drag/drop + `reorderTabs` 纯模型，不引入排序库 |
| 6 | Writing plan | complete | `IMPLEMENTATION_PLAN.md`、`docs/superpowers/plans/2026-06-19-v0.1.2-ux-hardening.md` |
| 7 | Executing plan | complete | #6-#9 实现落地 |
| 8 | Verification before completion | complete | `pnpm check`、`pnpm build`、Compose config、`git diff --check` 通过 |
| 9 | Browser verification | complete | Playwright desktop/tablet/mobile 截图 |
| 10 | Visual QA | complete | 视觉复查发现并修复移动断点侧栏泄漏 |
| 11 | Functional QA | complete | 本地 mock-auth、Tab fallback、drag reorder、health/ready/version |
| 12 | Review | complete | `docs/reviews/2026-06-19-v0.1.2-pre-landing-review.md` |
| 13 | Git closeout | complete | `fix: harden portal workspace ux` pushed to `main`; final closeout retag follows this record |
| 14 | Ship | complete | GitHub Release `v0.1.2` created |
| 15 | Land and deploy | complete | 92 服务器运行 `base-portal-release:v0.1.2`，线上 `/version` 读回 `0.1.2` |

## 当前验证读回

- 本地 QA URL：`http://127.0.0.1:3102`
- 本地镜像：`base-portal-local:v0.1.2`
- 本地 `/health`：`{"status":"ok"}`
- 本地 `/ready`：`{"status":"ready","checks":{"database":"ok"}}`
- 本地 `/version`：`version=0.1.2`
- Playwright 截图：
  - `output/playwright/base-portal-v0.1.2-desktop-flyout.png`
  - `output/playwright/base-portal-v0.1.2-tablet-834x1112.png`
  - `output/playwright/base-portal-v0.1.2-mobile-390x844.png`
  - `output/playwright/base-portal-v0.1.2-production-login.png`

## v0.1.2 生产读回

- 远端 `.deploy/version`：`v0.1.2`。
- 远端容器：`deploy-web-1` 使用 `base-portal-release:v0.1.2`。
- 远端 image id：`sha256:b7706779de49c974169c355a36fcf0137f7d3db4bb0fa29f22134b03575d0ed1`。
- 生产 `/health`：`{"status":"ok"}`。
- 生产 `/ready`：`{"status":"ready","checks":{"database":"ok"}}`。
- 生产 `/version`：`version=0.1.2`，commit 由最终 release tag 和线上读回校验。
- Playwright 生产 smoke：登录页渲染、console error 0、`/api/session` 200。

## Secret 边界

- 不读取、不回显真实 `deploy/.env`。
- 不提交 `deploy/.env`。
- 远端 env gate 只允许输出 key 名称，不允许输出 secret 值。
