# Base Portal v0.1.0 发布记录

状态：RELEASE_READY_AWAITING_PRODUCTION_ENV
日期：2026-06-19

## 范围

v0.1.0 包含：

- 按 `DESIGN.md` 和 Product Design 方案 2 重构 Portal 前端壳。
- 修复 GitHub issues #1-#5 登记的问题。
- 增加生产 Docker Compose 镜像版本化参数。
- 增加 `install.sh` 和 `upgrade.sh`。
- 增加 `DEPLOY.md` 并从治理文档链接部署规范。

## 本地验证

实现提交：

- `5d5d91e82344291741b249bf9cf784029af78f58`

已通过：

```bash
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web build
pnpm --filter @base-portal/api test
pnpm --filter @base-portal/api typecheck
pnpm --filter @base-portal/api lint
pnpm --filter @base-portal/api build
bash -n install.sh
bash -n upgrade.sh
docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
git diff --check
```

远端预检和 bootstrap：

- DNS 已注册：`base-portal.riversoft.com.cn A 120.24.236.92`。
- 公共 DNS 解析器 `223.5.5.5` 和 `8.8.8.8` 均读回 `120.24.236.92`。
- 92 服务器 `/home/bpmt/base-portal` 已创建。
- `releases/v0.1.0`、`deploy/docker-compose.yml`、`deploy/.env.example` 已同步到远端。
- 远端 `deploy/.env` 模板已创建，内容未读取、未回显。
- `install.sh` 已验证会在启动前拦截当前模板配置，仅输出问题 key，不输出值。
- 生产镜像 `base-portal-release:v0.1.0` 已重新构建并加载到 92 服务器，远端 image id 为 `sha256:048214ab69a7f65198e2124a667c43057cb78c69884cc98330795c54f644089d`。
- 远端尚无 `.deploy/version`，服务未启动。
- 92 服务器 `~/nginx/nginx.conf` 已写入 base-portal managed block，并通过 `docker exec system-nginx nginx -t`。
- 92 服务器 `system-nginx` 已重建并运行。
- 现有 `riversoft.com.cn` / `*.riversoft.com.cn` 通配符证书覆盖 `base-portal.riversoft.com.cn`，有效期至 2026-08-27。
- `https://base-portal.riversoft.com.cn/health` 当前 TLS 校验通过，但返回 `502`，因为应用容器尚未启动。
- 公共 DNS 解析器 `223.5.5.5` 和 `8.8.8.8` 当前均读回 `120.24.236.92`。

浏览器截图和 QA 证据见：

- `docs/qa/v0.1.0.md`
- `design/design-qa-v0.1.0.md`
- `output/playwright/`

## 生产发布输入

生产部署必须显式提供不可变镜像：

```bash
./install.sh --image base-portal-release:v0.1.0
./upgrade.sh --from <current-version> --to v0.1.0 --image base-portal-release:v0.1.0
```

脚本会拒绝：

- 未提供生产镜像。
- 使用 `base-portal:v0.1.0` 本地占位镜像作为生产输入。
- 使用 `latest`。

## 生产部署待办

尚未执行：

- 在远端 `deploy/.env` 写入真实生产 secret。
- 在 92 服务器 `/home/bpmt/base-portal` 启动 Docker Compose 服务并写入 `.deploy/version`。
- 读回 `.deploy/version`。
- 验证 `https://base-portal.riversoft.com.cn/health` 和 `/ready`。

当前远端 env gate 只输出 key 状态，不输出值：

- `POSTGRES_PASSWORD=placeholder`
- `DATABASE_URL=placeholder`
- `FEISHU_IAM_CLIENT_SECRET=empty`
- `FEISHU_IAM_DEVELOPER_API_TOKEN=empty`

2026-06-19 18:16 CST 已重跑：

```bash
./install.sh --image base-portal-release:v0.1.0
```

结果仍停在 env gate，生产 Compose 未启动，`.deploy/version` 仍为 `missing`，线上 `/health` 和 `/ready` 仍返回 `502`。

## Secret 边界

未读取、未回显、未提交真实 `deploy/.env`、IAM secret、developer API token、阿里云凭证或证书私钥。
