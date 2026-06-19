# Feishu IAM SSO Demo 嵌入式无感访问需求

来源项目：`base-portal`

目标项目：`feishu-iam-sso-demo`

建议版本：`v1.1.0` 或对应下一补丁版本

日期：2026-06-20

## 背景

Base Portal v0.3.0 会把 SSO Demo 作为第三方系统入口放入 Portal 工作区。Base Portal 只负责入口编排、Portal 登录态、权限过滤、iframe/new-window/fallback 和可恢复体验；SSO Demo 必须自己完成 Feishu IAM OAuth、session、用户信息读取和权限读取。

Base Portal 不会向 SSO Demo 注入 OAuth code、access token、cookie、client secret 或 developer API token。

## 目标

用户已登录 Base Portal 后，点击 SSO Demo 菜单时：

- 如果 SSO Demo 已有可用 session，iframe 内应直接显示可用页面。
- 如果 SSO Demo 没有 session 或 iframe 内无法完成 OAuth，页面应提供清晰、可恢复的登录路径。
- 新窗口打开 SSO Demo 时，应能通过 Feishu IAM 已有登录态尽量减少重复登录交互。

## 需求

### 1. 嵌入可用性

- 明确允许 `https://base-portal.riversoft.com.cn` 嵌入 SSO Demo 页面，避免 `X-Frame-Options` 或 CSP `frame-ancestors` 阻断。
- 如需限制来源，使用 allowlist，不允许开放到任意来源。
- 不在页面、日志、截图或响应中输出 token、cookie、authorization code 或 secret。

### 2. 嵌入态登录体验

- SSO Demo 首页在未登录时应检测嵌入场景或提供同样适用于嵌入场景的恢复路径。
- 如果 iframe 中不能安全完成 OAuth 跳转，应显示“在新窗口继续登录/打开”的明确动作，而不是让 iframe 卡死。
- 如果浏览器和 IAM 策略允许 iframe 内完成 OAuth，应保持 state 校验和后端 code exchange，不降低安全校验。

### 3. Session / Cookie

- 评估当前 session cookie 策略在 `base-portal.riversoft.com.cn` iframe 嵌入 `feishu-iam-sso-demo.riversoft.com.cn` 时是否可用。
- 如果需要调整 cookie `SameSite` / `Secure` / `Domain`，必须只通过后端受控配置完成，并增加测试。
- 不允许前端读写 session cookie 或保存 access token。

### 4. 可观测验证

- 增加一个脱敏健康或 session 检查路径，便于 Base Portal 生产验收确认 SSO Demo 是否已认证或需要登录。
- 验收输出只允许记录 HTTP status、authenticated 布尔值、错误码或脱敏阶段名。

## 建议测试

- iframe 来源为 `https://base-portal.riversoft.com.cn` 时，SSO Demo 页面不被 frame policy 阻断。
- 已有 SSO Demo session 时，iframe 内直接显示已登录页面。
- 无 SSO Demo session 时，iframe 内显示可恢复登录动作或能安全进入 OAuth。
- 新窗口打开时，可完成 Feishu IAM 登录并回到 SSO Demo。
- `/api/session` 或等价接口不返回 token、cookie、authorization code 或 secret。
- 生产 nginx / container 设置下 cookie secure、trust proxy 和回调地址仍正确。

## 非目标

- 不要求 Base Portal 代理 SSO Demo 的 OAuth。
- 不要求共享 Base Portal session 给 SSO Demo。
- 不要求在前端保存 access token。
- 不要求放宽 Feishu IAM 应用 secret 边界。
