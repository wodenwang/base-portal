# Base Portal v0.2.0 IAM App Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship and deploy v0.2.0 with a real Feishu IAM validation path plus one versioned third-party app package import and IAM resource sync flow.

**Architecture:** Keep the existing Portal shell and schema. Add a backend ops service that validates a no-secret JSON app package, imports domains/menus with idempotent upsert, and synchronizes permission points/groups/bindings to Feishu IAM through dry-run/apply modes. Record only non-sensitive summaries in API responses, audit details, docs, and screenshots.

**Tech Stack:** NestJS 10, Prisma, PostgreSQL, React/Vite existing shell, Vitest, Docker Compose, bash deploy scripts, Feishu IAM OAuth/developer APIs.

---

The canonical detailed plan is mirrored in:

- `docs/superpowers/plans/2026-06-19-v0.2.0-iam-app-package.md`

## Scope Decisions

- v0.2.0 includes real IAM validation + one third-party app package.
- No config UI in this version.
- No new visual target. Continue using `DESIGN.md`, `design/base-portal-visual-target.md`, and `design/base-portal-final-design-option-2.md`.
- No session persistence in this version. Container restart logs users out.
- No schema migration unless implementation proves existing `PortalDomain`, `PortalMenu`, and `PortalAuditEvent.detail` cannot express the slice.
- Never print or store `client_secret`, `developer_api_token`, OAuth code, access token, cookies, database password, or certificate private keys.

## Task Summary

- [x] Task 1: bump v0.2.0 versions and add `config/portal-apps/base-portal-demo.json`.
- [x] Task 2: create `OpsService`, app package validation, import dry-run/apply, and endpoint tests.
- [x] Task 3: extend IAM sync for permission points, groups, bindings, dry-run/apply, and safe errors.
- [x] Task 4: add auth normalization and navigation permission coverage.
- [x] Task 5: update README, DEPLOY, release docs, and my-harness status.
- [ ] Task 6: run local verification, browser/manual validation, review, ship, and deploy.

## Required Verification

```bash
pnpm check
pnpm build
BASE_PORTAL_IMAGE=base-portal-release:v0.2.0 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
bash -n install.sh
bash -n upgrade.sh
git diff --check
```

## Completion Standard

- Config package import dry-run/apply works and is idempotent.
- IAM sync dry-run/apply returns only non-sensitive summaries.
- Permission points, groups, and bindings are represented in the sync flow.
- Navigation filtering proves no/partial/full permission behavior.
- v0.2.0 release notes and deployment evidence exist.
- Production `/version` reads `0.2.0` after remote deploy.
