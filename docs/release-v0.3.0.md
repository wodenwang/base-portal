# Base Portal v0.3.0 Release Notes

发布日期：待发布

## 范围

v0.3.0 是第三方无感接入体验版，覆盖：

- `#11` SSO Demo 菜单嵌入页访问路径。
- `#12` 移除沉浸模式产品入口和前端运行态。
- `#13` Tab 右键菜单和 Tab 三点菜单刷新当前 iframe。

## 关键决策

- SSO Demo 自己完成 OAuth/session；Base Portal 只负责入口编排、权限过滤、iframe/new-window/fallback 和可恢复体验。
- Base Portal 不传递 token、cookie、authorization code、client secret、developer API token 或其他第三方会话凭据。
- 历史 `openMode=immersive_iframe` 不做 schema migration，运行时和接入包导入时兼容降级为 `iframe`。
- `new_tab` 作为数据/opening hint 保留；普通菜单点击仍进入 Portal 内部业务 Tab，新窗口由 Tab 菜单和 fallback 显式提供。

## 交付清单

- 版本号和部署默认值更新到 `0.3.0` / `v0.3.0`。
- Portal workspace 删除沉浸模式入口，保留最大化。
- 当前业务 iframe 支持从 Tab 右键菜单和 Tab 三点菜单刷新。
- SSO Demo 菜单入口指向 `https://feishu-iam-sso-demo.riversoft.com.cn/`，以标准 iframe 方式打开，并保留新窗口恢复路径。
- 接入包 import 对历史 `immersive_iframe` 返回非敏感 warning 并写入 `iframe`。

## 验证计划

```bash
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/api test
pnpm --filter @base-portal/api typecheck
pnpm check
pnpm build
BASE_PORTAL_IMAGE=base-portal-release:v0.3.0 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
bash -n install.sh
bash -n upgrade.sh
git diff --check
```

## 生产读回要求

- GitHub tag/release：`v0.3.0`。
- Docker image：固定版本 tag，不使用 `latest`。
- 服务器 `.deploy/version`：`v0.3.0`。
- `/health`、`/ready`、`/version` 通过。
- `/version.commit` 与 release commit 对齐。
- SSO Demo 菜单、fallback 和新窗口恢复路径完成脱敏验证。

## 外部依赖

完全无额外交互的 SSO Demo 内嵌体验依赖 SSO Demo 自身支持嵌入场景下的 OAuth/session/cookie 行为。Base Portal 本版本只交付安全边界内的入口、iframe 和恢复路径；配合需求见 `docs/external-requirements/2026-06-20-feishu-iam-sso-demo-embedded-sso.md`。
