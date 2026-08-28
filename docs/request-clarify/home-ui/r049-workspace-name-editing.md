# R049 Workspace 名称修改

## Supabase 能力调查

Supabase JavaScript Data API 支持对单行执行带筛选条件的 `update()`。当前共享 schema 的 `workspaces.workspace_name` 字段允许 `null` 或去除首尾空白后非空的字符串；`workspace_members` 中角色为 `manager` 的已登录用户已经拥有 `workspaces` 的 `UPDATE` grant 和对应 RLS policy，因此可以在浏览器中使用 publishable key 安全更新其有管理权限的 workspace。

更新请求应同时按 `id` 筛选，并显式写入 `updated_at`，因为当前 schema 没有自动维护该字段的 trigger。请求完成后应返回 `id` 与 `workspace_name`，用于立即更新当前 UI 和浏览器标题。

## 当前边界

Supabase 直连路径具备实现条件。Backend 数据源目前只有 workspace 读取和选择契约，前端没有发现可复用的 workspace 改名 endpoint；是否同时支持 Backend 模式，需要由需求确认后再查证后端 OpenAPI 或文档。

## 待确认项

本次功能是否只支持 Supabase 数据源，还是需要同时新增 Backend workspace 改名接口支持。
