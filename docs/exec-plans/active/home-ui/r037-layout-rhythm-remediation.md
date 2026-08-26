# r037-layout-rhythm-remediation 执行计划

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r037-layout-rhythm-remediation.md`

设计文档：`docs/design-docs/home-ui/r037-layout-rhythm-remediation.md`

## Stage 1：布局规则与首页表面

- [completed] 建立间距、圆角、控件和边框的语义 token，并写入设计约束。
- [completed] 整改首页 card 流、note card、Markdown、编辑器、搜索和侧栏的布局责任。

验证：检查首页与编辑器的 DOM 语义，运行首页组件测试与生产构建。

## Stage 2：设置、门禁与浮层

- [completed] 整改设置、登录与后端门禁、菜单和通知的表面与布局间距。
- [completed] 清除 inset border 和跨组件外边距链路。

验证：运行设置与应用组件测试、生产构建，并在亮暗主题检查主要界面。

## Stage 3：验收反馈收紧

- [completed] 根据验收截图将 note card 的头部与正文间距收紧为 `--space-1`，上下内边距收紧为 `--space-2`。

验证：`git diff --check`、首页组件测试与 `npm run build` 通过。
