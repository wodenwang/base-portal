# Base Portal bpmt 生产部署记录

时间：2026-06-19 18:52:44 CST

## 目标

- 仓库：`wodenwang/base-portal`
- Git commit：`1376d393849279478b7c94877fbb8ca0f280993c`
- 服务器：`bpmt@120.24.236.92:/home/bpmt/base-portal`
- 域名：`https://base-portal.riversoft.com.cn`
- 版本：`v0.1.0`

## 本地门禁

- `git fetch origin main --tags --prune` 后，本地 `HEAD` 与 `origin/main` 一致。
- `pnpm check` 通过：API / portal-web typecheck、lint、单测均通过。
- `pnpm build` 通过：API Nest build 和 portal-web Vite build 均通过。
- `docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config` 通过。

## 远端准备

- SSH、Docker、Docker Compose 可用。
- 远端目录 `/home/bpmt/base-portal` 已存在。
- `deploy/.env` 初始存在 placeholder/empty 值，已在服务器本机修正并备份为 `.env.backup-20260619184330`。
- Feishu IAM 中 `base-portal` 应用已存在，`bic_0b6cfcd9f4fa4cef8f6cfb96b8d86874` 为 active primary client。
- 已启用 `https://base-portal.riversoft.com.cn` redirect URI。
- 已创建新的 Feishu IAM developer credential，并写入远端 `deploy/.env`。
- 远端 env readiness issues 读回为 `0`。

## 镜像与 Compose

- 发现既有 `base-portal-release:v0.1.0` 为 `arm64`，服务器为 `x86_64`，不能直接运行。
- 已同步完整构建上下文到 `/home/bpmt/base-portal/build-context-v0.1.0`。
- 已将服务器本机已有镜像源 tag 成：
  - `node:22-alpine`
  - `postgres:16-alpine`
- 已在服务器本机构建 amd64 镜像：
  - `base-portal-release:v0.1.0`
  - image id：`sha256:639835ea1150e64c92c998ce65eaa5a0c35eccab09ef1e8abed97cb09d242f3f`
- 因 `install.sh` 强制 `docker compose pull db` 且 Docker Hub 超时，本次使用等价手工命令上线：
  - `docker compose --env-file deploy/.env -f deploy/docker-compose.yml config`
  - `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --no-build --pull never`

## 远端运行态

`docker compose ps` 读回：

```text
deploy-db-1    postgres:16-alpine           Up (healthy)   5432/tcp
deploy-web-1   base-portal-release:v0.1.0   Up             0.0.0.0:3000->3000/tcp
```

`.deploy/version` 读回：

```text
v0.1.0
```

## 生产验证

- `https://base-portal.riversoft.com.cn/health`：`200 {"status":"ok"}`
- `https://base-portal.riversoft.com.cn/ready`：`200 {"status":"ready","checks":{"database":"ok"}}`
- `https://base-portal.riversoft.com.cn/`：`200`，页面标题 `Base Portal`
- `https://base-portal.riversoft.com.cn/api/session`：`200 {"authenticated":false}`
- `https://base-portal.riversoft.com.cn/api/navigation`：未登录返回 `401 SESSION_REQUIRED`
- `https://base-portal.riversoft.com.cn/api/auth/login`：`302` 跳转到 Feishu IAM OAuth authorize，`client_id` 和 `redirect_uri` 符合预期。
- `https://base-portal.riversoft.com.cn/version`：

```json
{"name":"base-portal-api","version":"0.1.0","commit":"1376d393849279478b7c94877fbb8ca0f280993c","node_env":"production"}
```

## Feishu IAM 同步

- Base Portal seed 中 active leaf menu 数量：`14`
- 已通过 Feishu IAM developer API 同步 permission points：`14`
- Feishu IAM 数据库读回 `base-portal` permission points 数量：`14`

## Playwright 证据

- Snapshot 页面标题：`Base Portal`
- 关键元素：`Base Portal` 标题、说明文案、`使用 Feishu IAM 登录`、`本地 mock 登录`
- 截图：`output/playwright/base-portal-production-2026-06-19.png`
- Console error：`/favicon.ico` 返回 404。该问题不影响健康检查、首页渲染或 OAuth 登录跳转，建议后续补 favicon 静态资源。

## 后续建议

- 修复 `install.sh` / `upgrade.sh`：支持 `--pull never` 或 `BASE_PORTAL_PULL_POLICY=never`，避免内网服务器在 Docker Hub 超时时无法使用本地已存在镜像部署。
- 修复 `deploy/web.Dockerfile`：可配置基础镜像，例如 `ARG NODE_IMAGE=node:22-alpine`，以便在服务器上使用镜像源。
- 补 `favicon.ico`，消除生产页面唯一 console error。
