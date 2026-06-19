# 2026-06-19 Step 12 落地前代码审查

## Review findings

### REVIEW-001 P1 已修复：部署脚本远端命令参数未做 shell quote

- 位置：`install.sh`、`upgrade.sh`
- 风险：`REMOTE_DIR`、版本号、镜像名、域名等 CLI 参数被拼接进远端 `ssh` 命令。默认值安全，但一旦参数包含空格、引号或 shell 元字符，可能导致部署失败，严重时形成远端命令注入面。
- 修复：新增 `shell_quote()`，对远端命令里的目录、版本、镜像和域名参数统一 `%q` 转义。

### REVIEW-002 P2 已修复：菜单打开审计记录与实际 tab 状态不一致

- 位置：`apps/portal-web/src/App.tsx`
- 风险：当前 tab 状态机已按设计把所有菜单统一打开为内部 `iframe`，但审计事件仍使用菜单原始 `openMode`，可能记录成 `new_tab` 或 `immersive_iframe`；同时 tab 上限拒绝时也会先写审计。
- 修复：先执行 `openMenuTab` 并处理 `limit` 分支，再从实际打开的 tab 读取 `openMode` 写审计。

### REVIEW-003 P2 已修复：菜单树对异常缺省 `children` 缺少防御

- 位置：`apps/portal-web/src/App.tsx`
- 风险：正常 API 契约会返回 `children: []`，但如果菜单数据缺省 `children`，前端会访问 `.length` 并导致白屏，影响初始化失败场景的可诊断性。
- 修复：`MenuNode` 将缺省 `children` 统一按空数组处理。

## Scope check

本轮审查覆盖：

- 前端重构：工作台布局、菜单、tab 状态机、Radix 右键菜单、iframe fallback、沉浸/最大化、桌面/平板/手机响应式。
- QA findings 修复：未登录、初始化失败、空权限、session 5xx、confirm_on_close、tab 上限、移动抽屉。
- 部署面：Docker Compose、`install.sh`、`upgrade.sh`、`DEPLOY.md` 中的 92 服务器、DNS、证书和反向代理流程。
- Secret 边界：未读取或回显真实 secret，未提交 `deploy/.env`。

Scope 结论：CLEAN。发现的问题均已修复，没有要求推迟当前 v0.1.0 本地交付的阻塞项。

## 验证证据

- `bash -n install.sh && bash -n upgrade.sh`：通过。
- `./install.sh --help >/tmp/base-portal-install-help.txt && ./upgrade.sh --help >/tmp/base-portal-upgrade-help.txt`：通过。
- `docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config >/tmp/base-portal-compose-config.txt`：通过。
- `pnpm check`：通过，覆盖 API typecheck/lint/test 与 portal typecheck/lint/test。
- `pnpm build`：通过，覆盖 API Nest build 与 portal Vite production build。
- Playwright review regression：通过。
  - 审计 openMode 与实际内部 iframe tab 一致。
  - `confirm_on_close` 分支可触发。
  - Radix 右键菜单 `关闭其他` 可用。
  - iframe fallback 保持 portal shell 可操作。
  - 手机视口抽屉可打开并展示菜单。
  - 最终主路径 smoke：`consoleErrors=[]`、`requestFailures=[]`。
  - 证据截图：
    - `output/playwright/review-step12-audit-openmode.png`
    - `output/playwright/review-step12-immersive.png`
    - `output/playwright/review-step12-iframe-fallback.png`
    - `output/playwright/review-step12-mobile-drawer.png`
    - `output/playwright/review-step12-final-smoke.png`
    - `output/playwright/review-step12-mobile-final.png`

## 残余风险

- 生产部署仍需 Step 15 在 92 服务器注入真实环境变量、注册 DNS、签发证书、配置 `~/nginx` 反向代理并做线上健康检查。
- 首版 session 仍是内存实现，适合 v0.1.0 单实例部署；多副本生产化前需要 Redis 或数据库 session。
- 菜单和权限资源首版通过 seed/API 初始化，后续如果运营频繁变更菜单，需要正式管理界面或稳定 CLI。

---

