# Base Portal 前端重构设计定稿

日期：2026-06-19

## 定稿结论

本轮前端重构采用 Product Design 方案 2：`Light Command Workspace`。

选中视觉稿：

- `design/base-portal-selected-option-2-light-command-workspace.png`

采用理由：

- 功能域仍放在 TopBar，符合 `DESIGN.md` 中 `TopBar -> DomainNav` 的信息架构。
- 左侧只承载当前功能域下的菜单树，职责清晰，避免引入没有明确载体的独立 icon rail。
- 浅色 contextual sidebar 更贴近 shadcn/tweakcn neutral admin，重构成本和响应式风险低于 split rail。
- iframe 承载区更接近无感容器，能解决当前主展示区外框和常驻工具按钮过重的问题。

## 不采用的方向

方案 3 的视觉质感可参考，但不采用独立左侧窄 icon rail。

原因：

- 当前项目的信息架构里没有稳定的 rail 载体。
- 若把 rail 设计成功能域，会与 TopBar 的 DomainNav 重复。
- 若把 rail 设计成应用域或快捷入口，会引入 `DESIGN.md` 明确不做的聚合工作台倾向。

保留方案 3 的优点：

- 更强的 workspace-first 气质。
- 更低干扰的 iframe 区域。
- 更清晰的最大化状态表达。

落地方式：

- 这些优点并入方案 2 的浅色 contextual sidebar，而不是新增独立 rail。

## 页面结构

```text
AppShell
  ├─ TopBar
  │   ├─ Brand
  │   ├─ DomainNav
  │   └─ UserMenu
  ├─ SidebarTree
  │   ├─ ActiveDomainHeader
  │   ├─ ThreeLevelMenu
  │   └─ CollapseControl
  └─ Workspace
      ├─ TabStrip
      └─ EmbedFrame / DomainHome / StatePanel
```

## 核心视觉规则

- 整体使用浅色 neutral admin 风格，背景为浅灰，主要工作面为白色或近白色。
- primary/accent 使用克制青绿色，只用于 active、focus、关键按钮和状态强调。
- 左侧菜单使用浅色面板，不使用重色块压迫 iframe 内容。
- iframe 标准态不再出现明显外框和固定标题工具栏。
- Tab、菜单、按钮、功能域导航和用户区文本全部保持单行；长文本使用 ellipsis 和 `title` / tooltip。
- 控件圆角遵循 shadcn 默认密度，不使用营销式大圆角。
- 阴影只用于 dropdown、context menu、fallback overlay 和必要浮层。

## 关键状态覆盖

本轮实现必须覆盖以下状态：

- 未登录：轻量登录面板，提供 Feishu IAM 登录和本地 mock 登录入口；不做营销 hero。
- 初始化失败：清晰错误说明和重试按钮。
- 已登录但空权限：说明当前账号暂无可访问菜单，提供刷新或退出。
- 功能域首页：只说明当前功能域和轻量状态，不做复杂 dashboard。
- 菜单展开：左侧 contextual sidebar 展示最多三层菜单。
- 菜单收起：左侧宽度收缩为 icon-only 菜单，保留 tooltip/title。
- 窄屏菜单：手机和平板窄宽度使用抽屉。
- Tab 空：显示功能域首页 tab。
- Tab 正常：固定首页 tab + 业务 tab，业务 tab 可关闭。
- Tab 达到上限：保持 20 个业务 tab 上限提示。
- `confirm_on_close`：关闭当前、关闭其他、关闭全部都参与确认。
- iframe 正常：无感承载，无固定工具栏。
- iframe fallback：展示“页面可能无法加载”，提供刷新、复制链接、新窗口打开。
- 最大化模式：iframe 覆盖 Portal 壳，保留清晰的退出最大化入口。
- v0.3.0 当前 iframe 刷新：业务 tab 右键菜单和 Tab 操作菜单都提供刷新入口，只重载当前 iframe。

## GitHub Issues 对应设计规则

### #1 iframe 主展示区

- 标准业务页面下，iframe 区域不再有明显 `embed-shell` 外框。
- 不在 iframe 顶部常驻展示「新窗口」「最大化」。
- fallback 状态仍保留恢复动作。

### #2 Tab 和窗口操作

- 「新窗口打开」「最大化」「关闭当前」「关闭其他」「关闭全部」集中放入业务 tab 右键菜单。
- 固定首页 tab 不显示关闭类误导操作。
- 最大化后提供明确退出入口。

### #3 菜单默认打开方式

- 左侧菜单点击默认打开或激活 Portal 内部业务 tab。
- 菜单数据中的 `new_tab`、`immersive_iframe` 不再作为默认点击体验。
- `immersive_iframe` 在 v0.3.0 起作为历史数据兼容降级为标准 iframe，不再显示沉浸模式入口。
- 新窗口、最大化和刷新只由 tab 右键菜单或 Tab 操作菜单触发。

### #4 顶部用户区

- TopBar 右侧默认只展示头像、用户名称和下拉指示。
- 「退出登录」进入 UserMenu，不再常驻在 TopBar。

### #5 窄宽度禁换行

- TopBar、DomainNav、SidebarHeader、MenuNode、Tab、ContextMenu、UserMenu 和所有按钮必须 `white-space: nowrap`。
- 长标题使用 ellipsis，不允许撑开布局或增加行高。
- 手机端优先用抽屉、icon-only 和短文案，不通过缩小到不可读字号解决。

## 响应式策略

### 1440px 桌面

- TopBar 完整展示品牌、功能域导航和用户菜单。
- Sidebar 展开为当前功能域菜单树。
- TabStrip 横向滚动，保持单行。
- iframe 区域最大化可用空间。

### 834px 平板

- TopBar 保留品牌、当前功能域和用户菜单。
- DomainNav 可折叠为更多菜单或横向滚动。
- Sidebar 可以保持展开或切换为抽屉，按实际宽度决定。
- TabStrip 单行横向滚动。

### 390px 手机

- 只保证 Portal 壳可用，不承诺 iframe 内部页面适配。
- TopBar 显示菜单入口、品牌短名和用户入口。
- Sidebar 使用抽屉。
- Tab 管理可通过 TabStrip 滚动或菜单入口完成。
- 退出最大化必须始终可见。

## 实现约束

- 不引入 Ant Design Pro、Material UI、Chakra UI、Arco Design、Element Plus、Bootstrap 或其他大型 UI 框架。
- 优先使用现有 React + TypeScript + CSS variables + lucide-react 组合，逐步收敛到 shadcn/ui 组件模式。
- 不把真实 secret、token、cookie、authorization code 或用户敏感数据写入代码、测试、截图或文档。
- 正式开发前必须以本文档和 `DESIGN.md` 作为设计依据。
