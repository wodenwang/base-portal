# my-harness 当前状态

项目：`base-portal`

版本：`v0.1.1`

状态：`STEP_13_GIT_CLOSEOUT_PENDING`

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
| 9 | Browser verification | in_progress | build 产物已验证 favicon；待生产 browser smoke |
| 10 | Visual QA | skipped | 无视觉布局变更 |
| 11 | Functional QA | pending | 待验证 production health/ready/version |
| 12 | Review | pending | 待做 diff review |
| 13 | Git closeout | pending | 待 staged diff 和 release notes |
| 14 | Ship | pending | 待 commit、tag、GitHub release |
| 15 | Land and deploy | pending | 待生产升级和线上健康验证 |

## Secret 边界

- 不读取、不回显真实 `deploy/.env`。
- 不提交 `deploy/.env`。
- 远端 env gate 只允许输出 key 名称，不允许输出 secret 值。
