# Base Portal v0.3.1 Permission UI Scope Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship and deploy `v0.3.1` as a deployment-governance patch that explicitly keeps all permission-related UI out of this version and fixes version default drift in Docker Compose.

**Architecture:** Keep the existing Portal shell, schema, OAuth flow, ops APIs and deployment topology. No new frontend route, no database migration, no permission matrix, no permission sync status page and no audit entry UI.

**Tech Stack:** NestJS 10, Prisma, PostgreSQL, React/Vite existing shell, Vitest, Docker Compose, bash deploy scripts, Feishu IAM OAuth/developer APIs.

---

The canonical detailed plan is mirrored in:

- `docs/superpowers/plans/2026-06-27-v0.3.1-permission-ui-scope-closeout.md`

## Scope Decisions

- Permission matrix is fully out of scope for this version.
- Permission sync status UI and audit entry UI are fully out of scope.
- Product Design visual ideation is not required because no user-visible UI is added.
- Existing file import + ops API remains the operator path for app packages and IAM resource sync.
- `deploy/docker-compose.yml` fallback versions must align with `v0.3.1`.
- Final closeout still requires tag, GitHub Release, fixed Docker image, production deploy and health/version readback.

## Task Summary

- [x] Task 1: bump package versions and deploy defaults to `0.3.1` / `v0.3.1`.
- [x] Task 2: update README, DEPLOY, release notes, design scope decision and `.my-harness/` records.
- [x] Task 3: fix Compose fallback versions for `BASE_PORTAL_VERSION` and `APP_VERSION`.
- [ ] Task 4: run local verification and record evidence.
- [ ] Task 5: run Git closeout, commit, tag and GitHub Release.
- [ ] Task 6: build fixed `linux/amd64` image and deploy to production.
- [ ] Task 7: read back production `.deploy/version`, container image, `/health`, `/ready`, `/version`, DNS and login smoke.

## Required Verification

```bash
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web build
pnpm --filter @base-portal/api test
pnpm --filter @base-portal/api typecheck
pnpm --filter @base-portal/api lint
pnpm --filter @base-portal/api build
pnpm check
pnpm build
BASE_PORTAL_IMAGE=base-portal-release:v0.3.1 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
bash -n install.sh
bash -n upgrade.sh
git diff --check
```

## Completion Standard

- v0.3.1 has tag and GitHub Release.
- Production runs `base-portal-release:v0.3.1`.
- `.deploy/version` reads `v0.3.1`.
- `/version.version` reads `0.3.1`.
- `/version.commit` matches the release commit.
- `/health` and `/ready` pass locally and publicly.
- Release docs and `.my-harness/` explicitly state that permission matrix, permission sync status page, audit entry UI and all permission-related UI are not part of this version.
