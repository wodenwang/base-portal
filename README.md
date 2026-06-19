# Base Portal

Base Portal 是独立第三方企业门户应用，通过 Feishu IAM 完成登录、用户信息读取和权限点读取。

当前仓库已包含首个可运行 vertical slice：

- [AGENTS.md](AGENTS.md)：Feishu IAM 接入约定、安全边界和验收 checklist。
- [Base Portal 设计规格](docs/superpowers/specs/2026-06-19-base-portal-design.md)：首版产品边界、架构、数据模型、前端交互、后端 API、运维和验收要求。
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)：首版实现计划和验证标准。
- `apps/api`：NestJS + Prisma 后端，提供 IAM OAuth 接入、session、导航、审计、接入包导入和运维同步接口。
- `apps/portal-web`：React + Vite 前端，提供功能域、树形菜单、Tab 工作区、iframe、新窗口恢复、当前 iframe 刷新和应用内最大化。
- `config/portal-apps/base-portal-demo.json`：v0.3.0 第三方应用接入包示例，不包含任何 secret。
- `deploy/docker-compose.yml`：Docker Compose 运行环境，包含 PostgreSQL 和 Web/API 服务。
- `DEPLOY.md`：v0.3.0 部署和升级治理，覆盖 Docker Compose、安装、升级、DNS、证书和 nginx 反向代理。

## 本地运行

复制本地环境示例后启动：

```bash
cp deploy/.env.example deploy/.env
perl -0pi -e 's/PORTAL_WEB_ORIGIN=.*/PORTAL_WEB_ORIGIN=http:\/\/localhost:5173/; s/PORTAL_ENABLE_MOCK_AUTH=.*/PORTAL_ENABLE_MOCK_AUTH=true/; s/COOKIE_SECURE=.*/COOKIE_SECURE=false/; s/PORTAL_MOCK_USER_ID=.*/PORTAL_MOCK_USER_ID=mock-user-001/; s/PORTAL_MOCK_USER_NAME=.*/PORTAL_MOCK_USER_NAME=本地测试用户/; s/PORTAL_ADMIN_USER_IDS=.*/PORTAL_ADMIN_USER_IDS=mock-user-001/' deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

访问 [http://localhost:3000](http://localhost:3000)。

本地默认启用 mock 登录，可点击登录页的“本地 mock 登录”，也可以直接访问：

```bash
open http://localhost:3000/api/auth/mock-login
```

常用验证命令：

```bash
pnpm check
pnpm build
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3000/ready
```

## v0.3.0 运维接入包

v0.3.0 不新增配置 UI。第三方应用接入先使用文件导入 + ops API：

```bash
curl -fsS -X POST http://localhost:3000/api/ops/import-app-package \
  -H 'content-type: application/json' \
  --cookie 'bp_session=<mock-or-admin-session>' \
  --data-binary @<(jq -n --slurpfile package config/portal-apps/base-portal-demo.json '{dryRun: true, package: $package[0]}')
```

apply 前必须先 dry-run。真实 IAM 同步使用：

```bash
curl -fsS -X POST http://localhost:3000/api/ops/sync-iam-resources \
  -H 'content-type: application/json' \
  --cookie 'bp_session=<admin-session>' \
  --data-binary @<(jq -n --slurpfile package config/portal-apps/base-portal-demo.json '{dryRun: true, package: $package[0]}')
```

`dryRun: false` 只允许在后端或受控运维环境执行，且 `FEISHU_IAM_DEVELOPER_API_TOKEN` 必须来自环境变量。命令输出、审计、截图和验收记录只能保存脱敏摘要，不得包含 token、OAuth code、cookie、client secret 或 IAM 原始错误体。

## 部署

生产部署必须先读取并遵守 [DEPLOY.md](DEPLOY.md)。v0.3.0 生产目标为：

- 域名：`https://base-portal.riversoft.com.cn`
- 服务器：`bpmt@120.24.236.92:/home/bpmt/base-portal`
- 运行方式：固定版本 Docker image + Docker Compose
- 反向代理：92 服务器 `~/nginx`

首次安装使用 `install.sh`，版本升级使用 `upgrade.sh`。真实 `deploy/.env`、IAM secret、阿里云凭证和证书私钥不得提交或回显。v0.3.0 发布后还必须读回 `/version` 为 `0.3.0`，并保存真实 IAM 登录、权限读取、SSO Demo 菜单、iframe 刷新、导入 dry-run/apply、IAM sync dry-run/apply 的脱敏证据。

## 安全边界

不要把 `client_secret`、`developer_api_token`、authorization code、access token、cookie 或密码写入仓库、日志、截图、测试快照或会话归档。

真实环境配置必须放在本地或部署环境变量中；仓库只保留无敏感值示例。
