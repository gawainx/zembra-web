# r026-dual-data-source-vercel 设计文档

日期：2026-08-23

需求澄清文档：`docs/request-clarify/sync/r026-dual-data-source-vercel.md`

## 设计目标

在不让页面组件感知数据库提供方的前提下，为现有 WebUI 增加可切换的 Backend 与 Supabase 数据源。Backend 客户端和行为保持可用；Supabase 使用 `@supabase/supabase-js` 直连远程项目。数据结构和业务语义以 `vendor/zembra-schema` 的 Git tag `v0.6.1` 为准，远端业务表和 Supabase Auth/RLS 契约均由该 tag 定义。

## 模块结构

```text
src/
├─ app/
│  └─ DataSourceGate.tsx
├─ api/
│  ├─ notes.client.ts                 # 既有业务接口与 Backend 实现
│  ├─ taxonomy.client.ts              # 既有业务接口与 Backend 实现
│  ├─ supabase.client.ts              # Supabase Client 初始化与 Auth
│  ├─ supabase-notes.client.ts        # NotesClient 的 Supabase 实现
│  ├─ supabase-taxonomy.client.ts     # TaxonomyClient 的 Supabase 实现
│  └─ data-source-client.ts           # 当前模式的 Client 解析
└─ features/notes/
   └─ noteStore.ts                    # 只消费业务 Client
```

新增数据源解析模块是必要的最小抽象：当前 `noteStore` 至少在加载、创建、更新、删除、预览和筛选刷新时重复使用 notes 与 taxonomy client，首页还单独消费 sync client。模式若只在页面中分支，将使这些调用点各自判断 Backend/Supabase 并产生重复。解析模块只保存已确认的数据源、workspace 和对应业务 Client，不增加 Repository、Provider 或通用插件系统。

## 运行时状态

| 状态 | 存储位置 | 用途 |
| --- | --- | --- |
| 数据源模式 | `localStorage` | 回填登录页选择，值为 `backend` 或 `supabase`。 |
| Backend URL | 既有 `localStorage` 配置 | 仅 Backend 模式使用。 |
| Backend workspace | 既有 `localStorage` 配置 | 仅 Backend 模式使用。 |
| Supabase Auth session | Supabase Client 默认持久化存储 | 恢复 Magic Link 登录结果。 |
| Supabase workspace | `VITE_SUPABASE_WORKSPACE_ID` | 仅 Supabase 模式使用，由本地或 Vercel 部署配置固定。 |
| 首页缓存 | Zustand `noteStore` | 切换模式或 workspace 时整体重置。 |

`DataSourceGate` 是唯一的模式选择与进入门禁。完成一个模式的登录和 workspace 选择后，它建立当前数据源 Client，再渲染应用路由。切换选择或 workspace 时先重置 `noteStore`，再替换当前 Client，防止旧请求结果写入新模式状态。

## Backend 模式

Backend 分支复用 `BackendUrlGate` 已有的地址输入、`GET /health`、`GET /workspaces`、workspace 默认选择与持久化能力。现有 HTTP `NotesClient`、`TaxonomyClient` 和 `SyncClient` 的请求形态不变。网络失败继续使用 Backend 专属 toast。

## Supabase 模式

