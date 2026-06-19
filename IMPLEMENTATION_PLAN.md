# Base Portal v0.3.0 Embedded SSO Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship and deploy v0.3.0 as the third-party no-touch access experience release, covering SSO Demo embedded entry with recoverable fallback, removal of immersive mode, and refresh-current-iframe actions in tab controls.

**Architecture:** Keep the existing Portal shell, schema, and deployment topology. Base Portal remains an entry orchestrator and permission-filtered workspace; it does not proxy SSO Demo OAuth/session credentials. Workspace tabs use standard iframe runtime only. Historical `immersive_iframe` values are normalized to `iframe` without schema migration. Refresh is modeled as a per-tab iframe revision.

**Tech Stack:** NestJS 10, Prisma, PostgreSQL, React/Vite existing shell, Vitest, Docker Compose, bash deploy scripts, Feishu IAM OAuth/developer APIs.

---

The canonical detailed plan is mirrored in:

- `docs/superpowers/plans/2026-06-20-v0.3.0-embedded-sso-workspace.md`

## Scope Decisions

- SSO Demo owns OAuth/session. Base Portal only provides entry orchestration, permission filtering, internal iframe tab, new-window fallback, and recovery affordances.
- `immersive_iframe` is removed from user-visible UI and frontend workspace runtime.
- Historical `openMode=immersive_iframe` is compatible-downgraded to standard `iframe`; no database schema migration.
- Tab right-click menu and tab three-dot menu share one refresh-current-iframe action.
- No new complete Product Design visual or Pencil prototype is required.
- Never print or store `client_secret`, `developer_api_token`, OAuth code, access token, cookies, database password, or certificate private keys.

## Task Summary

- [ ] Task 1: bump v0.3.0 versions, deploy defaults, release shell, and docs.
- [ ] Task 2: remove immersive runtime from workspace model and add per-tab refresh revision.
- [ ] Task 3: remove immersive UI and wire shared refresh actions in tab context/dropdown menus.
- [ ] Task 4: normalize historical `immersive_iframe` imports, update seed data, and add SSO Demo package entry.
- [ ] Task 5: update documentation, harness index, and external SSO Demo requirement links.
- [ ] Task 6: run local verification and record evidence.
- [ ] Task 7: run browser checks, visual QA, functional QA, and review.
- [ ] Task 8: ship, release, deploy, and production readback.

## Required Verification

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

## Completion Standard

- v0.3.0 removes all user-visible immersive mode entry points.
- Historical `immersive_iframe` data is safely downgraded to `iframe` without schema migration.
- Current business iframe can be refreshed from tab context menu and tab three-dot menu.
- SSO Demo is available as a Base Portal menu entry with standard iframe and recoverable new-window fallback.
- Base Portal never proxies or logs SSO Demo secrets, cookies, OAuth codes, or tokens.
- Local verification, browser QA, review, release, deployment, and production readback evidence exist.
