# Base Portal v0.3.1 Release Notes

发布日期：2026-06-27

## 范围

v0.3.1 是部署治理和版本默认值补丁版，覆盖：

- 将仓库版本、安装脚本、升级脚本、部署示例和文档更新到 `0.3.1` / `v0.3.1`。
- 修正 `deploy/docker-compose.yml` 中 `BASE_PORTAL_VERSION` 和 `APP_VERSION` fallback 仍指向 `v0.2.0` 的漂移。
- 明确本版本不提供权限矩阵、权限同步状态页、审计入口或其他权限相关 UI。

## 保留能力

- SSO Demo 菜单入口继续通过标准 iframe 打开，并保留新窗口恢复路径。
- Tab 右键菜单和 Tab 三点菜单继续支持刷新当前 iframe。
- 接入包导入、IAM resource sync、权限过滤和审计能力保持 v0.3.0 行为。
- 历史 `openMode=immersive_iframe` 继续兼容降级为标准 `iframe`。

## 不做事项

- 不新增权限矩阵。
- 不新增权限同步状态页。
- 不新增审计入口。
- 不新增管理后台 CRUD 或配置 UI。
- 不修改数据库 schema、OAuth 协议、secret 处理边界或部署拓扑。

## 本地验证

```bash
PATH=/Users/wenzhewang/.nvm/versions/node/v24.16.0/bin:$PATH CI=true pnpm --filter @base-portal/api prisma:generate
PATH=/Users/wenzhewang/.nvm/versions/node/v24.16.0/bin:$PATH CI=true pnpm check
PATH=/Users/wenzhewang/.nvm/versions/node/v24.16.0/bin:$PATH CI=true pnpm build
BASE_PORTAL_IMAGE=base-portal-release:v0.3.1 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
bash -n install.sh
bash -n upgrade.sh
git diff --check
```

结果：通过。详见 `docs/verification/2026-06-27-v0.3.1-local-verification.md`。

## 生产读回要求

- GitHub tag/release：`v0.3.1`。
- Docker image：`base-portal-release:v0.3.1`。
- 服务器 `.deploy/version`：`v0.3.1`。
- 生产 `/health`、`/ready`、`/version` 通过。
- `/version.version` 读回 `0.3.1`。
- `/version.commit` 与 release commit 对齐。
- README、DEPLOY、`.my-harness/` 和本文件均确认本版本不做权限相关 UI。

生产部署记录见 `docs/verification/2026-06-27-v0.3.1-production-deploy.md`。
