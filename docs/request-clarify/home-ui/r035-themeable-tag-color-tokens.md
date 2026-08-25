# r035-themeable-tag-color-tokens 需求澄清

日期：2026-08-25

## 需求背景

tag chip 已按 Bonofix v0.10.7 复刻颜色。直接保存最终颜色会让未来主题只能复制粘贴色值，容易再次被通用 accent 或任意颜色覆盖。

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 分层 | 主题原始 pigment、语义 chip 背景和组件消费分离。 |
| 组件规则 | tag chip 组件只消费语义 token。 |
| 主题规则 | 每个主题只覆盖 pigment 和表面 token，语义背景自动计算。 |
| 范围 | 仅 tag chip 色彩 token 与设计规则；不新增主题切换 UI 或运行时状态。 |

## 验收标准

| 场景 | 期望 |
| --- | --- |
| 亮色 | 语义背景由 Logseq accent-10 pigment 与应用背景按 Bonofix 60% 合成。 |
| 暗色 | 语义背景由 accent-06 pigment 与应用背景按 Bonofix 83% 合成。 |
| 组件 | 展示态和编辑态不直接使用通用 accent 或任何物理颜色。 |
