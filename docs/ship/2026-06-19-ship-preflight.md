# 2026-06-19 v0.1.0 Ship Preflight

## 范围

本次收口范围是 Base Portal v0.1.0：

- 按 `DESIGN.md` 和已定稿原型做前端高保真重构。
- 修复 GitHub issues #1-#5。
- 补齐 Docker Compose 生产部署、`install.sh`、`upgrade.sh`。
- 发布到 GitHub，创建 `v0.1.0` tag/release。
- 部署到 92 服务器 `/home/bpmt/base-portal`，并通过 `base-portal.riversoft.com.cn` 做生产健康检查。

## 当前状态

状态：READY_FOR_SHIP_WITH_PRODUCTION_ENV_GATE

已完成：

- Step 10 design review：通过，已补高保真前端差距。
- Step 11 systematic QA：通过，QA findings 已修复并复验。
- Step 12 review refresh：通过，人工反馈的浮层漂移、tab 三点菜单、菜单文件夹展开/收缩、移动端触控目标均已修复。
- `deploy/.env` 被 `.gitignore` 忽略，未提交。

仍需在 Step 14/15 完成：

- 提交并 push 当前 v0.1.0 变更。
- 创建 `v0.1.0` tag 和 GitHub release。
- 构建或加载不可变生产镜像。
- 远端 `deploy/.env` 必须具备真实生产值；脚本只允许输出 key 名称，不允许输出 secret 值。
- 启动 Docker Compose 并验证 `/health`、`/ready`。

## 验证

本轮 ship 前新鲜验证：

```bash
pnpm check
pnpm build
bash -n install.sh && bash -n upgrade.sh
./install.sh --help >/tmp/base-portal-install-help.txt
./upgrade.sh --help >/tmp/base-portal-upgrade-help.txt
docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
git diff --check
git check-ignore -v deploy/.env
```

结果：全部通过；`deploy/.env` 确认被 ignore。

Design QA 回归证据：

- `design-qa.md`
- `output/playwright/design-qa-regression-user-menu-1440x900.png`
- `output/playwright/design-qa-regression-tab-context-menu-1440x900.png`
- `output/playwright/design-qa-regression-tab-action-menu-1440x900.png`
- `output/playwright/design-qa-regression-menu-expanded-1440x900.png`
- `output/playwright/design-qa-regression-menu-collapsed-1440x900.png`
- `output/playwright/design-qa-regression-tablet-834x900.png`
- `output/playwright/design-qa-regression-mobile-menu-collapsed-390x844.png`

## 发布边界

- 当前授权允许提交、push、tag、release 和部署推进到部署节点。
- 不读取、不回显真实 secret。
- 不提交 `deploy/.env`。
- 如果 92 服务器缺少生产 secret，部署脚本应停在 env gate，只输出缺失或占位 key。
