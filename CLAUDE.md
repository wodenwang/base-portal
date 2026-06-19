# 基础门户 Claude 项目规范

本项目的主要治理文件是 `AGENTS.md`。Claude Code 或其他工程代理进入本仓库后，必须先读取并遵守 `AGENTS.md`。

## 部署与升级规范

- 项目级部署和升级规则见 `DEPLOY.md`。
- 项目开发过程中和最终部署过程中，必须严格执行 `DEPLOY.md`。
- 修改 `Dockerfile`、`docker-compose*.yml`、`install.sh`、`upgrade.sh`、`.env.example`、数据库 schema、Prisma migration、初始化 SQL、迁移 SQL、release 版本或部署目录前，必须先检查 `DEPLOY.md`。
- 如果项目缺少 `install.sh` 或 `upgrade.sh`，必须先补齐对应脚本，不能把手工部署步骤当作完成状态。
- 每次版本升级和发布前，必须校验 `install.sh` 和 `upgrade.sh` 的逻辑。
- 正式部署以版本为最小管理颗粒度；不得使用 `latest`、未固定镜像 tag 或任意脏状态升级。
- 如实现需要偏离 `DEPLOY.md`，先更新 `DEPLOY.md` 并说明原因，再修改实现。
