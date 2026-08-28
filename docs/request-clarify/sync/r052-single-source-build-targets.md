# r052-single-source-build-targets 需求澄清

日期：2026-08-28

## 需求目标

当前 WebUI 在同一浏览器运行时提供 Backend 与 Supabase Direct 两种数据源选择。用户要求把数据源确定时点前移到部署构建阶段：每个分发产物仅保留一种数据源的入口、客户端实现、依赖和专属界面，用户不能在运行时切换。目标是缩小分发体积，同时去除因双模式而存在的运行时分支和状态。

## 已确认范围

| 分发渠道 | 固定数据源 | 运行时能力 |
| --- | --- | --- |
| Web / Vercel Backend 构建 | Backend | 保留当前 Backend URL 输入、连通性检查、workspace 选择、笔记操作、同步按钮、同步状态、Sync 设置和连接失败提示。 |
| Web / Vercel Supabase 构建 | Supabase Direct | 保留 Magic Link、会话恢复、RLS 授权 workspace 查询与选择、笔记操作和 workspace 重命名；不包含 Backend 配置、HTTP client、同步界面或 Sync 设置。 |
| Docker | Backend | Docker 镜像只执行 Backend 构建，镜像内不包含 `@supabase/supabase-js` 及 Supabase Direct 实现。 |
| macOS Tauri | Supabase Direct | Tauri 开发、构建与打包都使用 Supabase 构建，应用包内不包含 Backend 入口、HTTP client、同步界面或 Sync 设置。 |

Web / Vercel 的 Backend 与 Supabase 构建是两个独立部署目标，可分别配置为不同 Vercel 项目或同一项目的不同构建配置。每个目标只能部署对应构建产物，不能通过环境变量或本地存储在浏览器中切换为另一数据源。

## 当前状态与调研结论

当前 `src/main.tsx` 静态导入 `App`，而 `App` 静态导入 `DataSourceGate`。`DataSourceGate` 同时静态关联 `BackendUrlGate` 与 `SupabaseEntry`；`src/api/client.ts` 同时关联 Backend HTTP client、Supabase client 和运行时 `data-source-client` 解析器。因此两套代码均进入同一个 Vite 模块图。

现有 `vite.config.ts` 的 `manualChunks` 会把 Supabase 拆到独立 chunk，却不会把它从 Backend 分发目录移除。2026-08-28 的 `npm run build` 产物包含 `supabase` chunk 210.84 kB、gzip 55.66 kB，以及 `SupabaseEntry` chunk 6.57 kB、gzip 2.49 kB；Backend 用户仍会获得这些文件。实际节省量以改造后的两种构建产物清单为准，不预先承诺总压缩比例。

当前 Supabase 登录流程以认证后的 RLS 查询 workspace 并由用户选择为准，不再使用历史 r026 文档中的固定 `VITE_SUPABASE_WORKSPACE_ID`。本需求保留该实际流程。

## 不在范围内

不修改 `vendor/zembra-schema`、Supabase 表/RLS/Auth 配置、Backend OpenAPI 契约或 Backend CORS 配置；不让 UI 组件直接调用 Supabase；不新增数据同步或 Backend 与 Supabase 数据迁移；不为 Docker 增加 Supabase 变体，也不为 Tauri 增加 Backend 变体。

## 验收标准

| 场景 | 预期 |
| --- | --- |
| `build:backend` | 生产 `dist` 不含 `@supabase`、`SupabaseEntry`、Supabase business client 或 Supabase 登录代码；Backend 完整流程保持可用。 |
| `build:supabase` | 生产 `dist` 不含 Backend URL 门禁、HTTP API client、sync client、Sync 设置或 Backend 连接提示；Supabase 登录与业务流程保持可用。 |
| 运行时入口 | 不显示数据源下拉；不读取或写入数据源模式 localStorage；应用启动只进入构建目标对应的门禁。 |
| Docker | `docker build` 生成 Backend-only 静态镜像。 |
| Tauri | `tauri:dev`、`tauri:build` 与 macOS 打包脚本固定使用 Supabase 构建。 |
| 回归 | 两个构建目标的类型检查、相关自动化测试和生产构建均通过；构建后用产物清单与文本扫描验证未选数据源的代码未被分发。 |

## 与历史决策的关系

r026、r027 与 r028 的双模式运行时选择和共享 `DataSourceGate` 是当时需求的实现结果。本需求用构建期目标选择替代该运行时能力，保留两种数据源各自已实现的用户流程和 API Client 边界；历史文档不作修改。
