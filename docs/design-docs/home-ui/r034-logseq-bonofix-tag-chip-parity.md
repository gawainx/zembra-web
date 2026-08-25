# r034-logseq-bonofix-tag-chip-parity 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r034-logseq-bonofix-tag-chip-parity.md`

## 源码依据

Bonofix 的 `package.json` 声明目标 Logseq v0.10.7。该版本的 core `a.tag` 使用 `inline-block`，Bonofix 覆盖其 padding、margin、圆角、背景和文字颜色，并通过 opacity 生成最终视觉色。此前误将 Logseq master 的 tag 控件模型应用到本项目，现已删除。

| 来源 | 规则 |
| --- | --- |
| Logseq v0.10.7 `common.css` | `inline-block`、零边框和 `opacity: var(--ls-tag-text-opacity)`。 |
| Logseq `common.css` | 正文基础行高 `1.5`。 |
| Bonofix `theme.scss` | `padding: 0 7px`、`margin: 2px 0`、`border-radius: 1em`。 |
| Bonofix v0.10.7 最终视觉色 | 亮色 `#7CB4F4` 来自 `#2582EC × .6`；暗色 `#2C71AA` 来自 `#2F82C6 × .83`。 |

## 实现

在 `src/styles/main.css` 中以 `--color-tag-background` 和 `--color-tag-text` 承载 tag 专用色彩。背景 token 采用 Bonofix opacity 与背景合成后的最终颜色，避免 Zembra 的亮暗表面色与 Logseq 不同而产生二次色偏。共享 chip 规则只保留 v0.10.7 Logseq 与 Bonofix 的已核对属性，不保留 Logseq master 的 inline-flex 链路、全局 accent 或额外兜底。`NoteCard` 的展示正文改为 `leading-6`，使其与 Logseq 1.5 行高一致。
