# r043-normalize-editor-escaped-link-delimiters 需求澄清

日期：2026-08-27

## 需求背景

用户在已登录的 Chrome 页面复现同一问题，排除浏览器和登录态差异。直接读取该笔记的编辑器值，确认其实际内容为 `#cuda \\[标题\\](https://github.com/…)`：URL 已正确，链接标题两侧的方括号被编辑器 Markdown 序列化转义。展示层因此把标题显示为普通文本，只把 URL 识别为链接。

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 识别范围 | 仅匹配 `\\[标题\\](https://URL)`，其中目标必须是完整 HTTP 或 HTTPS URL。 |
| 修复结果 | 规整为 `[标题](https://URL)`。 |
| 保护范围 | 其他转义方括号和非 HTTP(S) 目标保持原样。 |
| 应用范围 | 既有 `normalizeMarkdownSource()` 同时服务卡片展示和编辑草稿。 |

## 验收标准

| 输入 | 期望 |
| --- | --- |
| `\\[标题\\](https://github.com/org/repo)` | 卡片显示“标题”作为链接文字，双击编辑显示标准 Markdown。 |
| `\\[普通文本\\](relative/path)` | 保留原文。 |
