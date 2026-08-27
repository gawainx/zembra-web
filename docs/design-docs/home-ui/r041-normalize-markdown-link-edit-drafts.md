# r041-normalize-markdown-link-edit-drafts 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r041-normalize-markdown-link-edit-drafts.md`

## 方案

复用 r040 的 `normalizeMarkdownSource()`。`HomePage` 在创建编辑草稿时先规整 `note.content`，确保提交链路直接使用标准字符串；`LiveMarkdownEditor` 同步外部值时比较并写入规整后的值，避免 effect 用原始值覆盖已规整的编辑器文档。

不新增状态、组件、依赖或 API。测试使用用户提供的完整字符串，同时验证展示态标题链接与双击后的编辑器 Markdown。
