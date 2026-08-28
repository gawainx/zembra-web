# R049 Workspace 名称修改

## Supabase 能力调查

Supabase JavaScript Data API 支持对单行执行带筛选条件的 `update()`。当前共享 schema 的 `workspaces.workspace_name` 字段允许 `null` 或去除首尾空白后非空的字符串；`workspace_members` 中角色为 `manager` 的已登录用户已经拥有 `workspaces` 的 `UPDATE` grant 和对应 RLS policy，因此可以在浏览器中使用 publishable key 安全更新其有管理权限的 workspace。

更新请求应同时按 `id` 筛选，并显式写入 `updated_at`，因为当前 schema 没有自动维护该字段的 trigger。请求完成后应返回 `id` 与 `workspace_name`，用于立即更新当前 UI 和浏览器标题。

## 当前边界

本次只支持 Supabase 直连路径。Backend 数据源目前只有 workspace 读取和选择契约，不新增或推断 Backend workspace 改名接口。

## 交互与校验

workspace 名称右侧的下拉箭头旁展示修改图标。点击后名称进入输入态并全选现有内容；Enter 或失焦提交。名称为空或仅包含空白字符时禁止提交并保持编辑态。更新成功后同步 workspace 下拉展示和浏览器标题。
