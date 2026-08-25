# r031-inline-tag-positions 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r031-inline-tag-positions.md`

设计文档：`docs/design-docs/home-ui/r031-inline-tag-positions.md`

## Stage 1：内联渲染

- [completed] 调整 NoteCard，保留正文内的 tag marker。
- [completed] 在展示态 Markdown 转换链路中将 tag marker 渲染为 chip。
- [completed] 调整编辑态 chip 的内联换行行为。

验证：tag、前后正文和 note 双链能在同一段落中正确渲染。

## Stage 2：回归验证与提交

- [completed] 运行首页组件测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。

验证：`npm test -- --run src/pages/home/HomePage.test.tsx` 与 `npm run build` 通过。
