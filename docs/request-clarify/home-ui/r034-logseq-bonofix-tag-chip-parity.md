# r034-logseq-bonofix-tag-chip-parity 需求澄清

日期：2026-08-25

## 需求背景

此前的 tag chip 直接套用 Bonofix 的局部尺寸值，却保留了项目中不匹配的控件类型、行高和 accent token，造成 chip 过高且色彩偏移。

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 控件结构 | 复刻 Logseq core tag 的 `inline-flex`、垂直居中与文字居中。 |
| 行高 | 卡片正文使用 Logseq 的 `1.5` 行高，移除原来的 `leading-7`。 |
| Bonofix 规则 | 保留 `padding: 0 7px`、`margin: 2px 0`、`border-radius: 1em`。 |
| 边框 | 明确为零边框。 |
| 色彩 | tag 使用独立的 Logseq 默认亮/暗 accent token，不复用项目通用 accent。 |
| 清理 | 删除已有 `inline-block`、白字和任何兼容或兜底样式。 |

## 验收标准

| 场景 | 期望 |
| --- | --- |
| 卡片正文 tag | 以 1.5 行高参与文本流，不产生额外高行盒。 |
| 编辑态 tag | 与卡片一致地使用 inline-flex 和 Bonofix 尺寸。 |
| 主题切换 | 亮色与暗色 tag 颜色使用各自的独立 token。 |
