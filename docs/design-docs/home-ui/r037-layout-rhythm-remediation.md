# r037-layout-rhythm-remediation 设计

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r037-layout-rhythm-remediation.md`

## 设计决策

在 `src/styles/main.css` 增加共享的布局 token：间距、圆角、控件高度和表面边框。token 采用语义命名，组件只消费 `--space-*`、`--radius-*`、`--control-height-*` 与现有 `--color-*`，不再写入任意物理尺寸或用阴影模拟边框。

页面级容器只通过 gap 分隔区域；列表、表单和工具栏只通过 gap 分隔子项；表面只设置一次 border、background、radius 和 padding；表面内部区块改用局部布局容器的 gap。Markdown 在自身根节点建立内容流，统一归零首尾块级 margin，并以相邻块的 margin 控制 prose 节奏，避免将外边距传递给 card。

note card 流使用比 card 圆角更有辨识度的列表间距，卡片降低纵向 padding，元信息、正文和展开动作由单个内容栈控制。选中导航项改为强调背景与文字，不再叠加 inset border。搜索框、主题按钮、语言菜单等控件统一使用真实边框，不再以 inset shadow 承担轮廓。

## 不变项

不改变数据模型、Markdown 存储格式、API、交互入口、主题配色和 tag chip 的 Logseq/Bonofix 视觉规则。测试继续验证用户可观察行为和语义，不绑定具体视觉数值。
