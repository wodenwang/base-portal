# Base Portal 设计规范

本文档是 `base-portal` 的项目级 UI/UX 与设计系统基线。前端实现、视觉调整、Product Design 输出、Playwright 截图检查和后续设计评审都必须优先读取本文件。

规则来源优先级：

1. 用户在当前任务中的明确指令
2. 已确认的设计制品：`design/base-portal-visual-target.md`
3. 本文件
4. `AGENTS.md`、`README.md`、`IMPLEMENTATION_PLAN.md` 和工程评审文档
5. 现有实现代码
6. shadcn/ui、Radix UI、Tailwind CSS 和 lucide-react 的官方约定

本文件只描述 UI/UX、组件和视觉治理。Feishu IAM、OAuth、安全、secret、部署和验收边界以 `AGENTS.md` 和工程文档为准。

## 产品定位

Base Portal 是企业内部第三方应用门户壳，用于承载多个独立系统。它的核心职责是登录后提供功能域切换、最多三层菜单、Tab 工作区、iframe 承载、沉浸模式和应用内最大化。

当前阶段不是：

- BI 数据驾驶舱
- 完整 Admin Console / CRUD 后台
- 营销官网或落地页
- 通知、待办、搜索、最近访问、个性化首页等聚合工作台
- 第三方系统自身页面的设计系统

## 设计 Brief

本轮已确认的设计风格：

- 视觉参考：Product Design 方案 2 `Light Command Workspace` 已定稿，详见 `design/base-portal-final-design-option-2.md` 和 `design/base-portal-selected-option-2-light-command-workspace.png`。
- UI 框架：选择 `shadcn/ui + Tailwind CSS + Radix primitives + lucide-react`。
- 视觉气质：选择“运营工作台感”，比传统后台更活跃、更高效，但保持克制。
- 品牌色：没有外部品牌偏好，由项目设计自行定义；默认以青绿色作为 primary/accent 起点。
- 首页 tab：保持简单，仅承载当前功能域说明和轻量状态，不做复杂聚合。
- 布局密度：偏紧凑，符合 shadcn 的现代后台密度，避免宽松营销页风格。
- iframe 容器：默认尽量无感，只保留必要工具栏和恢复动作。
- 移动端：桌面和平板优先，手机端提供 Portal 壳兜底，不承诺第三方 iframe 页面完整移动适配。

## 技术和组件基线

前端设计基线为 shadcn/ui。shadcn/ui 在本项目中被视为可复制、可维护的组件代码和组合模式，不是不可修改的黑盒组件库。

推荐组合：

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui 组件代码
- Radix-backed primitives
- lucide-react 图标
- CSS variables 作为主题 token 事实源
- Playwright 做桌面、平板和手机视口验证

不应在同一套 Portal 基线中混用 Ant Design Pro、Material UI、Chakra UI、Arco Design、Element Plus、Bootstrap 或另一套大型 UI 框架。BI 大屏或数据驾驶舱才考虑 React + Ant Design Pro + ECharts，本项目当前不属于该场景。

当前代码尚未完整落地 shadcn/ui 组件结构；后续前端重构应把现有 `Tailwind/Radix/lucide` 方向收敛为 shadcn/ui 组件和项目级组合组件。

本轮不采用独立左侧窄 icon rail。功能域导航保留在 TopBar，左侧只承载当前功能域的 contextual menu；收起态可以是 icon-only sidebar，但不能变成无明确载体的装饰性 rail。

## 主题方向

默认主题使用 shadcn/tweakcn 的 modern minimal / neutral admin 方向：

- 背景：浅灰中性色，保持长时间使用的舒适度。
- 面板：白色或近白色，边框清晰，阴影克制。
- 文字：高对比深色正文，muted 文案用于次要状态。
- 强调色：以青绿色作为 `primary` / `accent` 起点，避免大面积高饱和铺色。
- Sidebar：可使用深色侧栏，但必须保证层级、hover、active 和折叠态清晰。
- 圆角：遵循 shadcn 默认和项目 token，不使用过大的营销式圆角。
- 阴影：只用于浮层、overlay、必要层级；不做重阴影卡片堆叠。

主题必须落到 CSS variables / Tailwind token，不允许在页面组件里散落随机硬编码颜色。若后续提供 Riversoft、Feishu IAM、logo、官网或截图素材，需要先提取安全品牌 token，再调整本文件和实现。

## 布局原则

Portal 壳采用高频办公工具布局：

```text
AppShell
  ├─ TopBar
  │   ├─ Brand
  │   ├─ DomainNav
  │   └─ UserMenu / Logout
  ├─ SidebarTree
  └─ Workspace
      ├─ TabStrip
      └─ EmbedFrame / DomainHome
```

关键规则：

- TopBar 固定展示品牌、功能域和用户区；功能域过多时必须有溢出策略。
- Sidebar 支持三层菜单、展开/收起、窄屏抽屉和折叠态 tooltip。
- Workspace 以 TabStrip 和 iframe 承载区为核心，不做复杂 Dashboard 化首页。
- 固定功能域首页 tab 不计入 20 个业务 tab 上限。
- 业务 tab 必须稳定处理激活、关闭、关闭全部、关闭其他、上限提示和 `confirm_on_close` 确认。
- iframe 标准模式保留完整 Portal 壳；沉浸模式隐藏左侧菜单和顶部功能域；最大化临时覆盖整个 Portal 壳。
- 最大化退出后必须回到进入前的标准或沉浸模式，不能让用户迷失。

