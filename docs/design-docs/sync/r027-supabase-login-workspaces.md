# r027-supabase-login-workspaces 设计文档

日期：2026-08-23

需求澄清文档：`docs/request-clarify/sync/r027-supabase-login-workspaces.md`

## 设计决策

复用 `src/api/supabase.client.ts` 的公共配置读取和 `DataSourceGate` 的登录门禁，不新增 Repository、Provider 或页面级 Supabase 查询。配置读取层解析并校验 workspace 绑定；门禁层仅消费该类型化配置，在用户明确选择后调用现有 `createSupabaseDataSourceClients` 和 `activateDataSource`。现有 Supabase notes 与 taxonomy Client 保持不变，因为它们已经接受 workspace UUID scope。

## 配置模型

| 字段 | 来源 | 用途 |
| --- | --- | --- |
| `id` | `VITE_SUPABASE_WORKSPACES` | 登录后传给既有业务 Client，作为全部数据读写的 workspace scope。 |
| `name` | `VITE_SUPABASE_WORKSPACES` | 仅用于登录页下拉选项。 |
| `email` | `VITE_SUPABASE_WORKSPACES` | 仅用于选中后只读展示和 `signInWithOtp` 请求。 |

未认证状态无法依赖 RLS 查询 `workspaces` 获取显示名称，因此名称必须随部署配置提供。配置并不授予数据库权限；Supabase session 和既有 RLS 仍是最终访问控制。

## 状态与回调

`DataSourceGate` 保留当前的模式本地存储；Supabase 选择只写入 `sessionStorage`，用于 Magic Link 的同窗口回调恢复，不作为长期可访问权限。会话恢复时仅在临时 UUID 仍存在于当前环境变量配置中才自动进入。其他已有会话必须经登录页重新选择 workspace，因此不会出现首页内切换。

## 验证策略

| 层级 | 验证内容 |
| --- | --- |
| Supabase 配置单测 | 验证 JSON 映射、完整配置与缺失配置拒绝。 |
| 登录门禁测试 | 验证 workspace 名称展示、选择后邮箱只读自动填充、未选择不可提交和 Magic Link 使用绑定邮箱。 |
| 构建验证 | 运行 `npm run test` 与 `npm run build`。 |
