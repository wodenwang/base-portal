# Base Portal v0.1.0 设计 QA 记录

日期：2026-06-19

## 依据

- `DESIGN.md`
- `design/base-portal-final-design-option-2.md`
- `design/base-portal-selected-option-2-light-command-workspace.png`

## 检查结论

当前前端切片符合 Product Design 方案 2 `Light Command Workspace` 的主要落地方向：

- 功能域仍在 TopBar。
- 左侧只承载当前功能域菜单，没有引入独立 icon rail。
- 左侧菜单已调整为浅色 contextual sidebar，并带有当前菜单淡青底和青色竖条。
- iframe 标准态更接近无感容器。
- tab/window 操作从常驻工具栏迁移到业务 tab 右键菜单。
- 用户退出入口收进用户下拉菜单。
- 平板和手机视口没有文本换行导致的布局增高。
- 技术栈遵循 `DESIGN.md`：React + TypeScript + Vite + CSS variables + lucide-react，未引入 Ant Design Pro、Material UI、Chakra UI、Arco Design、Element Plus、Bootstrap 或其他大型 UI 框架。

## 待后续设计评审复核

- 右键菜单当前为项目内轻量实现，后续如引入 Radix/shadcn `DropdownMenu` 或 `ContextMenu`，需要复核键盘导航和焦点管理。
- 手机端抽屉打开时没有遮罩层；当前可用，但后续 `/design-review` 可判断是否需要补 overlay。
- 真实第三方 iframe 内容接入后，需要复核 fallback 面板是否遮挡关键内容。

## 截图证据

- `output/playwright/base-portal-v0.1.0-desktop-user-menu.png`
- `output/playwright/base-portal-v0.1.0-desktop-context-menu.png`
- `output/playwright/base-portal-v0.1.0-desktop-maximized.png`
- `output/playwright/base-portal-v0.1.0-tablet.png`
- `output/playwright/base-portal-v0.1.0-mobile-drawer.png`
