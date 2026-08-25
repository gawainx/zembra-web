# r035-themeable-tag-color-tokens 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r035-themeable-tag-color-tokens.md`

## Token 层级

| 层级 | Token | 责任 |
| --- | --- | --- |
| 主题 pigment | `--color-tag-chip-pigment` | 记录当前主题的 Bonofix 原始 accent 色阶。 |
| 语义表面 | `--color-tag-chip-background` | 将 pigment 与 `--color-app-bg` 合成为最终 chip 背景。 |
| 语义文字 | `--color-tag-chip-text` | 定义 chip 前景色。 |
| 组件消费 | `.note-tag-chip`、`.editor-tag-chip` | 仅消费语义表面与文字 token。 |

亮色使用 accent-10 的 60% pigment，暗色使用 accent-06 的 83% pigment。`color-mix()` 在 token 层完成合成，因此新的主题只需覆写 pigment 和应用背景，不需要修改组件选择器。

不新增主题名称、设置入口或运行时分支；`ThemeProvider` 继续只负责现有亮暗 `data-theme`。
