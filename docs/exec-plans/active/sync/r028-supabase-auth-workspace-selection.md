# r028-supabase-auth-workspace-selection 执行计划

日期：2026-08-24

需求澄清文档：`docs/request-clarify/sync/r028-supabase-auth-workspace-selection.md`

设计文档：`docs/design-docs/sync/r028-supabase-auth-workspace-selection.md`

## Stage 1：前向替换登录门禁

- [x] Task 1：移除 workspace 环境变量解析、示例和绑定类型。
- [x] Task 2：在认证会话恢复后通过 API Client 层加载 RLS 授权的 workspace。
- [x] Task 3：将登录页改为邮箱登录后选择 workspace，并处理空列表。

验证：运行登录门禁单测、完整测试和生产构建。

## Stage 2：验证与交付

- [x] Task 1：执行自动化验证、检查差异、提交并推送功能分支。

## Stage 3：Magic Link 发送反馈

- [x] Task 1：发送期间展示“正在发送”，成功后展示“发送成功”，并维持强调按钮可见。
- [x] Task 2：补充状态行为测试、执行验证、提交并推送。
