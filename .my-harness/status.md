# my-harness 当前状态

项目：`base-portal`

版本：`v0.1.0`

状态：`STEP_13_SHIP_PREFLIGHT_READY`

已完成：

- Step 1-4：需求、设计方向、原型与设计收口已完成，当前基线为方案 2。
- Step 5-6：工程评审、`DEPLOY.md`、`IMPLEMENTATION_PLAN.md` 已完成。
- Step 7-10：前端重构、GitHub issues #1-#5、design QA 已完成并修复。
- Step 11：系统化功能 QA 已完成并修复。
- Step 12：落地前 review 与人工反馈后的 refresh 已完成并修复。

下一步：

- Step 13：ship preflight 收口和提交边界确认。
- Step 14：commit、push、tag、GitHub release。
- Step 15：部署到 92 服务器 `/home/bpmt/base-portal`，验证 `https://base-portal.riversoft.com.cn/health` 和 `/ready`。

Secret 边界：

- 不读取、不回显真实 `deploy/.env`。
- 不提交 `deploy/.env`。
- 远端 env gate 只允许输出 key 名称，不允许输出 secret 值。
