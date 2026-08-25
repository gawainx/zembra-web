# r034-logseq-bonofix-tag-chip-parity 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r034-logseq-bonofix-tag-chip-parity.md`

设计文档：`docs/design-docs/home-ui/r034-logseq-bonofix-tag-chip-parity.md`

## Stage 1：清理错误样式链路

- [completed] 替换 chip 的控件布局、色彩 token 和卡片正文行高。

验证：共享规则仅包含 Logseq core 与 Bonofix 的已核对属性。

## Stage 2：回归验证与提交

- [completed] 运行首页组件测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。

## Stage 3：目标版本级联修正

- [completed] 按 Bonofix 目标 Logseq v0.10.7 的最终 opacity 合成色与 inline-block 控件模型替换错误链路。

验证：亮色使用 `#7CB4F4`，暗色使用 `#2C71AA`，不再依赖项目表面色参与 alpha 合成。
