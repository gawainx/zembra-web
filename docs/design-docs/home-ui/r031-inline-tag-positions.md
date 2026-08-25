# r031-inline-tag-positions 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r031-inline-tag-positions.md`

## 方案

复用 `NoteMarkdownContent` 的 Markdown AST 文本节点转换链路：在保持现有 note 双链转换的同时，把符合既有 tag 解析规则的 `#tag` 转换为内部 tag 节点，再由 Markdown 组件映射为行内 chip。这样无需新增 parser、状态或数据接口。

| 文件 | 改动 | 原因 |
| --- | --- | --- |
| `src/pages/home/NoteCard.tsx` | 停止移除 tag marker 与首行集中渲染。 | 保留 tag 的原始文本位置。 |
| `src/pages/home/NoteMarkdownContent.tsx` | 将正文 tag 转为内联 chip。 | 复用现有 Markdown 与 note 双链渲染链路。 |
| `src/styles/main.css` | 定义展示态和编辑态的内联 chip 行为。 | 确保 chip 整体不换行，文本继续自然流动。 |
| `src/pages/home/HomePage.test.tsx` | 验证 chip 和对应正文位于同一段落。 | 覆盖位置语义，不绑定静态样式。 |

## 边界

不改变 tag 的保存格式、解析逻辑、候选菜单、筛选、编辑器文档模型或 API。Markdown 标题、链接、双链和其他 GFM 结构继续由现有 renderer 负责。
