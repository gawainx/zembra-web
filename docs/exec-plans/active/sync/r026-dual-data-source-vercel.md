# r026-dual-data-source-vercel 执行计划

日期：2026-08-23

需求澄清文档：`docs/request-clarify/sync/r026-dual-data-source-vercel.md`

设计文档：`docs/design-docs/sync/r026-dual-data-source-vercel.md`

## Stage 1：数据源状态与 Supabase 基础接入

### Task 1.1：新增依赖与运行时配置

状态：Finished

文件：Modify `package.json`; Create `src/api/supabase.client.ts`; Create `src/api/supabase.client.test.ts`; Create `.env.example`

功能：引入 `@supabase/supabase-js`，读取 Vite Supabase URL 与 publishable key，创建仅供 `api` 层使用的 Supabase Client。

实现要点：缺失公开变量时返回可展示的配置错误；不读取、记录或暴露 service role/secret key；Client 初始化和 Auth 调用保留不含敏感值的开始、成功、失败日志。

验证：`npm run test -- src/api/data-source-client.test.ts src/features/notes/noteStore.ts` 通过；`npm run build` 通过。

### Task 1.2：建立数据源会话与 Client 解析

状态：Finished

文件：Create `src/api/data-source-client.ts`; Modify `src/api/client.ts`; Modify `src/features/notes/noteStore.ts`; Create `src/api/data-source-client.test.ts`

功能：以当前模式和 workspace 解析 Notes、Taxonomy、Sync Client，并提供切换时重置 store 的唯一入口。

实现要点：复用既有 HTTP Client；Supabase 模式不创建 Sync Client；替换 Client 前清空 notes、fields、tags、daily counts、preview 和筛选状态；避免在每个 store action 重复判断模式。

验证：数据源状态单元测试覆盖默认 Backend 与 Supabase 激活；`npm run build` 通过。

## Stage 2：Supabase 认证与双模式登录页

### Task 2.1：重构登录门禁为数据源选择入口

状态：Finished

文件：Modify `src/app/BackendUrlGate.tsx`; Create `src/app/DataSourceGate.tsx`; Modify `src/app/App.tsx`; Modify `src/app/App.test.tsx`; Create/Modify `src/app/DataSourceGate.test.tsx`

功能：在既有登录页先展示数据源下拉选单，再进入 Backend 或 Supabase 分支。

实现要点：保持 Backend URL 和 workspace 的现有可观察行为；选择值本地持久化；Supabase 分支读取恢复会话、发送 Magic Link、显示邮件等待状态和回调错误；UI 使用现有主题 token 与三语言文案。

验证：`src/app/App.test.tsx` 覆盖 Backend 默认入口与缺失 Supabase 公开变量时的安全错误；`npm run build` 通过。

### Task 2.2：实现 Supabase workspace 选择

状态：Finished

文件：Modify `src/app/DataSourceGate.tsx`; Create/Modify `src/api/supabase.client.ts`; Create/Modify `src/app/DataSourceGate.test.tsx`

功能：查询当前会话通过 `workspace_members` 在 RLS 下可见的 `workspaces`，选择、持久化并校验 Supabase workspace。

实现要点：名称优先使用 `workspace_name`，为空时使用 ID 前八位；不请求 schema 未定义的笔记计数；已保存 workspace 不再可见时清除选择并停留登录页。共享 schema 已升级至 tag `v0.6.1`，其 `workspace_members` 和 RLS 迁移是本流程的远程数据访问前提。

验证：实现 RLS 可见 workspace 查询、持久化和失效清理；生产构建通过。实际 RLS 会话验证留待部署环境。

## Stage 3：Supabase 业务 Client

### Task 3.1：实现笔记与双链 Client

状态：Finished

文件：Create `src/api/supabase-notes.client.ts`; Create `src/api/supabase-notes.client.test.ts`; Modify `src/api/types.ts`

功能：按 `v0.5.1` tag 的 Postgres schema 实现 NotesClient 的 recent/list/get/create/update/delete、每日统计和双链读写。

实现要点：所有业务查询带 workspace scope；映射现有 DTO；使用 UUID 和 Unix 秒；创建 role 为 `Human`，更新不改 role；失败时保留调用方草稿。

