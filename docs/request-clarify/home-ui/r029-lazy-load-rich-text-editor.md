# r029-lazy-load-rich-text-editor 需求澄清

日期：2026-08-24

## 目标

首页首包不再包含 Tiptap 和 ProseMirror。保留现有 Markdown 编辑能力、创建和编辑流程、工具栏、tag suggestion 与 Markdown 字符串契约，在渲染 `NoteEditor` 时再按需加载富文本编辑器模块。

## 已确认决策

| 项目 | 决策 |
| --- | --- |
| 分包方式 | 使用 React `lazy()` 和 `Suspense` 加载现有 `LiveMarkdownEditor`。 |
| 加载时机 | `NoteEditor` 渲染时请求编辑器块。 |
| 加载反馈 | 编辑器区域保留稳定高度，并以低干扰加载文案提示。 |
| CDN | 继续使用 Vercel 自动托管和缓存带 hash 的静态资源，不引入额外 CDN。 |
| 数据契约 | 不改动 note、tag、field、Supabase 或 backend 数据访问。 |

## 验收标准

| 编号 | 标准 |
| --- | --- |
| A1 | Vite 构建产物中，Tiptap 编辑器与首页入口分别生成独立 JavaScript 文件。 |
| A2 | 编辑器块加载期间显示可访问的加载状态，且 composer 外壳不塌陷。 |
| A3 | 编辑器加载完成后，创建和编辑笔记、工具栏和 tag suggestion 行为保持可用。 |
| A4 | `npm run test` 和 `npm run build` 通过。 |
