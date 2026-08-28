# R049 Workspace 名称修改执行计划

## 关联文档

需求澄清：[r049-workspace-name-editing.md](../../../request-clarify/home-ui/r049-workspace-name-editing.md)。技术设计：[r049-workspace-name-editing.md](../../../design-docs/home-ui/r049-workspace-name-editing.md)。

## Stage 1：Supabase 改名能力

- [ ] Task 1：在现有 Supabase client 中实现 manager RLS 下的 workspace 名称更新，并覆盖请求映射和失败传播。
- [ ] Task 2：从 SupabaseEntry 向 WorkspaceSwitcher 提供可选改名回调，更新成功后同步活动 workspace 状态和标题。
- [ ] Task 3：实现修改图标、全选输入、Enter/失焦提交和空白拦截；Backend 模式不展示入口。
- [ ] Task 4：运行相关测试和生产构建。
