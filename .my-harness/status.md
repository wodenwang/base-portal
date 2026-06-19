# my-harness 当前状态

项目：`base-portal`

版本：`v0.1.0`

状态：`STEP_15_DEPLOYMENT_ENV_GATE`

已完成：

- Step 1-4：需求、设计方向、原型与设计收口已完成，当前基线为方案 2。
- Step 5-6：工程评审、`DEPLOY.md`、`IMPLEMENTATION_PLAN.md` 已完成。
- Step 7-10：前端重构、GitHub issues #1-#5、design QA 已完成并修复。
- Step 11：系统化功能 QA 已完成并修复。
- Step 12：落地前 review 与人工反馈后的 refresh 已完成并修复。
- Step 13：ship preflight 已完成。
- Step 14：本地提交已创建并推送分支。

下一步：

- Step 14：最终 main 快进、tag、GitHub release。
- Step 15：补齐远端生产 env 后，重跑 `./install.sh --image base-portal-release:v0.1.0` 并验证 `https://base-portal.riversoft.com.cn/health` 和 `/ready`。

当前部署节点读回：

- DNS：`base-portal.riversoft.com.cn A 120.24.236.92`。
- 远端镜像：`base-portal-release:v0.1.0` 已加载。
- 远端 `.deploy/version`：missing。
- 线上 `/health`、`/ready`：502。
- env gate：`POSTGRES_PASSWORD`、`DATABASE_URL` 仍是占位；`FEISHU_IAM_CLIENT_SECRET`、`FEISHU_IAM_DEVELOPER_API_TOKEN` 为空。

2026-06-19 18:16 CST Step 15 重试：

- `./install.sh --image base-portal-release:v0.1.0` 已执行。
- 脚本退出码：`2`。
- 结论：仍停在 env gate，未启动 Docker Compose，未写入 `.deploy/version`。

Secret 边界：

- 不读取、不回显真实 `deploy/.env`。
- 不提交 `deploy/.env`。
- 远端 env gate 只允许输出 key 名称，不允许输出 secret 值。
