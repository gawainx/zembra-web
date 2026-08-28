# R049 Workspace 名称修改设计

## 关联需求

需求澄清见 [r049-workspace-name-editing.md](../../request-clarify/home-ui/r049-workspace-name-editing.md)。

## 数据与权限

复用现有 `src/api/supabase.client.ts` 的浏览器 Supabase client，在其中增加局部更新函数，对 `workspaces` 执行带 `id` 筛选的 `update()`，写入去除首尾空白后的 `workspace_name` 与当前 Unix 时间 `updated_at`，并返回更新后的名称。该调用继续使用 publishable key 和既有 manager RLS，不引入 service role key、Backend API 或新依赖。

## UI 与状态

`WorkspaceSwitcher` 在提供改名回调时才展示修改图标，因此 Backend 模式保持现状。点击图标将名称替换为自动聚焦且全选的输入框；Enter 与失焦共用同一提交逻辑。空白名称停留在输入态，不发起请求。SupabaseEntry 保持 workspace 列表状态，并在更新成功后替换对应名称，让 context、下拉展示和浏览器标题由既有数据流同步刷新。

## 失败处理

请求失败时保留输入内容与编辑态并记录不含敏感信息的错误日志，用户可以修改后再次提交。单一调用点复用现有 client 和 WorkspaceProvider，不新增独立 service 或 repository。

## 验证策略

覆盖 Supabase client 的筛选更新与返回映射、空白名称不提交、Enter 和失焦提交，以及成功后 workspace 标题更新。执行相关 Vitest 用例和生产构建。
