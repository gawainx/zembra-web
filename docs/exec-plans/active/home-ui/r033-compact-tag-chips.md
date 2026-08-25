# r033-compact-tag-chips 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r033-compact-tag-chips.md`

设计文档：`docs/design-docs/home-ui/r033-compact-tag-chips.md`

## Stage 1：紧凑 chip 样式

- [completed] 合并编辑态和展示态 tag chip 的尺寸规则，并移除纵向留白。

验证：共享规则是唯一的尺寸调整入口，chip 不改变文本流与换行行为。

## Stage 2：回归验证与提交

- [completed] 运行首页组件测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。
