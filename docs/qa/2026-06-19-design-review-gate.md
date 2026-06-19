# Base Portal Design Review Gate

日期：2026-06-19

my-harness step: 10 - Product Design visual QA / design review

## 结论

通过设计评审门禁，可进入 my-harness Step 11 系统化功能 QA。

当前实现已经满足 `DESIGN.md` 和已选 Product Design 方案 2 `Light Command Workspace` 的核心要求：

- 视觉方向：浅色紧凑运营工作台。
- 技术栈：React + TypeScript + Vite、Tailwind CSS、Radix-backed primitives、lucide-react、CSS variables。
- 左侧菜单：当前功能域 contextual menu，不使用独立 icon rail；folder / leaf 语义清楚。
- 工作区：固定首页 tab + 业务 tab + iframe 承载。
- 品牌区：已采用选中的 Creative Production `入口门廊` SVG mark；左上品牌区与 Sidebar 208px 栅格对齐。
- 响应式：桌面、平板、手机可用；手机端抽屉菜单和 tab 打开路径可用。

## 证据

截图：

- 桌面：`output/playwright/design-review-desktop-1440x900.png`
- 平板：`output/playwright/design-review-tablet-834x900.png`
- 手机业务页：`output/playwright/design-review-mobile-390x844.png`
- 手机抽屉：`output/playwright/design-review-mobile-drawer-390x844.png`
- 手机打开业务 tab 后：`output/playwright/design-review-mobile-active-390x844.png`
- Logo 对齐：`output/playwright/base-portal-logo-alignment.png`
- 原型对比：`output/design-qa/prototype-vs-fixed-context-menu-1440x900.png`

关键测量：

- 桌面 `.brand.right = 208`
- 桌面 `.sidebar.right = 208`
- 桌面 `.domain-nav.x = 208`
- 桌面 `.topbar.height = 52`
- 桌面 `.sidebar.width = 208`
- 桌面 `.tab-strip.height = 42`
- 桌面 `.brand-mark = 28x28`
- 手机抽屉 `.sidebar.mobile-open.width = 300`
- 手机点击叶子菜单后 `mobileSidebarOpen = false`，业务 tab 为 `客户视图`

运行态检查：

- 稳定路径 console warning/error：无
- 稳定路径 network failed：无
- 之前视口切换脚本中出现的 `api/audit/menu-opened net::ERR_ABORTED` 已确认是测试 route 使用 204 且连续重载造成的噪声；改用稳定 200 mock audit 响应后无失败请求。

## 验证命令

```bash
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web build
```

结果：全部退出码 0。

## 门禁核对

| 门禁项 | 结果 | 证据 |
|---|---|---|
| 符合 `DESIGN.md` 设计系统 | 通过 | Tailwind/Radix/lucide/CSS variables 已落地 |
| 高度还原定稿原型 | 通过 | `prototype-vs-fixed-context-menu-1440x900.png` |
| 字号和密度 | 通过 | 默认 UI 13px，TopBar 52px，TabStrip 42px |
| 左侧菜单可配置形态 | 通过 | folder/leaf 通用语义图标，不依赖菜单业务 icon |
| 顶部 logo 与侧栏宽度对齐 | 通过 | brand/sidebar/domainNav 坐标均落在 208px 边界 |
| Logo 视觉质量 | 通过 | 选中 `入口门廊`，已实现为 SVG mark |
| 桌面关键路径 | 通过 | 1440x900 截图 |
| 平板关键路径 | 通过 | 834x900 截图 |
| 手机兜底路径 | 通过 | 390x844 抽屉和业务页截图 |
| Console / Network | 通过 | 稳定路径无 warning/error/failed request |
| 自动化验证 | 通过 | typecheck/lint/test/build 全部通过 |

## 非阻塞后续

- iframe 内部 mock 表格是用于设计还原的占位业务系统；真实第三方系统接入后，Portal 只保证壳层和容器体验。
- logo 当前为 UI 内 SVG mark，尚不是完整品牌资产包；正式发布前可补 favicon、PNG 多尺寸和独立 SVG 文件。
- Step 11 功能 QA 应继续覆盖：登录态、空权限、初始化失败、tab 上限、confirm_on_close、最大化、沉浸模式、fallback 面板。
