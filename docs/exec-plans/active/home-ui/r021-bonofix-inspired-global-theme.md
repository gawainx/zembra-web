# r021 Bonofix 启发的全局主题执行计划

日期：2026-08-23

需求澄清文档：[r021 Bonofix 启发的全局主题需求澄清](../../../request-clarify/home-ui/r021-bonofix-inspired-global-theme.md)。

设计文档：[r021 Bonofix 启发的全局主题设计](../../../design-docs/home-ui/r021-bonofix-inspired-global-theme.md)。

## Stage 1：共享主题基础

- [已完成] 在 `src/styles/main.css` 加载 IBM Plex Sans，替换明暗主题语义 token，更新 Markdown 引用、代码和圆形任务复选框样式。
- [已完成] 验证：主题和首页相关测试通过，生产构建通过。

## Stage 2：首页写作区一致性

- [已完成] 将 `NoteCard` 展示态 tag 更新为与编辑器内 tag 一致的强调蓝实心胶囊。
- [已完成] 验证：笔记卡片、编辑器和首页测试通过，tag 文本、编辑与筛选行为保持不变。

## Stage 3：收尾验证

- [已完成] 复核明亮和暗色主题下的首页、侧栏、设置页与弹窗共享 token，旧青绿色和冷灰主题值已不再出现在 `src` 中。
- [已完成] 已更新本计划任务状态；完整测试通过，生产构建通过。

## 提交策略

Stage 1 和 Stage 2 产生代码修改后各自独立提交。Stage 3 只在产生额外修改时提交；计划保持在 `active`，直到用户完成验收。
