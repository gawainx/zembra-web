# r036-theme-palette-token-system 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r036-theme-palette-token-system.md`

设计文档：`docs/design-docs/home-ui/r036-theme-palette-token-system.md`

## Stage 1：完整主题 token 分层

- [completed] 在亮暗主题中建立 palette token，并将全部语义颜色映射到 palette。
- [completed] 移除组件内物理颜色路径并补充全局设计约束。

验证：组件只消费 `--color-*`，主题颜色只在 palette 层定义。

## Stage 2：回归验证与提交

- [completed] 运行首页和设置组件测试与生产构建。
- [completed] 核对 diff，暂存并提交本需求改动。
