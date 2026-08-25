# r036-theme-palette-token-system 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r036-theme-palette-token-system.md`

## Token 架构

```text
亮暗主题 palette（--palette-*）
        ↓
语义角色（--color-*）
        ↓
组件与 Markdown 样式
```

`--palette-*` 承载 Logseq 与 Bonofix 已校准的物理值；`--color-*` 仅表达 app background、surface、text、border、accent、field、error、warning、success、code、quote、tag、overlay、shadow 与 control thumb 等角色。组件不感知 palette 名称，也不自行混色。

未来主题只覆写同一 palette 区。语义映射和组件选择器保持稳定，避免主题扩展时散落地改动组件。
