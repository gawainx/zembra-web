# r044-note-reference-uuid-syntax 需求澄清

日期：2026-08-27

## 需求背景

用户点击首页 note card 的 Mention 后，编辑器会插入当前笔记的完整 `note.id`。已观察到该值为 `db4b2d02-fdfa-4915-8bfe-edfe685f54d11`。现有双链解析和 Markdown 展示仅识别 32 位无连字符十六进制字符串，导致 Mention 生成的引用不能被自身解析、提交为 `note_links` 关系或渲染为短 ID。共享契约将 `notes.id` 定义为文本，不应由前端把它猜测为某个 UUID 格式。

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 引用语法 | 接受 `[[...]]` 内不含空白或方括号的完整 note ID。 |
| Mention 契约 | Mention 继续原样插入 `note.id`，不转换或截断。 |
| 一致性 | 创建、编辑提交与 Markdown 展示使用同一双链格式规则。 |
| 数据源边界 | 本次不调整 Supabase、Backend、浏览器缓存或数据表契约。 |

## 验收标准

| 输入或动作 | 期望 |
| --- | --- |
| Mention 插入带连字符 UUID | 创建或编辑提交时生成目标 ID 相同的 links 请求项。 |
| 卡片正文包含带连字符 UUID 双链 | 显示 6 位短 ID，并可沿用现有 hover 预览。 |
| 既有 32 位无连字符 UUID 双链 | 保持可解析和可展示。 |
