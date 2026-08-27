# r042-normalize-observed-nested-link 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r042-normalize-observed-nested-link.md`

## 方案

扩展既有 `normalizeMarkdownSource()` 的受限链接规则：允许标题后存在零个或多个反斜杠，并以嵌套链接的显示文本作为唯一可信的完整 HTTPS URL。只有内层目标等于该 URL 或其去掉协议后的版本时，才输出标准 `[标题](完整HTTPS URL)`。

该规则继续由 NoteCard 展示态和编辑草稿共同复用。测试直接采用 Safari 中观察到的完整输入，覆盖卡片显示和双击编辑。无需新增依赖、状态、组件或 API。
