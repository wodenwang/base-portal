# Base Portal v0.1.2 UX Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 `base-portal` v0.1.2 UX hardening patch release，完成 GitHub issues #6-#9：Tab 关闭按钮固定居右、Tab 桌面拖拽排序和菜单 fallback、菜单栏收缩态 Compact flyout sidebar、Radix ContextMenu/DropdownMenu 鼠标和状态一致性，并完成 release、远端部署和线上验证。

**Architecture:** 不改变 Feishu IAM OAuth、session、权限、审计、数据库 schema、部署拓扑或第二套 UI 框架。v0.1.2 只在现有 React workspace shell、`workspace.ts` 状态模型、Radix 菜单 wrapper 和 CSS 内收口 UX 行为。

**Tech Stack:** React 19、TypeScript、Vite、shadcn/ui 风格组件、Radix primitives、lucide-react、Tailwind CSS、Vitest、Playwright、Docker Compose、GitHub Release。

## Scope Decisions

- D1=B：v0.1.2 范围包含 #6、#7、#8、#9。
- Step 4 设计结论：接受菜单收缩态 B Compact flyout sidebar。
- Step 4 设计结论：接受桌面拖拽 + 菜单 fallback，手机不强求触屏拖拽。
- Step 4 设计结论：本版不强制键盘快捷键。
- Step 4 设计结论：接受 Radix ContextMenu/DropdownMenu 统一状态承载。
- 非范围：菜单管理 UI、Tab 持久化、工作台功能扩展、第二套 UI 框架、部署面架构改动。

## Files

### Product workspace

- Modify: `apps/portal-web/src/workspace.ts`
- Modify: `apps/portal-web/src/workspace.test.ts`
- Modify: `apps/portal-web/src/App.tsx`
- Modify: `apps/portal-web/src/styles.css`

### Version and release defaults

- Modify: `package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/portal-web/package.json`
- Modify: `apps/api/src/modules/health.controller.ts`
- Modify: `deploy/.env.example`
- Modify: `deploy/docker-compose.yml`
- Modify: `install.sh`
- Modify: `upgrade.sh`
- Modify: `DEPLOY.md`
- Modify: `README.md`

### Evidence and harness

- Modify: `.my-harness/README.md`
- Modify: `.my-harness/status.md`
- Create: `.my-harness/runs/2026-06-19-v0.1.2.md`
- Create: `docs/release-v0.1.2.md`
- Create: `docs/ship/2026-06-19-v0.1.2-ship-preflight.md`
- Create: `docs/verification/2026-06-19-v0.1.2-production-deploy.md`
- Create: `docs/superpowers/plans/2026-06-19-v0.1.2-ux-hardening.md`
- Create: Playwright screenshots under `output/playwright/`

## Tasks

### Task 1: Workspace state model

- [x] **Step 1: add pure `reorderTabs` model**

Expected behavior:

- `reorderTabs(state, sourceTabId, targetTabId, placement)` reorders only business tabs.
- Fixed home tab is never movable because it is not represented in `state.tabs`.
- Unknown source, unknown target, same source/target, or no-op placement returns the original state object.
- `activeTabId`, `maximized`, `openMode`, `confirmOnClose`, `domainKey`, `url` and tab object data are preserved.

- [x] **Step 2: add focused Vitest coverage**

Expected behavior:

- Moving before and after works.
- Active tab remains active after moving.
- Maximized state remains unchanged.
- Invalid requests are no-op.

### Task 2: Tab strip UX

- [x] **Step 1: implement fixed close button layout**

Expected behavior:

- Business tab title truncates with ellipsis.
- Close affordance stays pinned to the right edge of each business tab.
- Home tab keeps no close button and cannot be dragged.

- [x] **Step 2: implement desktop HTML drag/drop reorder**

Expected behavior:

- Business tabs can be dragged before/after another business tab on desktop.
- Drop indicator appears on the left or right edge of the target tab.
- Dropping on home tab or outside a valid business tab does not move anything.
- Reorder does not close tabs, change active tab, exit maximized mode, exit immersive mode, or bypass confirm-close behavior.

- [x] **Step 3: add menu fallback**

Expected behavior:

- Context menu and Tab action menu expose `左移` / `右移` for business tabs.
- First tab disables `左移`; last tab disables `右移`.
- Fallback uses the same `reorderTabs` model as drag/drop.

### Task 3: Compact flyout sidebar

- [x] **Step 1: replace collapsed text deformation with compact icon entry**

Expected behavior:

