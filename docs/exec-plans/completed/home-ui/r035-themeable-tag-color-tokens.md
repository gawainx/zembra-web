# r035-themeable-tag-color-tokens 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r035-themeable-tag-color-tokens.md`

设计文档：`docs/design-docs/home-ui/r035-themeable-tag-color-tokens.md`

## Stage 1：语义 token 分层

- [completed] 将 tag chip 的原始 pigment 与最终语义背景拆分为主题 token。
- [completed] 将 token 使用约束写入全局设计规则。

验证：组件选择器不出现物理色值或通用 accent token。

## Stage 2：回归验证与提交

- [completed] 运行首页组件测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。
