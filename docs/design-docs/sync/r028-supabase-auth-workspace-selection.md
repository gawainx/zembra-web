# r028-supabase-auth-workspace-selection 设计文档

日期：2026-08-24

需求澄清文档：`docs/request-clarify/sync/r028-supabase-auth-workspace-selection.md`

## 设计决策

复用 `DataSourceGate`、`getSupabaseBrowserClient` 和 `createSupabaseDataSourceClients`。`supabase.client.ts` 新增一个局部的 workspace 列表函数，将 `workspaces` 行映射为最小业务 DTO；页面组件不直接调用 Supabase 查询。该函数只在 `auth.getSession()` 返回 session 后调用，避免未认证请求和不必要的并发请求。

## 数据流

| 阶段 | 操作 | 结果 |
| --- | --- | --- |
| 未登录 | `signInWithOtp(email)` | Supabase 发送 Magic Link。 |
| 登录回跳 | `auth.getSession()` | 恢复 session。 |
| 已登录 | `listSupabaseWorkspaces()` | 读取 RLS 允许的 workspace 名称和 UUID。 |
| 用户选择 | 复用 `createSupabaseDataSourceClients` | 以 UUID 激活既有业务 Client。 |

`workspace_name` 在共享 schema 中可为空，UI 使用本地化的“未命名 workspace”作为显示回退，不展示 UUID。RLS 与 `workspace_members` 是唯一授权来源，前端不缓存或伪造权限。

## 验证策略

| 层级 | 验证内容 |
| --- | --- |
| 配置单测 | 验证只需要 Supabase URL 与 publishable key。 |
| 登录门禁测试 | 验证 Magic Link 使用手动输入邮箱，登录会话只展示授权 workspace，并以选择的 UUID 激活 Client。 |
| 构建验证 | 运行 `npm run test` 与 `npm run build`。 |