- Collapsed sidebar width stays stable.
- Header text does not squeeze into unreadable fragments.
- Workbench and menu nodes remain icon-first and scan-friendly.

- [x] **Step 2: add hover/focus flyout for collapsed groups**

Expected behavior:

- Hovering or focusing a collapsed group with children opens a compact flyout.
- Flyout shows group title and descendant leaf labels.
- Leaf actions call the same `onOpen` path as expanded menu clicks.
- Active child path is visually indicated in collapsed mode.
- ARIA does not claim unsupported keyboard shortcut behavior.

### Task 4: Radix menu state consistency

- [x] **Step 1: unify item cursor and visual states**

Expected behavior:

- Enabled ContextMenu/DropdownMenu items show pointer cursor.
- Highlighted/hover/focus states share the same background and text treatment.
- Disabled items are muted, non-interactive and use `not-allowed`.
- Separators and labels do not look clickable.

### Task 5: Version bump and local verification

- [x] **Step 1: bump release defaults to v0.1.2**

Expected behavior:

- Root, API and portal package versions read `0.1.2`.
- `/version` fallback reads `0.1.2`.
- Compose and env example default to `BASE_PORTAL_VERSION=v0.1.2` and `APP_VERSION=0.1.2`.
- `install.sh` and `upgrade.sh` default to `v0.1.2`.

- [x] **Step 2: run required local checks**

Run:

```bash
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web build
pnpm --filter @base-portal/api test
pnpm --filter @base-portal/api typecheck
pnpm --filter @base-portal/api lint
pnpm --filter @base-portal/api build
bash -n install.sh
bash -n upgrade.sh
BASE_PORTAL_IMAGE=base-portal-release:v0.1.2 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
git diff --check
```

### Task 6: Browser, QA, review, ship and deploy

- [x] **Step 1: run browser UX checks**

Expected evidence:

- Desktop 1440x900: collapsed sidebar flyout, tab close fixed layout, drag reorder, menu fallback, Radix state.
- Tablet 834x1112: collapsed/sidebar behavior does not overlap workspace.
- Mobile 390x844: no touch drag requirement; menu fallback and layout remain usable.

- [x] **Step 2: complete review and release**

Expected:

- Diff reviewed against #6-#9.
- `main` pushed.
- Tag `v0.1.2` exists and points to the release commit.
- GitHub Release `v0.1.2` exists.

- [x] **Step 3: deploy and verify production**

Expected:

- 92 server has `base-portal-release:v0.1.2`.
- `./upgrade.sh --from v0.1.1 --to v0.1.2 --image base-portal-release:v0.1.2 --pull never` completes.
- Remote `.deploy/version` reads `v0.1.2`.
- `https://base-portal.riversoft.com.cn/health` returns 200.
- `https://base-portal.riversoft.com.cn/ready` returns 200.
- `https://base-portal.riversoft.com.cn/version` reports version `0.1.2` and the release commit.

## 15-Step my-harness Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | D1=B, include issues #6-#9 |
| 2 | Product/design planning review | complete | Read-only Step 2 review |
| 3 | Design artifact / visual target | complete | v0.1.2 increment target: Compact flyout sidebar, fixed tab close, reorder matrix, Radix states |
| 4 | Product design review | complete | Accepted Step 4 decisions |
| 5 | Eng review | complete | No blocking decision gate; native drag/drop + pure model |
| 6 | Writing plan | complete | `IMPLEMENTATION_PLAN.md` and `docs/superpowers/plans/2026-06-19-v0.1.2-ux-hardening.md` |
| 7 | Executing plan | complete | #6-#9 implementation in `workspace.ts`, `App.tsx`, `styles.css` |
| 8 | Verification before completion | complete | `pnpm check`, `pnpm build`, Compose config, `git diff --check` passed |
| 9 | Browser verification | complete | Playwright desktop/tablet/mobile screenshots under `output/playwright/` |
| 10 | Visual QA | complete | Desktop flyout and tablet/mobile regression screenshots reviewed |
| 11 | Functional QA | complete | Local mock-auth shell, drag reorder, menu fallback, `/health`, `/ready`, `/version` |
| 12 | Review | complete | `docs/reviews/2026-06-19-v0.1.2-pre-landing-review.md` |
| 13 | Git closeout | complete | Commit pushed, final closeout retag follows production evidence |
| 14 | Ship | complete | GitHub Release `v0.1.2` |
| 15 | Land and deploy | complete | Production `/version` reads `0.1.2`; final commit verified by tag/readback |
