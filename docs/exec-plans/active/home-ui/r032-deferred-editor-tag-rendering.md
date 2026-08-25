# r032-deferred-editor-tag-rendering 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r032-deferred-editor-tag-rendering.md`

设计文档：`docs/design-docs/home-ui/r032-deferred-editor-tag-rendering.md`

## Stage 1：编辑器触发条件

- [completed] 收紧编辑器 tag decoration 的结束匹配条件。

验证：输入中的 tag 不显示 chip，输入结束空格后显示 chip。

## Stage 2：回归验证与提交

- [completed] 运行首页组件测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。
