# my-harness 当前状态

项目：`base-portal`

版本：`v0.1.2`

状态：`REVIEWED_READY_FOR_SHIP`

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
| 13 | Git closeout | pending | 待 commit、tag、push |
| 14 | Ship | pending | 待 GitHub release |
| 15 | Land and deploy | pending | 待 92 服务器升级和线上读回 |

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

## Secret 边界

- 不读取、不回显真实 `deploy/.env`。
- 不提交 `deploy/.env`。
- 远端 env gate 只允许输出 key 名称，不允许输出 secret 值。
