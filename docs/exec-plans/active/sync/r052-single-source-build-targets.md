# r052-single-source-build-targets 执行计划

日期：2026-08-28

需求澄清文档：`docs/request-clarify/sync/r052-single-source-build-targets.md`

设计文档：`docs/design-docs/sync/r052-single-source-build-targets.md`

状态：已实施，等待用户验收

## 成功标准

Backend 与 Supabase Direct 分别从独立、唯一的数据源模块图构建；未选数据源的入口、client、依赖和专属 UI 不存在于产物。Docker 固定 Backend，Tauri 固定 Supabase，且两类既有用户流程完整回归。

## Stage 1：构建目标与共享装配边界

| 步骤 | 改动 | 验证 |
| --- | --- | --- |
| 1.1 | 修改 `vite.config.ts` 与 `package.json`，定义严格的 Backend/Supabase 构建和开发命令，并为 source entry 与 runtime 建立构建期 alias。 | 未指定或非法目标构建失败；两条 build 命令均通过 TypeScript 与 Vite 构建。 |
| 1.2 | 调整 `src/main.tsx`、`src/app/App.tsx` 和共享 route/provider 装配，使其仅依赖 alias 暴露的 source entry。 | 入口测试覆盖两种目标对应的唯一门禁。 |

## Stage 2：拆分数据源实现

| 步骤 | 改动 | 验证 |
| --- | --- | --- |
| 2.1 | 将当前 `src/api/client.ts` 的 Backend 与 Supabase 构造/解析逻辑分别迁至目标 runtime；保留现有 NotesClient、TaxonomyClient、SyncClient 和 DTO。 | Backend 与 Supabase client 测试继续通过；store 只经 runtime 取得业务 client。 |
| 2.2 | 删除仅服务运行时模式切换的 `DataSourceGate`、`data-source-client`、模式 localStorage 和模式判断；调整其测试。 | 搜索确认无数据源选择或模式持久化残留；启动时只出现目标门禁。 |

## Stage 3：剥离专属 UI 依赖

| 步骤 | 改动 | 验证 |
| --- | --- | --- |
| 3.1 | Backend source entry 组合现有 URL/workspace 门禁、连接 toast、同步控制和 Sync 设置。 | Backend 行为测试覆盖 URL、workspace、同步和设置。 |
| 3.2 | Supabase source entry 组合现有 Magic Link、RLS workspace 选择和重命名；不导入 Backend/sync UI。 | Supabase 行为测试覆盖会话恢复、workspace 选择和无同步入口。 |

## Stage 4：固定发布渠道与验证

| 步骤 | 改动 | 验证 |
| --- | --- | --- |
| 4.1 | 修改 Dockerfile 只调用 `build:backend`，更新部署示例；Vercel 配置只允许 `build:supabase`。 | `docker build` 成功，镜像中的静态资源不包含 Supabase 标识；Vercel 构建命令固定为 Supabase。 |
| 4.2 | 修改 `src-tauri/tauri.conf.json`、npm scripts 和 macOS 打包脚本，使开发与打包只调用 Supabase 命令。 | `npm run tauri:build` 或等价打包命令成功，产物不包含 Backend 标识。 |
| 4.3 | 执行全量测试、两种生产构建、产物扫描和 `git diff --check`；记录两类产物大小与排除证据。 | 测试和构建全部通过，无未选数据源模块；提交后等待用户验收。 |

## 预期文件

`vite.config.ts`、`package.json`、`src/main.tsx`、`src/app/App.tsx`、数据源入口/runtime、受影响的 API 与测试、`Dockerfile`、`src-tauri/tauri.conf.json`、`scripts/package_macos_app.sh`、部署说明和本计划。实际实现只改造承载上述职责的既有文件；不会修改数据库契约或新增第三方依赖。

## 执行记录

2026-08-28 已完成全部 Stage，代码提交为 `a0ee7c9`。Vite 通过构建期 alias 将入口、数据访问 runtime 与首页同步控件分别解析为 Backend 或 Supabase Direct 实现；运行时数据源选择、模式 localStorage 和双模式 client 解析器已删除。Docker 调用 `build:backend`，Vercel、Tauri 与 macOS 打包调用 `build:supabase`。

已运行 `npm test`，20 个测试文件、137 项测试全部通过；`npm run build:backend` 与 `npm run build:supabase` 均通过。Backend `dist` 不包含 Supabase chunk、Magic Link 或 Supabase entry；Supabase `dist` 不包含 Backend URL gate、Backend connection event 或健康检查实现。`npm run tauri:build` 已确认调用 `npm run build:supabase`。Docker daemon 当前未运行，因此 `docker build` 无法完成镜像层验证；Dockerfile 构建命令已静态核对为 `build:backend`。
