# r033-compact-tag-chips 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r033-compact-tag-chips.md`

## 方案

将 `.note-tag-chip` 与 `.live-markdown-editor-content .editor-tag-chip` 的视觉属性合并到 `src/styles/main.css` 的一条共享规则。该规则显式定义字号、行高和内边距，取消纵向 padding，避免从各自容器继承出过高的垂直盒子。

后续调试只需调整同一规则的以下属性：

| 属性 | 初始值 | 作用 |
| --- | --- | --- |
| `font-size` | `0.82em` | 缩小 tag 字体。 |
| `line-height` | `1.15` | 直接控制 chip 的内容高度。 |
| `padding` | `0 0.32em` | 纵向为零，仅保留最小水平留白。 |
| `vertical-align` | `-0.05em` | 让 chip 与正文基线贴合。 |

不增加固定高度，避免不同字体、缩放比例和语言下产生裁切。
