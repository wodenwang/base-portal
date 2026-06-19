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
- 实现提交已创建并推送到分支：`5d5d91e82344291741b249bf9cf784029af78f58`。
- 最新镜像 `base-portal-release:v0.1.0` 已加载到远端，远端 image id 为 `sha256:048214ab69a7f65198e2124a667c43057cb78c69884cc98330795c54f644089d`。
- 公共 DNS 解析器 `223.5.5.5` 和 `8.8.8.8` 当前均读回 `120.24.236.92`。

未完成：

- 远端 `deploy/.env` 仍需补真实生产值。
- Docker Compose 生产服务未启动。
- `.deploy/version` 尚不存在。
- 生产 `/health` 和 `/ready` 尚未通过。
- 尚未创建最终 tag/release。

## 必须补齐的远端配置项

`install.sh` 当前只输出问题 key，不输出值。已确认当前远端模板还需要处理：

- `POSTGRES_PASSWORD=placeholder`
- `DATABASE_URL=placeholder`
- `FEISHU_IAM_CLIENT_SECRET=empty`
- `FEISHU_IAM_DEVELOPER_API_TOKEN=empty`

当前线上状态：

- `https://base-portal.riversoft.com.cn/health`：`502`
- `https://base-portal.riversoft.com.cn/ready`：`502`
- 原因：应用 Compose 服务尚未启动，远端 `.deploy/version` 仍为 missing。

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
