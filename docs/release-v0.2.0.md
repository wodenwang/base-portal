# Base Portal v0.2.0 Release Notes

发布日期：2026-06-19

## 范围

- 真实 Feishu IAM 登录、用户信息和权限读取验收。
- `config/portal-apps/base-portal-demo.json` 第三方应用接入包。
- `POST /api/ops/import-app-package`，支持 dry-run/apply、幂等 domain/menu upsert 和脱敏审计。
- `POST /api/ops/sync-iam-resources`，支持 permission point、permission group、group binding dry-run/apply。
- 导航权限过滤覆盖无权限、部分权限和完整权限。
- 生产部署后 `/version` 必须读回 `0.2.0`。

## 非范围

- 不新增配置 UI 或完整管理后台。
- 不新增 session 持久化；容器重启后用户需要重新登录。
- 不扩大 developer API 权限边界；只维护本应用权限点、权限组和绑定。
- 不把 GitHub #6-#9 作为 v0.2.0 新功能范围。

## Secret 边界

- `FEISHU_IAM_CLIENT_SECRET`、`FEISHU_IAM_DEVELOPER_API_TOKEN`、OAuth code、access token、cookie、数据库密码和证书私钥只允许放在本地或部署环境变量。
- 命令输出、审计事件、截图和验证记录只保存 key、状态、计数、HTTP status 或错误码，不保存 token、secret 或 IAM 原始响应体。
- `config/portal-apps/base-portal-demo.json` 不包含 secret。

## 本地验证命令

```bash
pnpm check
pnpm build
BASE_PORTAL_IMAGE=base-portal-release:v0.2.0 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
bash -n install.sh
bash -n upgrade.sh
git diff --check
```

## 生产部署 Checklist

- 构建并固定 `base-portal-release:v0.2.0` 镜像。
- 使用 `upgrade.sh --from v0.1.2 --to v0.2.0 --image base-portal-release:v0.2.0 --pull never` 或等价固定镜像升级路径。
- 读回远端 `.deploy/version`、容器 image、`/health`、`/ready`、`/version`。
- 真实 IAM 登录、userinfo、permissions 验收只记录脱敏证据。
- 导入和 IAM sync 的 dry-run/apply 响应只记录脱敏摘要。

## 当前证据

- 本地 targeted API 测试：`pnpm --filter @base-portal/api test -- ops.service.spec.ts auth.service.spec.ts navigation.service.spec.ts`
- 本地 API typecheck：`pnpm --filter @base-portal/api typecheck`
- 本地完整验证：`docs/verification/2026-06-19-v0.2.0-local-verification.md`
- 生产部署验证：`docs/verification/2026-06-19-v0.2.0-production-deploy.md`
- 真实 IAM 验收：Feishu OAuth 回跳、`/api/session` authenticated、`/api/navigation` 权限过滤和 `login_success mode=iam` 脱敏审计已完成。
