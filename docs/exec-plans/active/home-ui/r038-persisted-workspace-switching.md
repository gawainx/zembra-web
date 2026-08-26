# r038-persisted-workspace-switching 执行计划

日期：2026-08-26

需求澄清文档：`docs/request-clarify/home-ui/r038-persisted-workspace-switching.md`

设计文档：`docs/design-docs/home-ui/r038-persisted-workspace-switching.md`

## Stage 1：激活与持久化

- [completed] 建立共享 workspace context，并复用两种数据源的既有激活链路。
- [completed] 为 Supabase 增加独立 workspace 持久化并实现两种数据源的有效选择自动进入。

验证：覆盖保存、恢复、无效选择与首次选择的门禁行为。

## Stage 2：首页切换

- [completed] 将顶部数据源 badge 替换为当前 workspace 下拉框。
- [completed] 切换后重新加载首页数据并更新持久化选择。
- [completed] 移除顶部 workspace 下拉框的独立表面背景和常态边框，键盘聚焦时仅显示强调色 outline。
- [completed] 将品牌首字替换为 `ℤ`，并以文字宽度的 disclosure 菜单承载同层级 workspace 名称与切换符。

验证：覆盖 workspace 切换、数据重载与顶部当前项展示。

## Stage 3：验证与提交

- [completed] 运行相关测试、生产构建与 diff 检查，更新计划状态并提交。
