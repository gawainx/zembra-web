# r034-logseq-bonofix-tag-chip-parity 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r034-logseq-bonofix-tag-chip-parity.md`

## 源码依据

Logseq core `a.tag` 使用 `inline-flex`、`items-center`、`text-center`、正文中 `font-size: initial` 与 `opacity: 1`。Bonofix 只追加零纵向的 `padding`、纵向 `margin`、`1em` 圆角和 tag 色彩。

| 来源 | 规则 |
| --- | --- |
| Logseq `common.css` | `inline-flex`、垂直居中、文字居中、零边框。 |
| Logseq `common.css` | 正文基础行高 `1.5`。 |
| Bonofix `theme.scss` | `padding: 0 7px`、`margin: 2px 0`、`border-radius: 1em`。 |
| Logseq default palette | 亮色 accent-10 为 `hsl(203 70% 38%)`；暗色使用 Bonofix 映射的 accent-06。 |

## 实现

在 `src/styles/main.css` 中以 `--color-tag-background` 和 `--color-tag-text` 承载 tag 专用色彩。共享 chip 规则只保留上述 Logseq 与 Bonofix 属性，不保留旧的 `inline-block`、全局 accent 或强制白字链路。`NoteCard` 的展示正文改为 `leading-6`，使其与 Logseq 1.5 行高一致。
