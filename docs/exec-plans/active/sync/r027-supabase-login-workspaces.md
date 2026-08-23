# r027-supabase-login-workspaces 执行计划

日期：2026-08-23

需求澄清文档：`docs/request-clarify/sync/r027-supabase-login-workspaces.md`

设计文档：`docs/design-docs/sync/r027-supabase-login-workspaces.md`

## Stage 1：配置与登录门禁

- [x] Task 1：将单一 workspace 环境变量替换为类型化 workspace、名称和邮箱绑定数组。
- [x] Task 2：在 Supabase 登录页新增先选 workspace、自动填充只读邮箱和回调选择恢复流程。
- [x] Task 3：更新三种语言文案和 `.env.example`。

验证：运行 Supabase 配置单测、登录页行为测试和生产构建。

## Stage 2：验证与交付

- [x] Task 1：执行完整测试和构建检查。
- [x] Task 2：检查差异，stage、提交并推送功能分支。
