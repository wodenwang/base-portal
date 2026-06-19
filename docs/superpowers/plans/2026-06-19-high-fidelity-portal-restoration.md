# Base Portal 高保真还原修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Keep this plan updated as work completes.

**Goal:** 修复 Product Design `design-qa` 中标记为 blocked 的前端保真问题，使当前实现高度贴近 `design/base-portal-selected-option-2-light-command-workspace.png`，并继续严格遵循 `DESIGN.md` 的技术栈约束。

**Source Visual Truth:** `design/base-portal-selected-option-2-light-command-workspace.png`

**Current QA Baseline:** `design-qa.md`，结论为 `blocked`。

**Design Constraints:**

- 使用 `React + TypeScript + Vite`。
- 使用 `Tailwind CSS` 配置入口、CSS variables 作为 token 事实源。
- 使用 Radix-backed primitives 和 shadcn/ui 风格的本地组件源码。
- 使用 `lucide-react` 图标。
- 不引入 Ant Design Pro、MUI、Chakra、Arco、Element Plus、Bootstrap 或第二套大型 UI 框架。
- 不读取、回显或提交真实 secret；不处理 `deploy/.env`。

## 文件清单

### 前端技术栈收敛

- Modify: `apps/portal-web/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/portal-web/tailwind.config.ts`
- Create: `apps/portal-web/postcss.config.cjs`
- Create: `apps/portal-web/src/components/ui/dropdown-menu.tsx`
- Create: `apps/portal-web/src/components/ui/context-menu.tsx`
- Create: `apps/portal-web/src/lib/utils.ts`

### 高保真视觉还原

- Modify: `apps/portal-web/src/App.tsx`
- Modify: `apps/portal-web/src/styles.css`
- Modify: `apps/api/prisma/seed.ts`
- Modify: `apps/api/test/navigation.service.spec.ts`

### 治理和 QA 证据

- Modify: `.gitignore`
- Modify: `IMPLEMENTATION_PLAN.md`
- Modify: `design-qa.md`
- Create/Modify: `output/playwright/*design-qa*.png`
- Create/Modify: `output/design-qa/*`

## Task 1: 技术栈补齐

- [x] **Step 1: 增加 Tailwind 和 Radix 依赖**

Run:

```bash
pnpm --filter @base-portal/portal-web add @radix-ui/react-context-menu @radix-ui/react-dropdown-menu
pnpm --filter @base-portal/portal-web add -D tailwindcss postcss autoprefixer
```

Expected:

- `apps/portal-web/package.json` 包含 Radix primitives 和 Tailwind 相关依赖。
- `pnpm-lock.yaml` 更新。

- [x] **Step 2: 创建 Tailwind 配置和 shadcn 风格组件源码**

Expected:

- `tailwind.config.ts` 扫描 `index.html` 和 `src/**/*.{ts,tsx}`。
- `postcss.config.cjs` 启用 `tailwindcss` 和 `autoprefixer`。
- `dropdown-menu.tsx`、`context-menu.tsx` 使用 Radix primitives，输出项目 className。
- `utils.ts` 提供 `cn()`。

## Task 2: 业务 iframe mock 内容还原

- [x] **Step 1: 替换空占位页**

Expected:

- `/placeholder/ops-customers` 展示高密度客户管理页面：内层应用 header、tabs、筛选器、主操作、表格、状态、分页。
- `/placeholder/ops-orders` 展示同等密度订单页面。
- 其他 placeholder route 展示紧凑 generic business table，不再出现大面积空白占位。

- [x] **Step 2: 保持 production iframe 边界**

Expected:

- 仅 `/placeholder/*` mock routes 使用模拟业务页面。
- 正常菜单 URL 仍按原 iframe 机制加载。

## Task 3: Portal 壳密度和 token 收敛

- [x] **Step 1: 引入紧凑 admin 视觉 token**

Expected:

- `--font-size-ui: 13px`、`--font-size-sm: 12px`、`--topbar-height`、`--sidebar-width`、`--tabbar-height` 等 token 生效。
- TopBar、Sidebar、TabStrip、Dropdown、ContextMenu 默认字号落在 12-14px。

- [x] **Step 2: 收紧布局尺寸**

Expected:

- TopBar 约 52px。
- Sidebar 约 208px。
- 菜单行高约 30-34px。
- TabStrip 约 42px。
- Workspace padding 约 8-10px。

## Task 4: 导航层级还原

- [x] **Step 1: 扩展 seed 示例菜单**

Expected:

- 运营中心包含客户管理、业务办理、商机管理、合同管理、数据中心、系统管理等多 section。
- 保留 `ops-orders`、`ops-customers` 等既有 key，避免破坏已有测试和 issue 路径。
- mock 登录仍能看到全部 leaf 菜单。

- [x] **Step 2: 更新导航过滤测试**

Expected:

- parent inclusion 行为仍有测试覆盖。
- 新的客户管理父菜单路径有断言。

## Task 5: Radix 浮层和交互还原

- [x] **Step 1: 用 Radix DropdownMenu 重构 DomainNav 和 UserMenu**

Expected:

- DomainNav 下拉、UserMenu 下拉支持 Escape、外部点击、role 和键盘行为。
- 用户菜单包含头像、姓名、用户 ID 和退出登录。

- [x] **Step 2: 用 Radix ContextMenu 重构业务 tab 右键菜单**

Expected:

- Context menu 锚定 tab 区域，行高和字号紧凑。
- 菜单项：新窗口打开、最大化、关闭当前、关闭其他、关闭全部。

## Task 6: 验证和 design-qa 回归

- [x] **Step 1: 运行自动化验证**

Run:

```bash
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web build
pnpm --filter @base-portal/api typecheck
pnpm --filter @base-portal/api lint
pnpm --filter @base-portal/api test
pnpm --filter @base-portal/api build
```

Expected:

- All commands exit 0.

- [x] **Step 2: Playwright 截图和 Product Design design-qa 回归**

Expected:

- 重新截图当前实现 1440x900。
- 生成 source vs implementation side-by-side evidence。
- 更新 `design-qa.md`，`final result` 至少不再因 P1 保真问题 blocked；若仍有差距，必须明确剩余 P2/P3。

## 完成标准

- `design-qa.md` 有本轮修复后的新证据路径和结论。
- 视觉上不再是空白占位 iframe，而是接近原型的密集业务页面。
- TopBar、Sidebar、TabStrip、ContextMenu 密度与原型接近。
- `DESIGN.md` 要求的 Radix-backed primitives、Tailwind 配置入口、CSS variable token 和 lucide-react 都已落地。
- 自动化验证命令均有新鲜通过证据；若任何命令未能运行，必须说明原因和剩余风险。
