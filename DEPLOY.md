# Base Portal 部署与升级规范

状态：DEPLOYMENT_BASELINE
适用版本：v0.1.2
生产域名：`https://base-portal.riversoft.com.cn`
生产服务器：`bpmt@120.24.236.92:/home/bpmt/base-portal`
服务器 nginx 目录：`bpmt@120.24.236.92:~/nginx`

本文件是 `base-portal` 的项目级部署和升级治理事实源。所有涉及生产镜像、Docker Compose、安装脚本、升级脚本、数据库迁移、运行参数、DNS、证书、反向代理、发布版本和部署目录的改动，必须先遵守本文件。

## 1. 核心原则

- 项目开发过程中和最终部署过程中，必须严格执行本文件。
- v0.1.2 的交付范围是在 v0.1.1 生产基线上完成 UX hardening：Tab 关闭按钮固定居右、Tab 桌面拖拽排序和菜单 fallback、菜单收缩态 Compact flyout sidebar、Radix 菜单状态一致性。
- 正式部署以版本为最小管理颗粒度。
- 生产发布物是版本化 Docker image，tag 必须与 release 版本一致，例如 `v0.1.2`。
- 生产运行形态是 Docker Compose。
- `install.sh` 只负责首次初始化安装。
- `upgrade.sh` 只负责已安装版本到目标版本的升级。
- 如果缺少 `install.sh` 或 `upgrade.sh`，必须先开发并验证缺失脚本，不能用手工步骤替代。
- 生产镜像必须使用不可变版本 tag，不得使用 `latest` 作为正式部署输入。
- 每次安装或升级必须解析明确目标版本，并在成功后写入安装版本标记。
- 每次版本升级和发布前，必须校验 `install.sh` 和 `upgrade.sh` 的逻辑。
- 数据库结构、初始化数据、运行参数、应用镜像、Compose 文件和反向代理配置属于同一个版本升级面，不允许只升级其中一部分后声称完成。
- 不得把 `client_secret`、`developer_api_token`、authorization code、access token、cookie、密码或真实 `.env` 内容写入仓库、日志、截图、聊天消息或测试快照。

## 2. 目标拓扑

```text
Internet
  |
  | https://base-portal.riversoft.com.cn
  v
Alibaba Cloud DNS A record
  |
  | 120.24.236.92
  v
~/nginx/system-nginx
  |
  | reverse proxy to host.docker.internal:<HOST_WEB_PORT>
  v
/home/bpmt/base-portal
  |-- deploy/docker-compose.yml
  |-- deploy/.env              # 服务器真实配置，不提交
  |-- .deploy/version
  |-- db container             # postgres
  `-- web container            # NestJS API + built portal web
```

## 3. 版本和镜像模型

需要区分以下概念：

- 当前安装版本：从 `.deploy/version` 读取。
- 目标版本：本次安装或升级要达到的 release 版本，例如 `v0.1.2`。
- 镜像版本：与 release 版本一致的 Docker image tag。
- Compose 版本：目标 release 携带的 `deploy/docker-compose.yml` 和 `deploy/.env.example`。
- DB 版本：Prisma migration 成功应用后的数据库版本。
- 配置版本：目标 release 需要的运行参数集合。

当前版本的镜像地址必须落为显式变量，例如：

```text
BASE_PORTAL_IMAGE=<registry>/base-portal:v0.1.2
BASE_PORTAL_VERSION=v0.1.2
```

生产 Compose 必须使用 `image: ${BASE_PORTAL_IMAGE:?BASE_PORTAL_IMAGE is required}` 或等价固定版本镜像，不得只依赖 `build:`。

## 4. 服务器目录

生产部署目录固定为：

```text
/home/bpmt/base-portal
```

目录职责：

```text
/home/bpmt/base-portal/
  deploy/
    docker-compose.yml
    .env.example
    .env              # 服务器真实配置，不提交、不回显
  .deploy/
    version
  data/
    postgres/
  releases/
    v0.1.2/
  backups/
```

`~/nginx` 只负责系统 nginx / 反向代理 / 证书配置，不承载应用源码或应用 `.env`。

## 5. `install.sh` 合同

`install.sh` 必须在正式部署前开发并验证。

`install.sh` 必须：

1. 默认目标版本为当前仓库版本 `v0.1.2`，也允许显式传入 `--version v0.1.2`。
2. 检查 `.deploy/version` 是否已经存在；默认拒绝重复初始化。
3. 检查 `docker`、`docker compose`、`ssh`、`tar` 或等价部署依赖。
4. 校验生产镜像 tag 是明确版本，不是 `latest`。
5. 创建远端 `/home/bpmt/base-portal` 所需目录。
6. 同步目标版本的 `deploy/docker-compose.yml`、`deploy/.env.example`、脚本和必要 release 资产。
7. 检查远端 `deploy/.env` 是否存在；缺失时只复制 `.env.example` 为模板并停止，提示人工补真实 secret。
8. 不得覆盖远端已有 `deploy/.env`。
9. 启动 Docker Compose。
10. 执行 Prisma migration 和 seed 的容器启动流程。
11. 检查 `http://127.0.0.1:<HOST_WEB_PORT>/health` 和 `/ready`。
12. 配置或验证 DNS、证书和 nginx 反向代理。
13. 仅在健康检查通过后写入 `.deploy/version`。

## 6. `upgrade.sh` 合同

`upgrade.sh` 必须在正式部署前开发并验证。

`upgrade.sh` 必须：

