# Base Portal v0.1.1 发布记录

状态：LOCAL_VERIFIED_AWAITING_SHIP_AND_DEPLOY
日期：2026-06-19

## 范围

v0.1.1 是生产硬化 patch release，包含：

- `install.sh` / `upgrade.sh` 支持 `--pull missing|always|never` 和 `BASE_PORTAL_PULL_POLICY`。
- 远端已有固定版本镜像时可使用 `--pull never` 升级，避免 Docker Hub 超时阻塞。
- `deploy/web.Dockerfile` 支持 `ARG NODE_IMAGE=node:22-alpine`。
- 前端增加 `/favicon.svg` 并在 `index.html` 引用，修复 v0.1.0 生产 smoke 中发现的 favicon 404。
- 同步 v0.1.0 生产上线证据和 v0.1.1 发布证据。

## 非范围

- 不新增门户菜单、应用配置 UI、权限模型或工作台功能。
- 不修改 Feishu IAM OAuth 协议、回调地址、client secret 或 developer token。
- 不读取、回显或提交真实 `deploy/.env`。

## 验证

```bash
bash -n install.sh
bash -n upgrade.sh
./install.sh --help >/tmp/base-portal-install-help.txt
./upgrade.sh --help >/tmp/base-portal-upgrade-help.txt
BASE_PORTAL_IMAGE=base-portal-release:v0.1.1 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
pnpm check
pnpm build
git diff --check
```

结果：通过。

补充负向检查：

- `BASE_PORTAL_IMAGE=base-portal-release:v0.1.1 ./upgrade.sh --pull invalid`：退出码 `2`，拒绝无效 pull policy。
- `./install.sh --image base-portal:v0.1.1 --skip-dns --skip-nginx`：退出码 `1`，拒绝本地占位镜像作为生产输入。

构建产物：

- `apps/portal-web/dist/favicon.svg` 存在。
- `apps/portal-web/dist/index.html` 引用 `/favicon.svg`。

## 发布和部署

待补：

- release commit
- tag `v0.1.1`
- GitHub Release URL
- 远端 image id
- `.deploy/version`
- `/health`
- `/ready`
- `/version`
