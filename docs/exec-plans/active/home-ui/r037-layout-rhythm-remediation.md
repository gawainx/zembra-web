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
- [completed] 将撑高 header 的右侧操作区移出文档流，点击命中区域以图标尺寸和单侧 `--icon-hit-inset` token 计算，令正文按时间轴 label 的实际行高开始排版。
- [completed] 将首页帮助与同步、设置入口与关闭、编辑器工具栏、侧栏删除、主题切换和后端刷新等纯图标控件统一为 `--icon-hit-size`。
- [completed] 移除首页大屏 sidebar 与正文列之间的固定 `lg:gap-16`，统一使用 `--space-4`。
- [completed] 将固定 composer 的遮罩层与输入框网格同步为正文列的 `--space-4`，消除横向漂移。
- [completed] 将首页双列的固定宽度替换为共享 `minmax()` 网格，并以 layout token 声明各 panel 的最小和最大宽度。

验证：`git diff --check`、首页组件测试与 `npm run build` 通过。