## 2026-06-19 Step 12 refresh：人工反馈后的浮层与菜单回归

### Review findings

### REVIEW-004 P1 已修复：Radix 浮层被全局定位样式干扰导致菜单漂移

- 位置：`apps/portal-web/src/styles.css`
- 风险：右上角登录信息菜单和 tab 右键菜单由 Radix Popper 管理定位，但通用菜单样式覆盖了定位属性，导致浮层从触发点漂移，破坏高频操作路径。
- 修复：移除会覆盖 Radix Popper 的固定定位/transform 规则，保留视觉样式到 `.dropdown-menu`、`.tab-context-menu`、`.tab-action-menu`。

### REVIEW-005 P1 已修复：tab 右侧三点按钮缺少可触发操作菜单

- 位置：`apps/portal-web/src/App.tsx`
- 风险：tab bar 右侧三点按钮视觉上表示更多操作，但无法打开菜单，影响关闭其他、关闭全部、最大化和沉浸模式等 tab 管理动作。
- 修复：将三点按钮接入 Radix `DropdownMenu`，补齐新窗口打开、最大化、沉浸模式、关闭当前、关闭其他、关闭全部等命令，并复用现有 tab 状态机。

### REVIEW-006 P2 已修复：菜单文件夹节点无法点击展开/收缩

- 位置：`apps/portal-web/src/App.tsx`
- 风险：未来菜单配置化后，文件夹节点需要承载信息架构而不是业务图标；不可折叠会降低长菜单可扫读性，也不符合原型中的树形导航预期。
- 修复：文件夹节点新增本地展开状态、`aria-expanded` 和 `aria-controls`，点击文件夹可展开/收缩；叶子节点仍负责打开业务 tab。

### REVIEW-007 P2 已修复：移动端触控目标仍沿用桌面紧凑密度

- 位置：`apps/portal-web/src/styles.css`
- 风险：桌面密度符合原型，但手机抽屉、tab 和图标按钮在移动视口低于 44px，未达到 `DESIGN.md` 对移动端可点性的门禁。
- 修复：在 `@media (max-width: 640px)` 下仅提升移动端菜单行、tab、图标按钮、用户入口的尺寸，桌面和平板紧凑密度保持不变。

### Refresh scope check

本次 refresh 重点复核：

- 用户菜单、tab 右键菜单、tab 三点操作菜单的 Radix 定位和触发。
- 左侧菜单文件夹展开/收缩，以及文件夹/叶子节点的图标语义。
- 左侧栏与顶部 logo 区域的宽度对齐。
- 桌面、平板、手机视口下无横向溢出，手机触控目标达到设计门禁。
- `deploy/.env` 未读取、未回显、未提交。

Refresh 结论：CLEAN。人工反馈问题均已修复并通过 design QA 回归，没有新的 Step 12 阻塞项。

### Refresh 验证证据

- `pnpm check`：通过，覆盖 API 与 portal 的 typecheck、lint、Vitest。
- `pnpm build`：通过，覆盖 API Nest build 与 portal Vite production build。
- `bash -n install.sh && bash -n upgrade.sh`：通过。
- `./install.sh --help >/tmp/base-portal-install-help.txt && ./upgrade.sh --help >/tmp/base-portal-upgrade-help.txt`：通过。
- `docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config >/tmp/base-portal-compose-config.txt`：通过。
- `git diff --check`：通过。
- `git check-ignore -v deploy/.env`：确认 `deploy/.env` 被 `.gitignore` 忽略。
- Design QA regression：通过，记录于 `design-qa.md`。
  - `output/playwright/design-qa-regression-user-menu-1440x900.png`
  - `output/playwright/design-qa-regression-tab-context-menu-1440x900.png`
  - `output/playwright/design-qa-regression-tab-action-menu-1440x900.png`
  - `output/playwright/design-qa-regression-menu-expanded-1440x900.png`
  - `output/playwright/design-qa-regression-menu-collapsed-1440x900.png`
  - `output/playwright/design-qa-regression-tablet-834x900.png`
  - `output/playwright/design-qa-regression-mobile-menu-collapsed-390x844.png`
