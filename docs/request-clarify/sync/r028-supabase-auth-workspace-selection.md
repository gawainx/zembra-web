# r028-supabase-auth-workspace-selection 需求澄清

日期：2026-08-24

## 需求目标

Supabase 模式废弃 `VITE_SUPABASE_WORKSPACES` 及全部 workspace 环境变量配置。用户先手动输入邮箱并完成现有 Magic Link 登录；WebUI 随后通过已认证 Supabase session 查询 RLS 允许访问的 workspace，展示名称供用户选择，再进入对应 workspace。

## 范围与边界

这是 WebUI 登录门禁和 Supabase Client 改动，不修改 schema、RLS、数据库内容或 `workspace_members`。部署环境只保留 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY`；二者是浏览器公开连接参数，禁止放入 service role key。workspace 可见范围仅由 schema v0.6.1 的 `workspace_members` 和 RLS 决定，前端不再维护部署白名单或邮箱绑定。

## 用户流程

```text
数据源：Supabase
邮箱：[输入邮箱]
[发送 Magic Link]

回跳后
Workspace：[有权访问的名称 ▾]
[进入 Zembra]
```

未登录时不请求 workspace。会话恢复后只查询 `workspaces` 的 `id` 和 `workspace_name`，RLS 返回的结果即为可选范围。空结果时留在门禁并显示没有可用 workspace；用户进入首页后不提供 workspace 切换。

## 与 r027 的关系

r027 的“部署配置 workspace 与邮箱绑定、登录前选择”方案已被用户否决：它要求维护冗长 JSON，且与 schema 的登录前访问边界冲突。本需求以前向替换移除该环境变量与其登录逻辑，不保留兼容路径。

## 验收标准

| 场景 | 预期 |
| --- | --- |
| 部署配置 | 不需要 workspace 环境变量。 |
| 未登录 | 输入邮箱后可发送 Magic Link。 |
| 登录回跳 | 仅显示当前 Supabase 用户经 RLS 授权的 workspace 名称。 |
| 进入应用 | 业务 Client 使用用户选择的 workspace UUID scope。 |
| 无权限 | 空列表时不能进入首页。 |