验证：实现 workspace 过滤、DTO 映射、笔记 CRUD、revision 写入、双链替换和每日统计；`npm run build` 通过。远端 RLS 集成验证留待已配置 Supabase 环境。

### Task 3.2：实现领域与层级标签 Client

状态：Finished

文件：Create `src/api/supabase-taxonomy.client.ts`; Create `src/api/supabase-taxonomy.client.test.ts`

功能：按 `v0.5.1` tag 的 Postgres schema 实现领域、层级标签和笔记标签关联。

实现要点：标签以 path 表达层级，创建引用路径时确保需要的父节点和叶节点存在；领域和标签读取只返回当前 workspace 数据；删除领域保持现有“未使用才删除”的用户语义。

验证：实现层级路径、父节点创建、关联替换、workspace 隔离和删除保护；`npm run build` 通过。远端 RLS 集成验证留待已配置 Supabase 环境。

## Stage 4：模式感知首页与部署收口

### Task 4.1：收口 Backend 专属同步 UI

状态：Finished

文件：Modify `src/pages/home/HomePage.tsx`; Modify `src/pages/settings/SettingsModule.tsx`; Modify `src/pages/settings/settingsRegistry.tsx`; Modify i18n locale files; Modify related tests

功能：按当前模式显示数据源标识，只在 Backend 模式挂载手动同步和 Sync 设置。

实现要点：不改变 Backend 模式的同步 API 行为；Supabase 模式不渲染不可用按钮或空设置分类；三种语言文案完整。

验证：首页按模式显示 `LOCAL` 或 `SUPABASE` 标识，Supabase 模式不挂载同步按钮或 Sync 设置；`npm run test` 通过 17 个测试文件、118 个测试。

### Task 4.2：Vercel 配置、回归验证和手工验收

状态：Planned

文件：Modify `vercel.json` only if build output or rewrite requires adjustment; Modify `.env.example`; Modify this plan

功能：核对 Vercel SPA 配置和公开环境变量说明，完成自动化与实际部署流程验证。

实现要点：不在仓库写入真实 Supabase 凭据；确认 Supabase Dashboard 的正式/Preview Redirect URL 前提；按实际结果回写任务状态和验证记录。

验证：`npm run test`、`npm run build`、Vercel Preview、Vercel Production、Magic Link 回调、两种模式各完成一次笔记创建。

## Stage 5：乐观创建、删除与低干扰通知

### Task 5.1：实现乐观笔记操作和全局 toast

状态：Finished

文件：Modify `src/features/notes/noteStore.ts`; Modify `src/pages/home/HomePage.tsx`; Modify `src/pages/home/NoteCard.tsx`; Modify `src/app/App.tsx`; Modify/Create global toast files; Modify common locale files; Modify related tests

功能：创建和删除立即反映在页面；远端操作完成后在右下角显示成功或失败通知。

实现要点：创建使用临时 DTO，成功时替换、失败时移除；删除保留原列表位置用于失败回滚。成功通知持续 3 秒，失败通知持续 10 秒；通知使用现有语义 token，不遮挡主要编辑与阅读区域。远端请求继续经既有业务 Client 发起，不在组件中增加 Supabase 查询。

验证：覆盖创建和删除的立即可见更新、失败回滚、成功 3 秒与失败 10 秒通知；`npm run test` 通过 18 个测试文件、121 个测试，`npm run build` 通过。

### Task 5.2：应用 Field 红色语义

状态：Finished

文件：Modify `src/styles/main.css`; Modify `src/pages/home/HomeSidebar.tsx`; Modify `src/pages/home/HomePage.tsx`; Modify `src/pages/home/NoteCard.tsx`

功能：使用 Bonofix 红色系区分 Field 与蓝色 Tag。

实现要点：只使用新增的 field 语义 token；覆盖明暗主题、侧栏 Field 行和笔记卡片 Field 选择器，不改变交互或标签样式。

验证：`npm run build` 通过。

## 依赖与提交节奏

Stage 1 完成后提交数据源基础设施，Stage 2 完成后提交登录入口，Stage 3 完成后提交 Supabase Client，Stage 4 完成后提交模式感知 UI 与部署配置。每个 Stage 的代码修改在验证通过后独立提交；执行计划保留在 `active`，直到用户完成验收后才移动到 `completed`。
