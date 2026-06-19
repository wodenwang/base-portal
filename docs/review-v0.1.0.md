# Base Portal v0.1.0 落地前审查

日期：2026-06-19

## 范围

- 前端重构 diff。
- GitHub issues #1-#5 对应行为。
- Docker Compose、`install.sh`、`upgrade.sh`。
- 远端 bootstrap、DNS、nginx 和 TLS 状态。

## 发现与处理

### P2: DomainNav 外部点击处理可能在非 HTMLElement target 上报错

文件：`apps/portal-web/src/App.tsx`

`DomainNav` 的 `pointerdown` 处理曾直接把 `event.target` 断言为 `HTMLElement` 并调用 `closest()`。这与 `UserMenu` 和 tab context menu 已修复的防护模式不一致，在少数事件目标类型下可能造成 console runtime error。

处理：已改为 `target instanceof HTMLElement` 后再调用 `closest()`。

验证：

```bash
pnpm --filter @base-portal/portal-web test
pnpm --filter @base-portal/portal-web typecheck
pnpm --filter @base-portal/portal-web lint
pnpm --filter @base-portal/portal-web build
```

结果：全部通过。

## 残余风险

- 生产服务尚未启动，因为远端 `deploy/.env` 仍是模板配置。
- 生产 smoke 尚未通过，`https://base-portal.riversoft.com.cn/health` 当前 TLS 正常但返回 `502`。
- 已创建本地 Git commit `git rev-parse HEAD`；尚未 push、tag、创建 GitHub release 或 PR。

## 结论

本地实现和远端 bootstrap 可进入 `/ship` preflight，但不能声明 v0.1.0 已完整交付。下一步必须先补齐远端生产 `.env`，再执行生产安装和 smoke。
