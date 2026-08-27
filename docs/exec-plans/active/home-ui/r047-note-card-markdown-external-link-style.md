# R047 笔记卡片 Markdown 外链样式执行计划

## 关联文档

需求澄清：[r047-note-card-markdown-external-link-style.md](../../../request-clarify/home-ui/r047-note-card-markdown-external-link-style.md)。技术设计：[r047-note-card-markdown-external-link-style.md](../../../design-docs/home-ui/r047-note-card-markdown-external-link-style.md)。

## Stage 1：外链展示样式与回归验证

- [ ] Task 1：在 `NoteMarkdownContent` 的标准 Markdown 外链 renderer 上复用 `--color-field` 并添加下划线，保留现有 `target` 与 `rel` 行为。
- [ ] Task 2：补充外链装饰的语义测试，确认内部笔记预览和标签 chip 仍走各自既有分支。
- [ ] Task 3：运行相关测试与生产构建，核对亮暗主题均通过 `--color-field` 获得正确颜色。
