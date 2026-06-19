# Base Portal v0.1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 `base-portal` v0.1.1 生产硬化版本：把 v0.1.0 生产上线过程中暴露的部署脚本、镜像构建和 favicon 问题收口，并完成 GitHub release、远端升级和生产健康验证。

**Architecture:** 不改变 Feishu IAM OAuth、session、权限、菜单、审计和 Portal UI 主链路。v0.1.1 只改生产发布面、静态 favicon 和证据文档。部署仍采用固定版本 Docker image + Docker Compose，`install.sh` 负责首次安装，`upgrade.sh` 负责版本升级。

**Tech Stack:** React 19、TypeScript、Vite、NestJS、Prisma、PostgreSQL、Docker Compose、nginx、Vitest、Playwright、GitHub Release。

## Scope Decisions

- D1=A：版本性质为 `v0.1.1` 生产硬化，不进入 `v0.2.0` 门户功能扩展。
- D2=A：只做生产硬化和证据收口；真实 OAuth 端到端人工验证可作为发布后独立 QA，不阻塞本版本。
- D3=A：完成标准为本地修复、GitHub release、生产升级验证和文档证据闭环。

## Files

### Deployment hardening

- Modify: `install.sh`
- Modify: `upgrade.sh`
- Modify: `deploy/web.Dockerfile`
- Modify: `deploy/docker-compose.yml`
- Modify: `deploy/.env.example`
- Modify: `DEPLOY.md`

### Version and web shell

- Modify: `package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/portal-web/package.json`
- Modify: `apps/portal-web/index.html`
- Create: `apps/portal-web/public/favicon.svg`

### Evidence and release docs

- Modify: `README.md`
- Modify: `.my-harness/README.md`
- Modify: `.my-harness/status.md`
- Create: `.my-harness/runs/2026-06-19-v0.1.1.md`
- Create: `docs/release-v0.1.1.md`
- Create: `docs/ship/2026-06-19-v0.1.1-ship-preflight.md`
- Create: `docs/verification/2026-06-19-v0.1.1-production-deploy.md`
- Include: `docs/verification/2026-06-19-bpmt-production-deploy.md`
- Include: `output/playwright/base-portal-production-2026-06-19.png`

## Tasks

### Task 1: Version and favicon

- [x] **Step 1: bump repository version defaults to v0.1.1**

Expected behavior:

- Root, API, and portal package versions read `0.1.1`.
- Compose and env example default to `BASE_PORTAL_VERSION=v0.1.1` and `APP_VERSION=0.1.1`.
- `install.sh` defaults to `v0.1.1`.
- `upgrade.sh` defaults to `--to v0.1.1`.

- [x] **Step 2: add explicit browser favicon**

Expected behavior:

- Vite serves `/favicon.svg`.
- `index.html` declares the favicon link.
- Production login page no longer emits the `/favicon.ico` 404 console error that was seen after v0.1.0.

### Task 2: Pull policy hardening

- [x] **Step 1: add pull policy inputs to install and upgrade scripts**

Expected behavior:

- `BASE_PORTAL_PULL_POLICY=missing|always|never` is accepted.
- `--pull missing|always|never` is accepted.
- Invalid values fail before remote mutation.

- [x] **Step 2: avoid mandatory Docker Hub pulls when images already exist**

Expected behavior:

- `missing` pulls only missing `postgres:16-alpine` or target web image.
- `never` skips all pulls and runs `docker compose up -d --no-build --pull never`.
- `always` preserves the explicit pull behavior.
- Scripts still reject `latest`, missing images, unsafe env, and placeholder secrets.

### Task 3: Build image base hardening

- [x] **Step 1: make Dockerfile base image configurable**

Expected behavior:

- `deploy/web.Dockerfile` supports `ARG NODE_IMAGE=node:22-alpine`.
- Remote build can use a locally tagged mirror while preserving the default image.

### Task 4: Verification

- [x] **Step 1: run local checks**

Run:

```bash
bash -n install.sh
bash -n upgrade.sh
./install.sh --help >/tmp/base-portal-install-help.txt
./upgrade.sh --help >/tmp/base-portal-upgrade-help.txt
BASE_PORTAL_IMAGE=base-portal-release:v0.1.1 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config
pnpm check
pnpm build
git diff --check
```

Result: passed on 2026-06-19 19:55 CST.

- `bash -n install.sh`：通过。
- `bash -n upgrade.sh`：通过。
- `./install.sh --help >/tmp/base-portal-install-help.txt`：通过。
- `./upgrade.sh --help >/tmp/base-portal-upgrade-help.txt`：通过。
- `BASE_PORTAL_IMAGE=base-portal-release:v0.1.1 docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config`：通过，读回 `image: base-portal-release:v0.1.1`、`APP_VERSION: 0.1.1`、`BASE_PORTAL_VERSION: v0.1.1`。
- `pnpm check`：通过，API 2 tests、portal-web 13 tests。
- `pnpm build`：通过，portal-web build includes `dist/favicon.svg`。
- `git diff --check`：通过。
- `BASE_PORTAL_IMAGE=base-portal-release:v0.1.1 ./upgrade.sh --pull invalid`：退出码 `2`，在远端变更前拒绝 invalid pull policy。
- `./install.sh --image base-portal:v0.1.1 --skip-dns --skip-nginx`：退出码 `1`，拒绝本地占位镜像作为生产输入。

- [x] **Step 2: verify favicon in browser or built artifact**

Result: `apps/portal-web/dist/favicon.svg` exists after `pnpm build`, and `dist/index.html` includes `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.

### Task 5: Ship and deploy

- [ ] **Step 1: commit and push v0.1.1**

Expected:

- `main` is pushed to `origin/main`.
- `v0.1.1` tag exists and points to the release commit.
- GitHub release `v0.1.1` exists.

- [ ] **Step 2: build/load production image and run upgrade**

Expected:

- 92 server has `base-portal-release:v0.1.1`.
- `./upgrade.sh --from v0.1.0 --to v0.1.1 --image base-portal-release:v0.1.1 --pull never` completes.
- Remote `.deploy/version` reads `v0.1.1`.

- [ ] **Step 3: verify production**

Expected:

- `https://base-portal.riversoft.com.cn/health` returns 200.
- `https://base-portal.riversoft.com.cn/ready` returns 200.
- `https://base-portal.riversoft.com.cn/version` reports version `0.1.1` and the release commit.
- Browser smoke confirms login page renders and favicon error is gone.

## 15-Step my-harness Ledger

| Step | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Discovery / Brainstorm | complete | User accepted default v0.1.1 production hardening scope |
| 2 | Product/design planning review | skipped | No UI workflow change; favicon only |
| 3 | Design artifact / visual target | skipped | Existing `DESIGN.md` remains source of truth |
| 4 | Design review | skipped | No visual layout change |
| 5 | Eng review | complete | Scope decisions in this plan |
| 6 | Writing plan | complete | `IMPLEMENTATION_PLAN.md` |
| 7 | Executing plan | complete | Deployment hardening edits |
| 8 | Verification before completion | complete | Local command evidence above |
| 9 | Browser verification | in_progress | Built favicon artifact verified; production browser smoke pending |
| 10 | Visual QA | skipped | No visual layout change |
| 11 | Functional QA | pending | Health/version/API smoke |
| 12 | Review | pending | Diff review before ship |
| 13 | Git closeout | pending | `git status`, staged diff |
| 14 | Ship | pending | Commit, tag, GitHub release |
| 15 | Land and deploy | pending | Production upgrade and health checks |
