# Base Portal Design QA

final result: pass with P2 follow-ups

source visual truth path: `design/base-portal-selected-option-2-light-command-workspace.png`
implementation screenshot path: `output/playwright/design-qa-fixed-context-menu-1440x900.png`
viewport: 1440x900
state: logged-in portal shell, customer business tab, tab context menu path
full-view comparison evidence: `output/design-qa/prototype-vs-fixed-context-menu-1440x900.png`
implementation-only evidence: `output/playwright/design-qa-fixed-implementation-1440x900.png`
patches made since previous QA pass: Radix-backed dropdown/context menu, Tailwind config entry, compact CSS tokens, high-fidelity mock embedded business pages, expanded operations navigation seed, configurable menu icon semantics, tab class conflict fix.

logo selection: Creative Production `logo-explorer` route `入口门廊` selected by user and implemented as a deterministic SVG mark in `BrandMark`.
logo/alignment evidence: `output/playwright/base-portal-logo-alignment.png`

## Result

The previous P1 blockers are resolved for the v0.1.0 visual target.

- Embedded workspace content is no longer a placeholder. `/placeholder/ops-customers` now renders a dense customer-management mock page with inner app header, tabs, filters, table rows, row states, actions, and pagination.
- Typography and component density now match the compact admin direction. Measured implementation uses 13px default UI text, 52px TopBar, 208px Sidebar, 31px active menu rows, 42px TabStrip, 31px tabs, and 9px workspace padding.
- Sidebar hierarchy now represents the selected prototype: customer management, business handling, opportunity management, contract management, data center, and system management sections are present in the QA navigation path.
- Sidebar menu icons no longer depend on per-menu business icon configuration. Folder/group nodes use a shared folder icon; leaf nodes use a shared small dot marker, with the active leaf rendered as a teal filled dot. This matches the future configurable-menu model and keeps folder vs leaf semantics visually distinct.
- Tab context menu now uses Radix ContextMenu with compact rows and appears near the active business tab.
- Domain and user menus now use Radix DropdownMenu. User dropdown includes avatar, name, user id, and logout.
- Tailwind is configured and integrated without introducing a second UI framework. The previous `.fixed` class collision with Tailwind was found during browser QA and fixed by renaming the home tab class to `.home-tab`.
- Top-left brand area and left sidebar now share the same `--sidebar-width` boundary. Browser measurement: `.brand.right = 208`, `.sidebar.right = 208`, `.domain-nav.x = 208`.
- The old `BP` text block has been replaced by the selected abstract gateway logo mark. The mark is SVG-based for small-size clarity and uses the existing teal/slate design tokens.

## Measured Metrics

Captured from the running implementation after fixes:

- `.topbar`: `1440x52`, `font-size: 13px`, `padding: 0 14px`
- `.sidebar`: `208x848`, `font-size: 13px`
- `.menu-leaf.active`: `193x31`, `font-size: 13px`, `padding: 5px 9px 5px 24px`
- `.menu-folder-icon`: 6 folder/group nodes in the QA navigation path
- `.menu-leaf-dot`: 11 leaf nodes in the QA navigation path; active leaf dot color `rgb(15, 143, 138)`
- `.tab-strip`: `1232x42`, `font-size: 13px`
- `.tab.active:not(.home-tab)`: `118x31`, `font-size: 13px`
- `.workspace-content`: `padding: 9px`
- Radix context menu: `168x173`, `font-size: 13px`
- `.brand`: `208px` wide, aligned with `.sidebar`
- `.brand-mark`: `28x28` in TopBar, `44x44` in LoginScreen

## Remaining P2 Follow-ups

- The prototype image contains extra lower-board state examples because it is a static design board crop. The implementation screenshot is a real runtime page and correctly does not include those non-runtime thumbnails.
- TopBar brand/user micro-spacing can still be tuned closer to the visual target after user confirmation.
- Mock business table column widths and exact row copy are directionally close, but not pixel-identical to the prototype.
- Theme tokenization is improved, but some component-local state colors remain explicit for semantic status labels.

## Verification

Commands run after the fixes:

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

All commands exited 0.

---

## Scoped Regression: Menu and Floating Layers, 2026-06-19

final result: pass after one P2 mobile touch-target fix

scope: `design-review` / design QA scoped regression for the recent menu and floating-layer changes.

covered states:

- desktop 1440x900: sidebar folder expanded and collapsed
- desktop 1440x900: user dropdown position
- desktop 1440x900: business tab context menu position
- desktop 1440x900: tab action dropdown from the right-side three-dot button
- tablet 834x900: no horizontal overflow, tab strip and drawer-safe layout
- mobile 390x844: drawer menu folder expanded and collapsed

## Regression Findings

### DQA-REG-001 P2 fixed: mobile touch targets were below the design QA baseline

The first scoped design QA pass found that mobile Portal shell controls were still using compact desktop dimensions. Several controls measured 30-34px tall, below the 44px mobile target in `DESIGN.md` and the design-review checklist.

Fix:

- Kept desktop and tablet compact density unchanged.
- Added mobile-only sizing under `@media (max-width: 640px)`.
- Mobile `.icon-button`, `.user-menu-trigger`, `.menu-node button`, `.workbench-link`, `.tab`, and `.tab-actions .icon-button` now measure at least 44px in the tested state.

## Regression Metrics

- Desktop TopBar: `1440x52`
- Desktop Sidebar: `208x848`
- Desktop Brand width: `208`, still aligned with Sidebar width
- Desktop menu folder row: `193x31`
- Desktop menu leaf row: `193x31`
- Folder expanded state: `aria-expanded=true`, leaf nodes visible
- Folder collapsed state: `aria-expanded=false`, leaf nodes hidden
- User dropdown alignment: `rightGap=0`, `verticalGap=8.5`
- Tab context menu position: `xFromTabLeft=61`, `yFromTabTop=15`
- Tab action dropdown alignment: `rightGap=0`, `verticalGap=8.5`
- Mobile menu folder row after fix: `285x44`
- Mobile menu leaf row after fix: `285x44`
- Mobile tab after fix: `112x44`
- Mobile touch targets under 44px after fix: `[]`
- Tablet horizontal overflow: `false`
- Mobile horizontal overflow: `false`
- Browser console errors: `[]`
- Request failures: `[]`

## Regression Evidence

- `output/playwright/design-qa-regression-menu-expanded-1440x900.png`
- `output/playwright/design-qa-regression-menu-collapsed-1440x900.png`
- `output/playwright/design-qa-regression-user-menu-1440x900.png`
- `output/playwright/design-qa-regression-tab-context-menu-1440x900.png`
- `output/playwright/design-qa-regression-tab-action-menu-1440x900.png`
- `output/playwright/design-qa-regression-tablet-834x900.png`
- `output/playwright/design-qa-regression-mobile-menu-collapsed-390x844.png`

## Commands

```bash
pnpm check
pnpm build
```

Both commands exited 0 after the mobile touch-target fix.
