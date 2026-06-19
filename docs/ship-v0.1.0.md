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

---

## 2026-06-19 18:16 CST Step 15 重试记录

执行命令：

```bash
./install.sh --image base-portal-release:v0.1.0
```

结果：未启动生产 Compose，脚本按设计停在 env gate，退出码为 `2`。

脚本输出只包含问题 key，不包含 secret 值：

- `empty:FEISHU_IAM_CLIENT_SECRET`
- `empty:FEISHU_IAM_DEVELOPER_API_TOKEN`
- `placeholder:POSTGRES_PASSWORD`
- `placeholder:DATABASE_URL`

重试后的远端读回：

- `base-portal.riversoft.com.cn A 120.24.236.92`：公共 DNS 正确。
- 远端镜像 `base-portal-release:v0.1.0`：已存在。
- `.deploy/version`：`missing`。
- Docker Compose 服务：未创建。
- `https://base-portal.riversoft.com.cn/health`：`502`。
- `https://base-portal.riversoft.com.cn/ready`：`502`。

结论：用户声明已补齐生产值，但服务器 `/home/bpmt/base-portal/deploy/.env` 当前读回仍显示关键项为空或占位。需要在该文件中重新保存真实生产值后，再重跑同一条安装命令。

---

## 2026-06-19 18:28 CST Step 15 再次重试记录

执行命令：

```bash
./install.sh --image base-portal-release:v0.1.0
```

结果：未启动生产 Compose，脚本继续停在 env gate，退出码为 `2`。

脚本输出只包含问题 key，不包含 secret 值：

- `empty:FEISHU_IAM_CLIENT_SECRET`
- `empty:FEISHU_IAM_DEVELOPER_API_TOKEN`
- `placeholder:POSTGRES_PASSWORD`
- `placeholder:DATABASE_URL`

重试后的远端读回：

- env 文件路径：`/home/bpmt/base-portal/deploy/.env`
- env 文件元数据：regular file，权限 `600`，属主 `bpmt:bpmt`，大小 `695 bytes`，mtime `2026-06-19 12:54:38 +0800`
- `.deploy/version`：`missing`
- Docker Compose 服务：未创建。
- `https://base-portal.riversoft.com.cn/health`：`502`
- `https://base-portal.riversoft.com.cn/ready`：`502`

结论：服务器目标文件当前仍未保存真实生产值；mtime 也未显示本轮重试前有新的保存动作。需要重新编辑并保存同一路径的 env 文件，再重跑同一条安装命令。