## shadcn/ui 组件映射

| Portal 模式 | shadcn/ui / 项目组合 |
|---|---|
| 应用壳 | project `AppShell` + CSS grid/flex |
| 顶部品牌和用户区 | `Button`、`DropdownMenu`、`Avatar` 或项目 `TopBar` |
| 功能域导航 | project `DomainNav` + `Button` + `DropdownMenu` / `ScrollArea` |
| 左侧菜单树 | `Sidebar` 思路 + `Tooltip` + project `SidebarTree` |
| Tab 工作区 | `Tabs` 思路 + project `TabStrip`，必要时配 `ScrollArea` |
| iframe 容器 | project `EmbedFrame` + `Button` + `Tooltip` |
| 沉浸 / 最大化操作 | `Button` + `Tooltip` + 明确退出按钮 |
| 关闭确认 | `AlertDialog` |
| fallback 面板 | `Alert` / project `FallbackPanel` + `Button` |
| 登录页 | `Card` 或轻量面板 + `Button`，不做营销 hero |
| 加载状态 | `Skeleton` / project `LoadingState` |
| 空权限 / 错误 | `Alert` / project `EmptyState` |
| toast / 操作反馈 | `Sonner` 或项目已有 toast |

列表页、管理页或后续配置 UI 如进入范围，应继续使用 shadcn/ui 的 `Table`、`Dialog`、`Sheet`、`Form`、`Input`、`Select`、`Checkbox`、`Badge` 等组合，不引入第二套 UI 框架。

## 交互规则

- 高频操作按钮优先使用 icon + text；空间紧张的 tab、菜单、工具栏可以使用 icon-only，但必须有 `aria-label` 和 tooltip/title。
- 按钮文字不得换行；如果会换行，应改为 icon-only 或调整布局。
- 功能域切换会清空当前业务 tabs，必须二次确认。
- 批量关闭 tabs 时，包含 `confirm_on_close=true` 的页面必须参与确认。
- `new_tab` 打开方式不占用 Portal 内部 tab，但仍记录菜单访问审计。
- iframe fallback 文案只能表达“页面可能无法加载”，不能声称准确识别 CSP、网络、登录态或跨域原因。
- 复制链接、新窗口打开、刷新等恢复动作必须明显且不遮挡 iframe 的基础可见性。
- 所有可交互控件必须有 focus、hover、disabled、loading 或 pending 的可识别状态。

## 响应式规则

优先验证视口：

- 桌面：1440px 宽度，Portal 壳必须完整、紧凑、可高频使用。
- 平板：约 834px 宽度，菜单、功能域、tab 和 iframe 操作仍可用。
- 手机：约 390px 宽度，只要求 Portal 壳不破版，菜单入口、tab 管理、退出最大化可用。

手机端不负责第三方 iframe 页面自身适配。第三方系统的移动端体验由第三方系统负责。

## 状态覆盖

设计和实现必须覆盖：

- 未登录
- 登录中
- 初始化失败
- 已登录但空权限
- 功能域首页
- 菜单展开、折叠、窄屏打开和关闭
- tab 空、正常、达到上限
- `confirm_on_close` 关闭确认
- iframe 加载中、正常、fallback
- 标准 iframe、沉浸模式、最大化模式
- 退出沉浸、退出最大化
- 后端 API 错误和权限不足

不得只按 happy path 设计或验收。

## 视觉禁区

- 不做营销式 hero、巨大标题、装饰性大图或大面积渐变背景。
- 不把 Portal 首页做成复杂卡片 Dashboard。
- 不堆叠卡片包卡片。
- 不使用随机颜色、过饱和主题或难以长时间阅读的深色主题。
- 不把第三方 iframe 页面视觉强行纳入 Portal 风格。
- 不把复杂配置、多 tab 编辑、树选择、批量绑定等重工作流塞进窄 Sheet。

## 设计资产和治理

- `design/base-portal-visual-target.md` 是当前视觉目标来源。
- `design/base-portal-final-design-option-2.md` 是本轮前端重构的定稿设计说明。
- `design/base-portal-selected-option-2-light-command-workspace.png` 是本轮选中的静态视觉稿。
- `design/plan-design-review-on-visual-target.md` 是当前视觉目标评审记录。
- 后续 Product Design 视觉目标、截图、`design-qa.md`、Pencil 导出或设计输入说明必须放入 `design/`，并在本文件或相关阶段文档中引用。
- 当前未使用 Pencil；普通 shadcn Portal 壳不强制创建 `.pen` 文件。
- 当前未使用 shadcn MCP；当前工具环境没有暴露 shadcn MCP。后续实现可使用 shadcn CLI、官方 registry、已有代码或用户授权后的 MCP 配置。

## 验收门禁

前端相关任务不得仅凭“应该没问题”完成，必须保留当次证据：

- 运行项目约定的 lint、typecheck、test 或 build。
- 使用 Playwright 或等价浏览器检查关键路径。
- 截图覆盖桌面、平板或手机中与改动相关的视口。
- 检查浏览器 console 和 Network 中是否有非预期错误。
- 若改动涉及 shadcn/theme/token，检查组件状态、focus ring、hover、active、disabled、loading、empty 和 error。

实现偏离本文件时，必须在交付说明中写明原因；若偏离影响产品方向或设计系统，应先获得确认并更新本文件。
