# 2026-06-19 落地前代码审查

## 结论

未发现阻塞当前本地交付的代码问题。首版 vertical slice 已覆盖登录闭环、权限过滤导航、Tab 工作区、三种打开方式、最大化、SPA fallback、Docker Compose 运行和基础测试。

## 重点检查

- Secret 边界：仓库只保留 `.env.example`，真实 `.env` 被 `.gitignore` 忽略。未把用户提供过的 `client_secret` 写入仓库。
- 鉴权边界：前端只消费 session 和导航 API，不持有 `client_secret` 或 developer token。
- SSO 边界：Portal 只负责登录和获取权限；嵌入页面自身鉴权仍由第三方应用和 IAM 处理。
- Tab 行为：固定首页 tab 不计入 20 个业务 tab；切换功能域前确认并清空业务 tab。
- iframe 行为：支持标准 iframe、沉浸 iframe、new tab 和应用内最大化。
- 错误态：后端健康检查、前端初始化失败、iframe 超时 fallback 均有兜底。
- 部署：Docker Compose 启动时执行迁移和 seed，PostgreSQL 有 healthcheck。

## 残余风险

- 内存 session 适合首版验证，不适合多副本生产。生产化时需要 Redis 或数据库 session。
- 首版后台 UI 被刻意弱化，菜单和权限资源通过 seed/API 初始化；后续运维效率需要管理界面或正式 CLI。
- 真实 IAM OAuth 需要使用 HTTPS 域名和环境变量验证，本地 mock 不能替代最终线上联调。
