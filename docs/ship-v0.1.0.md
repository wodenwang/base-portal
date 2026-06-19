# Base Portal v0.1.0 Ship Preflight

日期：2026-06-19

## 当前状态

状态：READY_FOR_SECRET_COMPLETION_BEFORE_PRODUCTION_INSTALL

已完成：

- 本地前端、后端、部署脚本验证通过。
- GitHub issues #1-#5 行为已实现并验证。
- DNS 已注册并通过公共解析器读回。
- `system-nginx` 已配置 base-portal server block，TLS 证书有效。
- 远端 `/home/bpmt/base-portal` 已同步 release 资产。
- 远端镜像 `base-portal-release:v0.1.0` 已加载。
- 本地 Git commit 已创建：`git rev-parse HEAD`。

未完成：

- 远端 `deploy/.env` 仍需补真实生产值。
- Docker Compose 生产服务未启动。
- `.deploy/version` 尚不存在。
- 生产 `/health` 和 `/ready` 尚未通过。
- 未 push、未 tag、未创建 release。

## 必须补齐的远端配置项

`install.sh` 当前只输出问题 key，不输出值。已确认当前远端模板还需要处理：

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `FEISHU_IAM_CLIENT_SECRET`
- `FEISHU_IAM_DEVELOPER_API_TOKEN`

## 下一条生产命令

补齐远端 `deploy/.env` 后执行：

```bash
./install.sh --image base-portal-release:v0.1.0
```

预期：

- `docker compose up -d --no-build` 启动。
- 本机回环 `/health` 和 `/ready` 通过。
- `.deploy/version` 写入 `v0.1.0`。
- nginx/TLS smoke 通过。

## Secret 边界

不得在聊天、日志、截图、Git 或 release notes 中输出真实 `deploy/.env`、IAM secret、developer API token、数据库密码或证书私钥。
