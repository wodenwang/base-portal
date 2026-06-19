# my-harness 当前状态

项目：`base-portal`

版本：`v0.1.1`

状态：`COMPLETE_V0.1.1_RELEASED_AND_DEPLOYED`

## v0.1.1 范围

- 固化部署脚本 pull 策略：`missing`、`always`、`never`。
- 允许远端使用已存在镜像完成升级，避免 Docker Hub 超时阻塞。
- 支持 Dockerfile 基础镜像参数 `NODE_IMAGE`。
- 补前端 favicon，消除 v0.1.0 生产页面唯一 console error。
- 同步 v0.1.0 已上线证据和 v0.1.1 发布证据。

## 15-Step Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | 用户确认默认项：选择 `v0.1.1` 生产硬化范围并推进到版本完结 |
| 2 | Product/design planning review | skipped | 不改变 UI 流程，favicon only |
| 3 | Design artifact / visual target | skipped | 继续使用 `DESIGN.md` 和既有 v0.1.0 视觉基线 |
| 4 | Design review | skipped | 无布局或交互视觉变更 |
| 5 | Eng review | complete | `IMPLEMENTATION_PLAN.md` 的 Scope Decisions |
| 6 | Writing plan | complete | `IMPLEMENTATION_PLAN.md` |
| 7 | Executing plan | complete | 部署脚本、Dockerfile、版本和 favicon 改动 |
| 8 | Verification before completion | complete | `pnpm check`、`pnpm build`、`bash -n`、Compose config、`git diff --check` 均通过 |
| 9 | Browser verification | complete | Playwright 生产 smoke：登录页渲染、console error 0、`/favicon.svg` 200 |
| 10 | Visual QA | skipped | 无视觉布局变更 |
| 11 | Functional QA | complete | 生产 `/health`、`/ready`、`/version` 验证通过 |
| 12 | Review | complete | staged diff、secret boundary、`git diff --check` 已检查 |
| 13 | Git closeout | complete | v0.1.1 变更提交并推送 `main` |
| 14 | Ship | complete | `v0.1.1` tag 和 GitHub release 完成 |
| 15 | Land and deploy | complete | 92 服务器运行 `base-portal-release:v0.1.1`，`.deploy/version` 为 `v0.1.1` |

## v0.1.1 生产读回

- 远端 `.deploy/version`：`v0.1.1`。
- 远端容器：`deploy-web-1` 使用 `base-portal-release:v0.1.1`。
- 远端 image id：`sha256:2a34dff5b0ddbd987d4e41cb5922252fae74d89c3d54055dcb1bf90aacb98fd8`。
- 生产 `/health`：`{"status":"ok"}`。
- 生产 `/ready`：`{"status":"ready","checks":{"database":"ok"}}`。
- 生产 `/version`：`version=0.1.1`，commit 由最终 release tag 和线上读回校验。
- 生产 favicon：`https://base-portal.riversoft.com.cn/favicon.svg` 返回 200。
- Playwright 截图：`output/playwright/base-portal-v0.1.1-production-login.png`。

## Secret 边界

- 不读取、不回显真实 `deploy/.env`。
- 不提交 `deploy/.env`。
- 远端 env gate 只允许输出 key 名称，不允许输出 secret 值。
