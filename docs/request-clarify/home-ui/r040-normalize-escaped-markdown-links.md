# r040-normalize-escaped-markdown-links 需求澄清

日期：2026-08-27

## 需求背景

部分外部来源的 Markdown 链接会以 `[标题]\([URL](URL))` 形式进入笔记：外层链接括号被转义，URL 又被嵌成内层链接。标准 GFM 将内层 URL 渲染为链接，外层标题保留为普通文本，导致 NoteCard 展示不符合用户预期。

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 识别范围 | 自动识别 `[标题]\([URL](URL))`，且内层显示 URL 与目标 URL 完全一致的异常结构。 |
| 修复结果 | 规整为标准 `[标题](URL)`。 |
| 既有笔记 | 卡片展示时立即规整，无需用户逐条编辑。 |
| 后续编辑 | 编辑器回写时使用同一规整逻辑，下一次提交保存标准 Markdown。 |
| 非目标文本 | 不改写普通 Markdown、不同显示文本的嵌套链接或其他未知转义形式。 |

## 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | 复用 Markdown 规整逻辑，供编辑器与 NoteCard 展示态共同调用。 |
| In Scope | 覆盖用户提供的异常链接与标准链接回归测试。 |
| Out of Scope | HTML 到 Markdown 的通用转换器。 |
| Out of Scope | 后端存储迁移或批量改写历史 note。 |

## 验收标准

| 输入 | 展示结果 |
| --- | --- |
| `[标题]\([https://example.com](https://example.com))` | 仅显示可点击的 `标题`，链接目标为 `https://example.com`。 |
| `[标题](https://example.com)` | 保持原有链接展示。 |
| `[标题]\([描述](https://example.com))` | 保留原始内容，不自动猜测意图。 |
