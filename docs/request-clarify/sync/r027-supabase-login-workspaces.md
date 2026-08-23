# r027-supabase-login-workspaces 需求澄清

日期：2026-08-23

## 需求目标

Supabase 模式从单一固定 workspace 改为由部署环境变量声明多个允许访问的 workspace。用户必须在登录页选择 workspace，选项展示 workspace 名称，不展示 UUID；选定后自动填充该 workspace 绑定的邮箱，用户无需也不能手动修改邮箱。随后沿用现有 Supabase Magic Link 登录，成功后仅以所选 workspace UUID 建立业务 Client。

## 范围与边界

这是 WebUI 配置、登录门禁和数据访问作用域改动，不修改 `vendor/zembra-schema`、远端数据库、RLS、`workspace_members` 或 Supabase Auth 配置。由于 workspace 名称和绑定邮箱需要在未认证前展示，环境变量必须同时包含 `id`、`name` 和 `email`；所有 `VITE_` 前缀值都会进入浏览器包，禁止放入 secret、service role key 或其他敏感值。

## 环境变量契约

`VITE_SUPABASE_WORKSPACES` 使用 JSON 数组，例如 `[{"id":"workspace-uuid","name":"Personal notes","email":"you@example.com"}]`。空数组、非法 JSON 或任一项缺少非空的 `id`、`name`、`email` 时视为 Supabase 未配置，登录页保持在门禁并显示既有配置错误。旧的 `VITE_SUPABASE_WORKSPACE_ID` 不再消费。

## 登录流程

```text
数据源：Supabase
Workspace：[Personal notes ▾]
邮箱：you@example.com（只读）
[发送 Magic Link]
```

用户选择后，前端把 UUID 临时保存在 sessionStorage，使 Magic Link 返回同一 WebUI 后恢复该选择并激活对应 Client。已有 Supabase session 也需要先在登录页选择 workspace，随后使用“进入 Zembra”动作进入，不在首页提供 workspace 切换入口。

## 验收标准

| 场景 | 预期 |
| --- | --- |
| 多 workspace 配置 | 登录页仅展示环境变量声明的 workspace 名称。 |
| workspace 选择 | 未选择时邮箱为空且提交按钮不可用；选择后邮箱自动填充并只读。 |
| Magic Link | 请求使用所选 workspace 的绑定邮箱，回调后恢复所选 workspace。 |
| 数据访问 | 业务 Client 的 workspace scope 使用所选 workspace UUID。 |
| 配置错误 | 缺少或非法 `VITE_SUPABASE_WORKSPACES` 时不能进入 Supabase 模式。 |
