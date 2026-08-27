# r040-normalize-escaped-markdown-links 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r040-normalize-escaped-markdown-links.md`

## 方案

将 `liveMarkdownEditorUtils.ts` 中仅由编辑器使用的 `normalizeEditorMarkdown()` 扩展并重命名为 `normalizeMarkdownSource()`。它继续处理 tag 转义和不间断空格，同时只在内层显示 URL 与目标 URL 一致时，将异常链接规整为标准 Markdown。

`LiveMarkdownEditor` 在草稿回写前调用该函数，`NoteMarkdownContent` 在传给 `ReactMarkdown` 前调用同一个函数。两个调用方共享同一条纯函数规则，既能立即修复已保存笔记的显示，也能让后续编辑保存标准内容，无需新增状态、组件、依赖或 API。

## 验证策略

为纯函数增加异常链接和保护性非匹配测试；为 NoteCard 增加用户可观察的链接文字、目标 URL 和语义链接测试。运行对应测试、全量测试和生产构建。
