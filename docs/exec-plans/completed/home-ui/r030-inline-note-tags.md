# r030-inline-note-tags 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r030-inline-note-tags.md`

设计文档：`docs/design-docs/home-ui/r030-inline-note-tags.md`

## Stage 1：布局实现

- [completed] 调整 NoteCard 与 Markdown 首段的展示结构，让 tag 和正文首段流式同行。
- [completed] 保持后续 Markdown 块、折叠逻辑和编辑器行为不变。

验证：检查 tag、正文首段和多段 Markdown 的 DOM 语义，并运行首页组件测试。

## Stage 2：回归验证与提交

- [completed] 运行相关测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。

验证：`npm test -- --run src/pages/home/HomePage.test.tsx` 与 `npm run build` 通过。
