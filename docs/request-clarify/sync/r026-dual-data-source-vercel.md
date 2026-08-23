# r026-dual-data-source-vercel 需求澄清

日期：2026-08-23

## 需求目标

WebUI 同时支持 Backend 和 Supabase 两种数据源。用户在登录页的下拉选单中选择数据源：Backend 模式继续连接用户指定的 Zembra Backend；Supabase 模式由部署在 Vercel 的静态 WebUI 直接连接远程 Supabase。两种模式共用首页、编辑器和笔记交互，数据源不得混合。

Supabase 数据库已经正确初始化，WebUI 不负责创建表、执行 migration、配置 RLS、初始化数据或实现 Backend 与 Supabase 之间的同步。共享数据库契约固定为 `vendor/zembra-schema` 的 Git tag `v0.6.1`，commit 为 `ed999079a06b8c5cc2287d4f397a554444b3c994`；其统一业务 schema version 为 `0.6.0`。`workspace_members` 是 Supabase Auth 用户与 workspace 的正式关系，RLS 通过该关系暴露业务数据；WebUI 只消费该已部署契约。

## 登录与部署结论

Supabase 模式采用 Supabase Auth 的邮箱 Magic Link。Vercel 仅承载 Vite 静态 SPA；浏览器使用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY` 创建 Supabase Client，不能使用或暴露 service role key、secret key，也不新增 Vercel Function 或数据访问代理。

Supabase Auth 的生产 `Site URL` 指向正式 Vercel 域名，Redirect URLs 放行本地开发地址和 Vercel Preview 域名。Magic Link 成功回到当前 WebUI URL 后由 Supabase Client 恢复会话。Backend 模式不改变已有的 Backend URL、健康检查和 workspace 选择行为。

## 登录页流程

```text
┌──────────────────────────────────────┐
│ Zembra                               │
│ 数据源 [ Backend / Supabase        ▾ ] │
│                                      │
│ Backend：Backend URL → workspace      │
│ Supabase：邮箱 → Magic Link → workspace│
│                                      │
│ [进入 Zembra]                         │
└──────────────────────────────────────┘
```

选择值使用本地存储回填到登录页，但每次应用启动仍显示登录页，用户可以在进入首页前切换模式。切换模式时清空内存中的笔记、筛选、统计和预览缓存，随后只加载新模式的数据。Supabase 会话由 Supabase Client 持久化和恢复；用户选择 Backend 不会清除该会话。

## 数据能力与范围

Supabase 模式按 schema tag `v0.6.1` 的 Postgres 和 Supabase 契约实现 `workspaces`、`notes`、`fields`、层级 `tags`、`note_tags`、`note_links`、`note_revisions` 和 `devices` 的现有 WebUI 业务能力。workspace 列表来自当前 Supabase 会话通过 `workspace_members` 在 RLS 下可读取的 `workspaces` 行，用户在登录页选择 workspace；`workspace_id` 是所有业务读写的必填范围。笔记创建角色继续是 `Human`，编辑不修改不可变的 `role`。

现有 `NotesClient` 与 `TaxonomyClient` 继续作为 UI 和数据访问之间的业务边界。Backend 模式复用现有 HTTP 实现；Supabase 模式新增对应实现。React 页面和 Zustand store 不直接调用 Supabase 查询，也不直接依赖表字段。

Backend 的手动同步、同步状态、`/sync/*` 设置和 Secret key 管理没有 Supabase 直连等价物。这些入口只在 Backend 模式显示；Supabase 模式不显示同步按钮、同步反馈和 Sync 设置分类。首页持续显示当前数据源标识，避免用户误判正在操作的数据位置。

## Vercel 范围

保留现有 `vercel.json` SPA rewrite。Vercel 使用 `npm run build` 构建 `dist`，并在 Preview 和 Production 环境配置 Supabase URL 与 publishable key。Backend 模式允许用户在浏览器输入服务根地址；能否从 Vercel 页面访问该 Backend 取决于 Backend 对相应 Vercel 源站的 CORS 配置，该配置不在本仓库修改范围内。

## 兼容代价评估

双模式会增加两套数据访问实现、登录分支、错误提示和测试组合。这是该需求明确要求的能力，复杂度限定在入口和 Client 层；首页 UI、编辑器、业务 DTO、Zustand action 和 i18n 尽量复用。Backend 与 Supabase 不自动同步或合并数据，两个模式各自读写目标数据源。

## 验收标准

| 场景 | 预期 |
| --- | --- |
| 登录页 | 可选择 Backend 或 Supabase，切换后只显示该模式需要的输入和步骤。 |
| Backend 模式 | 保留 URL 可达性校验、workspace 选择和现有首页数据访问。 |
| Supabase 未登录 | 显示邮箱输入和发送 Magic Link 动作。 |
| Supabase 已登录 | 读取 RLS 可见的 workspace，选择后进入首页。 |
| Supabase 数据访问 | 笔记、领域、层级标签、双链、每日统计和编辑操作直接使用 Supabase Client。 |
| 模式切换 | 不展示或使用另一模式的缓存数据。 |
| 同步功能 | 仅 Backend 模式显示手动同步和 Sync 设置。 |
| Vercel | Production 与 Preview 可构建，Magic Link 能返回允许的 WebUI URL。 |
