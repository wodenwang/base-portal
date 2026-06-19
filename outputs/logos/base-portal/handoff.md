# Base Portal Logo Handoff

选中方向：`入口门廊`

用途：Base Portal 顶部 28px 产品 mark、登录页品牌标识、后续 favicon。

保留：

- 深色抽象门户外框。
- 青绿色入口/地面几何面。
- 小尺寸清晰可辨。
- `Base Portal` 文本由前端排版负责，不使用生成图中的文字。

已落地：

- `apps/portal-web/src/App.tsx` 中新增 `BrandMark` SVG 组件。
- `apps/portal-web/src/styles.css` 中定义 28px 和登录页大尺寸样式。

注意：

- 当前为产品 UI 内可维护 SVG mark，不等同于已完成商标检索或完整品牌资产包。
- 后续正式发布前可再导出 favicon、PNG 多尺寸和独立 SVG 文件。