Supabase Client 由构建时 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY` 创建。缺少任一变量时，Supabase 选项在登录页展示明确配置错误，不能进入应用。Client 仅出现在 `api` 模块，页面组件通过门禁状态和业务 Client 使用它。

未恢复会话时，登录页提供邮箱输入和发送 Magic Link 动作；成功后显示“请在邮箱中完成登录”。回调回到 Vercel 页面时重新读取会话，随后以 `VITE_SUPABASE_WORKSPACE_ID` 激活业务 Client 并直接进入首页。Supabase 模式不查询、不展示和不持久化 workspace 选择；访问控制继续由 `workspace_members` 与 RLS 在业务请求中执行。

Supabase Notes Client 以 `workspace_id` 过滤每次 `notes`、`note_tags`、`note_links`、`note_revisions` 与 `fields` 查询。它负责将 snake_case 行映射为既有 camelCase DTO，并在创建、编辑与删除后刷新相关标签、领域和每日统计。ID 由浏览器使用 `crypto.randomUUID()` 创建，时间用 Unix 秒。层级标签以 `path` 为界面语义；创建或引用 `a/b` 时，Client 按路径确保父节点和叶节点存在，再写入 `note_tags`。双链按 `note_links` 读写。每日统计在 Client 中按可访问笔记的 `created_at` 聚合为现有 DTO，不新增数据库对象。

单个笔记编辑所涉及的 note、tag 关联、双链和 revision 是多条直接请求。设计不虚构未在 schema 中定义的 RPC 或 transaction API；请求失败时向 UI 返回失败并保留编辑草稿，已成功写入的远端行以既有数据库状态为准。后续如共享 schema 增加正式 RPC 契约，再单独优化原子性。

## 模式感知 UI

首页品牌区展示 `Backend` 或 `Supabase` 数据源标识。手动同步按钮、同步结果提示与 `SettingsModule` 只在 Backend 模式挂载；Supabase 模式不创建 `SyncClient`，也不渲染 Sync 设置。主题、语言、编辑器、笔记卡片、筛选和 workspace 主页结构在两种模式完全共用。

Field 使用 Bonofix 风格的低饱和红色语义 token 展示，覆盖侧栏 `@field` 和笔记卡片的 field 选择器；标签继续使用强调蓝色体系。明暗主题分别定义对应 token，组件不写入颜色字面量。

## 乐观写入与全局通知

`noteStore` 在调用既有 `NotesClient` 前生成临时笔记并更新 feed；收到远端创建结果后以正式 DTO 替换临时笔记，失败则移除临时笔记。删除操作先从 feed、角色导航和预览缓存移除目标笔记，失败时按原位置恢复。创建、删除完成后由 store 发出全局业务通知事件，`App` 复用既有全局通知订阅方式在右下角渲染单条 toast。成功 toast 显示 3 秒，失败 toast 显示 10 秒；新通知替换当前通知。toast 使用现有语义颜色和低对比边框，不使用遮罩、模态层或强动画。

新增全局通知事件是必要的最小抽象：创建和删除在 Zustand store 内异步完成，页面不能可靠地等待它们后再反馈，且两种操作需要共用同一套全局展示和计时。它只承载已定义的通知类型、语义等级和时长，不引入通用消息队列、第三方 UI 库或页面级 Supabase 分支。

## Vercel 与认证配置

`vercel.json` 保持 SPA rewrite。Vercel 环境变量分 Production 和 Preview 设置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`、`VITE_SUPABASE_WORKSPACE_ID`；这些值可进入前端包，service role 和 secret key 不得出现。Supabase Dashboard 的 `Site URL` 配置正式 Vercel 域名，并允许本地开发与 Vercel Preview 回调 URL。Backend 模式的 CORS 配置是外部服务前提，不在前端默认追加路径或改写请求。

## 验证策略

| 层级 | 验证内容 |
| --- | --- |
| Client 单元测试 | Backend 与 Supabase Client 分别验证请求参数、DTO 映射、workspace 过滤、标签路径和双链写入。 |
| 登录页测试 | 验证模式选择、Backend 原流程、Magic Link 发送、会话恢复、workspace 选择与配置错误。 |
| Store 与首页测试 | 验证切换模式后清空缓存、加载正确 Client 数据、Supabase 模式不显示同步操作。 |
| 构建验证 | 运行 `npm run test` 与 `npm run build`。 |
| Vercel 验证 | Preview 与 Production 构建成功，Magic Link 回调恢复会话，Supabase 和 Backend 分支分别完成一次笔记创建。 |
