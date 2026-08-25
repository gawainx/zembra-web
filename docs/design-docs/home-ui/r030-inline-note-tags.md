# r030-inline-note-tags 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r030-inline-note-tags.md`

## 方案

复用 `NoteCard`、`NoteMarkdownContent` 和现有 tag chip 样式，不增加组件、数据层接口或依赖。

`NoteCard` 在展示态将 tag chip 与 `NoteMarkdownContent` 放进同一个流式容器；`NoteMarkdownContent` 新增一个仅供卡片使用的首段内联展示选项。该选项只把首个 Markdown 段落参与 tag 后的同一行排版，后续 Markdown 块仍保留块级语义与当前样式。

| 文件 | 改动 | 原因 |
| --- | --- | --- |
| `src/pages/home/NoteCard.tsx` | 将 tag 列表从块级 flex 容器改为与正文共用的流式容器。 | 消除强制换行的结构根因。 |
| `src/pages/home/NoteMarkdownContent.tsx` | 支持卡片传入首段内联展示选项。 | 复用现有 Markdown 渲染链路，不影响其他调用方。 |
| `src/styles/main.css` | 为该选项定义局部布局规则。 | 保持普通正文与 tag 同行，同时不改变后续 Markdown 块。 |
| `src/pages/home/HomePage.test.tsx` | 覆盖 tag 和正文位于同一展示容器。 | 验证用户可观察的内容组合关系，不断言具体视觉类名。 |

## 影响与边界

不改变 note 内容、API、标签解析、折叠逻辑、编辑器或全局 tag 视觉 token。样式规则同时适用于明亮与暗色主题，因为仍使用现有语义 token。
