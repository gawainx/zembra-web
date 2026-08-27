# r043-normalize-editor-escaped-link-delimiters 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r043-normalize-editor-escaped-link-delimiters.md`

## 方案

在既有 `normalizeMarkdownSource()` 中增加一个受限替换，位于标签和嵌套链接规整之间：仅将链接标题边界的反斜杠去除，且仅在圆括号内是完整 HTTP 或 HTTPS URL 时生效。继续复用现有的 NoteCard 展示和 `LiveMarkdownEditor` 编辑草稿调用点，不新增状态、组件或依赖。

## 验证

工具函数测试使用 Chrome 直接观察到的完整字符串，验证标准链接输出；现有 HomePage 测试继续覆盖卡片链接语义；已登录 Chrome 页面复查卡片和双击编辑内容。
