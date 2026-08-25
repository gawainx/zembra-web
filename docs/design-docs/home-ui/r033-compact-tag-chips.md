# r033-compact-tag-chips 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r033-compact-tag-chips.md`

## 方案

将 `.note-tag-chip` 与 `.live-markdown-editor-content .editor-tag-chip` 的视觉属性合并到 `src/styles/main.css` 的一条共享规则。该规则直接复用已下载的 Bonofix 主题 `source/theme.scss` 中 `.content a.tag` 的尺寸值，不再自行设定字号、字重、行高或基线偏移。

后续调试只需调整同一规则的以下属性：

| 属性 | 初始值 | 作用 |
| --- | --- | --- |
| `padding` | `0 7px` | Bonofix 的零纵向、7px 横向留白。 |
| `border-radius` | `1em` | Bonofix 的圆角。 |
| `margin` | `2px 0` | Bonofix 的垂直外边距。 |

主题源码下载位置：`/private/tmp/logseq-bonofix-theme/source/theme.scss` 第 287 至 295 行。

不增加固定高度，避免不同字体、缩放比例和语言下产生裁切。
