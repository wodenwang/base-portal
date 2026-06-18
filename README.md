# Base Portal

Base Portal 是独立第三方企业门户应用，通过 Feishu IAM 完成登录、用户信息读取和权限点读取。

当前仓库处于设计和治理初始化阶段，已包含：

- [AGENTS.md](AGENTS.md)：Feishu IAM 接入约定、安全边界和验收 checklist。
- [Base Portal 设计规格](docs/superpowers/specs/2026-06-19-base-portal-design.md)：首版产品边界、架构、数据模型、前端交互、后端 API、运维和验收要求。

## 安全边界

不要把 `client_secret`、`developer_api_token`、authorization code、access token、cookie 或密码写入仓库、日志、截图、测试快照或会话归档。

真实环境配置必须放在本地或部署环境变量中；仓库只保留无敏感值示例。
