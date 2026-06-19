# 基础门户项目治理说明

本项目是第三方应用「基础门户」（`base-portal`），接入 Feishu IAM 完成登录、用户信息获取和权限点读取。所有开发、测试和部署动作必须遵守本文件约定。

## 设计规范

- 项目级 UI/UX 规则见 `DESIGN.md`。
- 设计制品、视觉目标、截图和设计说明统一放在 `design/`。
- 当前前端设计基线为 `shadcn/ui + Tailwind CSS + Radix primitives + lucide-react`，门户视觉方向为紧凑的运营工作台感。
- 如果使用 Product Design 生成视觉目标或 `design-qa.md`，对应图片、链接或说明也必须记录到 `design/`；未安装或未使用 Product Design 时，使用 `DESIGN.md`、已有视觉目标、截图或必要时 Pencil 协同制品继续推进。
- 开始前端实现前，必须先检查 `DESIGN.md` 和 `design/`。
- 已确认视觉目标或设计说明优先于临场自由重设计；如需偏离，先说明原因并获得确认。

## 部署与升级规范

- 项目级部署和升级规则见 `DEPLOY.md`。
- 项目开发过程中和最终部署过程中，必须严格执行 `DEPLOY.md`。
- 修改 `Dockerfile`、`docker-compose*.yml`、`install.sh`、`upgrade.sh`、`.env.example`、数据库 schema、Prisma migration、初始化 SQL、迁移 SQL、release 版本或部署目录前，必须先检查 `DEPLOY.md`。
- 如果项目缺少 `install.sh` 或 `upgrade.sh`，必须先补齐对应脚本，不能把手工部署步骤当作完成状态。
- 每次版本升级和发布前，必须校验 `install.sh` 和 `upgrade.sh` 的逻辑。
- 正式部署以版本为最小管理颗粒度；不得使用 `latest`、未固定镜像 tag 或任意脏状态升级。
- 如实现需要偏离 `DEPLOY.md`，先更新 `DEPLOY.md` 并说明原因，再修改实现。

## Feishu IAM 接入信息

- `FEISHU_IAM_URL=https://feishu-iam.riversoft.com.cn`
- `app_key=base-portal`
- `client_id=bic_0b6cfcd9f4fa4cef8f6cfb96b8d86874`
- `client_secret` 必须通过本地或部署环境变量提供，不得写入仓库。
- `developer_api_token` 必须在 Feishu IAM 中轮换开发者 API 凭证后，通过本地或部署环境变量提供，不得写入仓库。

建议环境变量名：

- `FEISHU_IAM_URL`
- `FEISHU_IAM_APP_KEY`
- `FEISHU_IAM_CLIENT_ID`
- `FEISHU_IAM_CLIENT_SECRET`
- `FEISHU_IAM_DEVELOPER_API_TOKEN`

## OAuth 回调地址

回调地址必须与 Feishu IAM 登记值完全一致：

- `https://base-portal.riversoft.com.cn`

实现 OAuth 时不得对 `redirect_uri` 做宽松兼容。`http` 地址必须按 `http` 登记，`https` 地址必须按 `https` 登记。

## OAuth 登录和权限 API

1. 浏览器跳转到 `https://feishu-iam.riversoft.com.cn/oauth/authorize`，携带 `response_type=code`、`client_id`、`redirect_uri`、`state`、`scope`。
2. 第三方后端在回调地址收到 `code` 后，调用 `https://feishu-iam.riversoft.com.cn/oauth/token` 换取 access token。
3. 使用 access token 调用 `https://feishu-iam.riversoft.com.cn/oauth/userinfo` 获取用户信息。
4. 使用 access token 调用 `https://feishu-iam.riversoft.com.cn/api/v1/apps/base-portal/me/permissions` 获取权限组和权限点。

## 开发者 API 权限边界

开发者 API 使用：

- `Authorization: Bearer <developer_api_token>`

开发者 API 只能维护本应用的权限点、权限组和权限组权限点绑定。不得通过开发者 API 修改应用配置、回调地址、登录凭证、角色授权或管理员授权。

权限点 key 必须以 `base-portal.` 开头。

相关接口：

- 权限点接口：`https://feishu-iam.riversoft.com.cn/api/v1/developer/apps/base-portal/permission-points`
- 权限组接口：`https://feishu-iam.riversoft.com.cn/api/v1/developer/apps/base-portal/permission-groups`
- 权限组绑定接口：`https://feishu-iam.riversoft.com.cn/api/v1/developer/apps/base-portal/permission-groups/{group_id}/points`

## 安全要求

- 不要把 `client_secret`、`developer_api_token`、authorization code、access token、cookie 或密码写入仓库、日志、截图、聊天消息、测试快照或会话归档。
- 不要在前端代码中保存 `client_secret` 或 `developer_api_token`。
- OAuth code 换 token、developer API 调用等敏感动作只能在后端或受控运维环境中执行。
- 仓库只能提交 `.env.example` 等无敏感值示例文件；本地真实配置必须放入被 `.gitignore` 忽略的环境文件。

## 验收 Checklist

- 可以完成 Feishu IAM 登录并回到登记的 `redirect_uri`。
- 后端可以用 `code` 换取 access token。
- 可以读取 `/oauth/userinfo`。
- 可以读取 `/api/v1/apps/base-portal/me/permissions`。
- 可以用开发者 API 创建或更新本应用权限点和权限组。