1. 在修改任何远端文件前读取当前安装版本和目标版本。
2. 默认拒绝同版本升级、降级和未声明的跨版本跳跃。
3. 备份远端 `deploy/.env` 和必要数据库数据。
4. 拉取或加载目标版本 image 和目标 Compose 资产。
5. 对比当前 `.env` 和目标 `.env.example`，报告新增必填变量，不静默覆盖 secret。
6. 按 Prisma migration 路径执行数据库升级。
7. 重启 Docker Compose 服务。
8. 执行 `/health`、`/ready` 和生产 URL smoke test。
9. 仅在全部成功后更新 `.deploy/version`。

`upgrade.sh` 不得简单执行“目录下所有 SQL 文件”。本项目当前使用 Prisma Migrate，升级路径必须通过 `pnpm --filter @base-portal/api prisma:migrate` 或容器内等价命令体现。

## 7. Docker Compose 规则

现有 Compose 文件路径：

```text
deploy/docker-compose.yml
```

当前实现必须满足：

- 保留本地 build 能力，便于开发验证。
- 为生产部署提供固定镜像 tag 的路径。
- `POSTGRES_DATA_DIR` 默认落在 `/home/bpmt/base-portal/data/postgres` 或部署目录内等价路径。
- `APP_VERSION` 和 `GIT_COMMIT` 必须能在 `/version` 或等价接口中读回。
- `PORTAL_ENABLE_MOCK_AUTH` 生产默认必须为 `false`。
- `COOKIE_SECURE` 生产默认必须为 `true`。
- 生产 `.env.example` 不得包含真实 secret。
- 服务器 Docker Hub 访问不稳定时，允许通过 `BASE_PORTAL_PULL_POLICY=never` 或 `--pull never` 使用远端已存在的固定版本镜像；脚本仍必须验证镜像 tag、env readiness、health 和 `.deploy/version`。

## 8. DNS 规则

部署到生产域名前，必须使用本机阿里云 CLI 检查并配置 DNS。

目标记录：

```text
base-portal.riversoft.com.cn A 120.24.236.92
```

执行策略：

1. 使用 `aliyun sts GetCallerIdentity` 验证 CLI 凭证可用。
2. 使用 `aliyun alidns DescribeSubDomainRecords --SubDomain base-portal.riversoft.com.cn` 检查是否已有记录。
3. 如果不存在，新增 A 记录。
4. 如果存在但值不是 `120.24.236.92`，更新现有记录。
5. 使用 `dig +short base-portal.riversoft.com.cn` 或等价命令验证解析结果。

不得在文档、日志或聊天中输出阿里云 access key、secret 或 session token。

## 9. 证书和 nginx 规则

生产 HTTPS 必须在 92 服务器完成。

目标：

- 证书覆盖 `base-portal.riversoft.com.cn`。
- nginx 配置位于 `~/nginx` 管理的配置体系内。
- 外部访问 `https://base-portal.riversoft.com.cn` 反向代理到 `base-portal` 应用容器暴露的本机端口。

实现阶段必须先探测服务器现状：

- `~/nginx` 的 Compose 文件、配置目录和证书目录。
- 当前是否已有 ACME / certbot / acme.sh 流程。
- 当前 nginx 是宿主机进程还是容器。
- 当前 80/443 端口占用。

当前 92 服务器 nginx 形态：

- `~/nginx/docker-compose.yml` 运行 `system-nginx` 容器，宿主机 80/443 映射到容器。
- `~/nginx/nginx.conf` 挂载到容器内 `/etc/nginx/conf.d/default.conf`。
- 证书目录来自 `/home/bpmt/bpmt-lite/nginx/certs`，挂载到容器内 `/etc/nginx/certs`。
- 当前证书是 `riversoft.com.cn` / `*.riversoft.com.cn` 通配符证书，覆盖 `base-portal.riversoft.com.cn`。
- 当前服务器无 `acme.sh` 或 `certbot`，v0.1.0 复用既有通配符证书；后续证书续期沿用服务器现有证书治理。

证书策略优先级：

1. 沿用服务器既有 `riversoft.com.cn` 通配符证书和续期流程。
2. 若通配符证书失效或不再覆盖目标域名，先恢复服务器证书治理，再部署应用。
3. 不把证书私钥写入仓库或聊天。

nginx 配置必须支持：

- HTTP 到 HTTPS 跳转。
- 反向代理到应用服务。
- `X-Forwarded-Proto`、`X-Forwarded-Host`、`X-Forwarded-For`。
- WebSocket 头兼容，虽然当前 v0.1.0 不依赖 WebSocket。

## 10. 发布与验证门禁

当前版本进入 ship / deploy 前至少需要：

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
```

部署后至少需要：

```bash
curl -fsS http://127.0.0.1:<HOST_WEB_PORT>/health
curl -fsS http://127.0.0.1:<HOST_WEB_PORT>/ready
curl -fsS https://base-portal.riversoft.com.cn/health
curl -fsS https://base-portal.riversoft.com.cn/ready
```

前端验收还必须保留 Playwright 或等价浏览器证据，覆盖桌面、平板、手机视口。

## 11. 完成声明要求

声称当前版本完成时必须同时说明：

- Git commit。
- release/tag。
- Docker image tag。
- 生产 Compose 文件路径。
- 92 服务器部署目录。
- `.deploy/version` 读回值。
- DNS 解析读回值。
- 证书颁发和有效期读回。
- nginx 反向代理配置读回。
- `/health`、`/ready`、首页和登录入口的生产 URL 验证结果。
- 前端 issues #1-#5 的验证证据。

缺少任一项，只能说“本地实现完成”或“部署部分完成”，不得说当前版本已完整交付。
