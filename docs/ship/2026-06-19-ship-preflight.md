# 2026-06-19 Ship Preflight

## 范围

本次收口范围是 Base Portal 首个可运行 vertical slice，并保留本地 Docker Compose 环境供测试。

## 已完成

- GitHub 公共仓库已创建：https://github.com/wodenwang/base-portal
- 设计 spec、视觉目标、设计评审、工程评审和实现计划已落盘。
- 前后端 monorepo 已实现。
- Docker Compose 本地环境已启动并通过健康检查。
- 运行态问题已修复并重新验证。

## 验证

- `pnpm check`：通过。
- `pnpm build`：通过。
- `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build`：通过。
- `curl /health`、`curl /ready`：通过。
- 浏览器验证：mock 登录、菜单打开、iframe、immersive iframe、最大化、功能域切换确认、new tab、移动兜底截图均完成。

## 发布边界

- 本次会 push 到 GitHub 仓库。
- 不执行远端部署；当前没有远端运行环境，且用户已允许远端部署跳过。
- 本地 Docker Compose 服务保持运行，供用户访问 http://localhost:3000 测试。
