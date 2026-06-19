# Base Portal

Base Portal 是独立第三方企业门户应用，通过 Feishu IAM 完成登录、用户信息读取和权限点读取。

当前仓库已包含首个可运行 vertical slice：

- [AGENTS.md](AGENTS.md)：Feishu IAM 接入约定、安全边界和验收 checklist。
- [Base Portal 设计规格](docs/superpowers/specs/2026-06-19-base-portal-design.md)：首版产品边界、架构、数据模型、前端交互、后端 API、运维和验收要求。
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)：首版实现计划和验证标准。
- `apps/api`：NestJS + Prisma 后端，提供 IAM OAuth 接入、session、导航、审计和运维同步接口。
- `apps/portal-web`：React + Vite 前端，提供功能域、树形菜单、Tab 工作区、iframe/immersive iframe/new tab 和应用内最大化。
- `deploy/docker-compose.yml`：Docker Compose 运行环境，包含 PostgreSQL 和 Web/API 服务。
- `DEPLOY.md`：v0.1.1 部署和升级治理，覆盖 Docker Compose、安装、升级、DNS、证书和 nginx 反向代理。

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

## 部署

生产部署必须先读取并遵守 [DEPLOY.md](DEPLOY.md)。v0.1.1 生产目标为：

- 域名：`https://base-portal.riversoft.com.cn`
- 服务器：`bpmt@120.24.236.92:/home/bpmt/base-portal`
- 运行方式：固定版本 Docker image + Docker Compose
- 反向代理：92 服务器 `~/nginx`

首次安装使用 `install.sh`，版本升级使用 `upgrade.sh`。真实 `deploy/.env`、IAM secret、阿里云凭证和证书私钥不得提交或回显。

## 安全边界

不要把 `client_secret`、`developer_api_token`、authorization code、access token、cookie 或密码写入仓库、日志、截图、测试快照或会话归档。

真实环境配置必须放在本地或部署环境变量中；仓库只保留无敏感值示例。
