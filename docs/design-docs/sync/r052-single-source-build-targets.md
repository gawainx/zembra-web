# r052-single-source-build-targets 设计文档

日期：2026-08-28

需求澄清文档：`docs/request-clarify/sync/r052-single-source-build-targets.md`

## 设计目标

让 Vite 在构建模块图之前选择唯一数据源实现，未选择实现没有可达 import，因此不会出现在对应 `dist`。业务页面继续依赖既有 Notes、Taxonomy 和 Sync 业务接口，不感知 Supabase 表结构或 Backend HTTP 路径。

## 方案选择

推荐使用 Vite 的构建目标参数和受控 alias 选择实现模块，而不是在浏览器中读取 `VITE_DATA_SOURCE_MODE` 后用条件分支或动态 import。alias 在 Vite 解析依赖前生效，能保证每次构建只有一个入口门禁与一个 client runtime 可达；运行时条件即使延迟加载，也容易把两种模式的 chunk 同时写入 `dist`。

`vite.config.ts` 读取受限的构建目标值 `backend` 或 `supabase`，并将稳定虚拟导入映射到对应实现。未传入或传入未知值时构建失败，避免默认目标被意外部署。

## 模块边界

```text
src/
├─ app/
│  ├─ App.tsx                         # Theme、router、通用 mutation toast
│  └─ source-entry/
│     ├─ backend.tsx                  # BackendUrlGate、Backend toast
│     └─ supabase.tsx                 # SupabaseEntry
├─ api/
│  ├─ runtime/
│  │  ├─ backend.ts                   # Backend clients 与激活逻辑
│  │  └─ supabase.ts                  # Supabase clients 与激活逻辑
│  ├─ notes.client.ts                 # 保留 Backend 实现
│  ├─ taxonomy.client.ts              # 保留 Backend 实现
│  ├─ sync.client.ts                  # Backend-only
│  ├─ supabase*.client.ts             # Supabase-only
│  └─ types.ts                        # 共享业务 DTO
└─ pages/
   ├─ home/                           # 共享首页；专属操作通过 source runtime 暴露的能力装配
   └─ settings/                       # Backend target 才挂载 Sync 设置
```

`App`、Zustand note store 和共享页面只导入稳定的 source runtime 公共接口。Vite alias 让该接口在 Backend 构建解析为 `api/runtime/backend.ts`，在 Supabase 构建解析为 `api/runtime/supabase.ts`。两者提供相同的 NotesClient、TaxonomyClient 激活和访问能力；仅 Backend runtime 提供 SyncClient。无需建立新的 repository 或 service 抽象，现有业务 client 接口已经是足够的边界。

应用入口同样通过 alias 解析到唯一的 source entry。Backend source entry 包含 `BackendUrlGate` 和 `BackendConnectionToast`；Supabase source entry 包含 `SupabaseEntry`。删除 `DataSourceGate`、`DataSourceMode`、`data-source-client` 的模式持久化和激活分支。workspace context 保持为共享 UI 契约，由各自 entry 继续提供。

首页与设置模块不再读取 `getDataSourceMode()`。构建目标专属的同步控制和设置入口由 source runtime/entry 装配：Backend 构建传入现有 SyncClient 并渲染现有同步功能；Supabase 构建不导入这些组件。这样 Supabase `dist` 不会因布尔条件而保留 Sync 设置的模块依赖。

## 构建与分发契约

| 命令 | 构建目标 | 消费的部署配置 |
| --- | --- | --- |
| `npm run build:backend` | Docker | `VITE_ZEMBRA_API_BASE_URL`、`VITE_ZEMBRA_WORKSPACE_ID` 与 Backend 现有配置。 |
| `npm run build:supabase` | Vercel、Tauri | `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY` 与 Supabase Auth 现有公开配置。 |
| `npm run dev:backend` | Backend | 与 Backend 构建相同。 |
| `npm run dev:supabase` | Supabase Direct | 与 Supabase 构建相同。 |

`npm run build` 不再作为含义不明的默认生产目标；Docker 显式调用 `build:backend`，Vercel、Tauri 配置和 macOS 打包脚本显式调用 `build:supabase`。Vercel 不提供 Backend 构建命令或环境变量配置。公开 `VITE_` 变量只属于其对应目标，Supabase service role 或 secret key 仍不得进入前端构建环境。

## 验证策略

| 层级 | 验证内容 |
| --- | --- |
| 单元测试 | Backend 与 Supabase entry/runtime 分别覆盖各自登录、workspace 激活、数据访问和专属能力。 |
| 行为回归 | Backend 构建保留同步与设置；Supabase 构建不渲染数据源选择、同步或 Backend 提示。 |
| 产物隔离 | 分别构建，检查 `dist/assets` 文件名和内容：Backend 产物不存在 Supabase 标识与包代码，Supabase 产物不存在 Backend URL、sync client 和 HTTP API 标识。 |
| 渠道构建 | Docker 镜像构建验证 Backend 目标；Tauri Web 预构建与 macOS 打包验证 Supabase 目标。 |

## 与历史决策的关系

本方案取代 r026 的运行时双数据源切换架构，不复用 `DataSourceGate` 或 `data-source-client`。r027/r028 中 Supabase Auth、RLS workspace 查询与选择的流程继续保留在 Supabase-only entry 内，Backend workspace 选择继续保留在 Backend-only entry 内。
