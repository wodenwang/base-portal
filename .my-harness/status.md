# my-harness 当前状态

项目：`base-portal`

版本：`v0.2.0`

状态：`V0.2.0_RELEASED_AND_DEPLOYED_WITH_OAUTH_USER_ACCEPTANCE_PENDING`

## v0.2.0 当前判断

推荐方向：真实 Feishu IAM 接入验收 + 第三方应用接入运营化。

当前下一步：需要人工使用真实飞书用户登录完成 OAuth `code -> userinfo -> me/permissions` 最终验收。v0.2.0 已发布、部署，生产 IAM developer API sync apply 已完成。

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
| 8 | Verification before completion | complete | `pnpm check`、`pnpm build`、Compose config、shell syntax、diff check 通过 |
| 9 | Browser verification | complete | Playwright desktop/mobile/demo-domain 截图，console error 0 |
| 10 | Visual QA | skipped | v0.2.0 未新增主要 UI，Step 3 已判定沿用 Light Command Workspace |
| 11 | Functional QA | complete | 本地 mock-admin 覆盖导入 dry-run/apply、sync dry-run、导航可见性、审计读回 |
| 12 | Review | complete | `docs/reviews/2026-06-19-v0.2.0-pre-landing-review.md`，2 个边界问题已 auto-fixed 并复验 |
| 13 | Git closeout | complete | `main` pushed；最终 commit 以 `v0.2.0` tag、`origin/main` 和生产 `/version.commit` 一致读回为准 |
| 14 | Ship | complete | GitHub Release `v0.2.0` created and retagged after release asset sync fix |
| 15 | Land and deploy | partial | 生产 `/version=0.2.0`、IAM developer API apply、权限过滤完成；真实用户 OAuth 最终验收待人工登录 |

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
