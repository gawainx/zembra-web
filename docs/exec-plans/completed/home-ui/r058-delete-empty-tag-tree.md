# r058-delete-empty-tag-tree 执行计划

日期：2026-08-31

## 关联文档

- 需求澄清：`docs/request-clarify/home-ui/r058-delete-empty-tag-tree.md`
- 设计：`docs/design-docs/home-ui/r058-delete-empty-tag-tree.md`

## Stage #1：Supabase 与 store 删除能力

### Task #1：扩展 taxonomy 删除契约

**Status:** Finished

**Files:** Modify `src/api/taxonomy.client.ts`, `src/api/supabase-taxonomy.client.ts`, relevant tests

为 Supabase taxonomy client 增加按深度倒序删除 Tag 子树的操作。HTTP client 不实现该操作，避免在仅 Supabase Direct 范围内引入未确认的 Backend 契约。

**执行记录：** `TaxonomyClient.deleteTagTree()` 已加入共享边界；Supabase client 对 Tag DTO 按 depth 降序逐项、带 workspace scope 删除。Backend client 明确拒绝该仅 Supabase Direct 的动作，不猜测 HTTP 路径。

### Task #2：实现 Tag 子树乐观删除

**Status:** Finished

**Files:** Modify `src/features/notes/noteStore.ts`, relevant tests

从现有 Tag 列表推导目标根及全部后代，验证聚合笔记数为 0 后乐观移除；远端失败时按现有版本队列规则回滚。当前筛选落在被删子树时清空筛选。

**执行记录：** notes store 现按完整路径推导子树，先移除 Tag 与受影响筛选再按实体队列提交；远端失败时恢复原 Tag 列表和筛选，并通过全局 mutation toast 反馈。

## Stage #2：侧栏与确认交互

### Task #3：接入 Tag 行删除入口

**Status:** Finished

**Files:** Modify `src/pages/home/HomeSidebar.tsx`, `src/pages/home/HomePage.tsx`, relevant tests

复用已有删除 slot，在聚合数为 0 的根 Tag 或子 Tag 行上于 hover/focus 时显示垃圾桶；删除按钮不触发行筛选。

**执行记录：** 根 Tag 与子 Tag 行均复用右侧删除 slot；根 Tag 的聚合数继续覆盖全部后代，数目为 0 时才传入可访问删除动作。

### Task #4：实现简洁确认与反馈

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, `src/i18n/locales/*/home.ts`, relevant tests

复用现有应用内弹窗样式，确认句仅为“确认删除 #完整路径？”。确认期间禁用重复提交；成功显示低干扰通知，失败回滚并显示失败通知。

**执行记录：** 已新增最简 Tag 删除确认弹窗，正文仅渲染“确认删除 #完整路径？”。确认立即关闭弹窗并启动后台删除；成功通知持续 3 秒，失败回滚并通知 10 秒。

## Stage #3：验证与记录

### Task #5：运行验证并回写实际结果

**Status:** Finished

**Files:** Modify this plan and implementation documentation as needed

运行定向测试、完整测试和 `npm run build:supabase`。开发完成后补充实际改动、验证结果与 Conventional Commit；未经用户验收不归档本计划。

**执行记录：** `npm test` 通过 21 个测试文件、140 项测试；`npm run build:backend` 与 `npm run build:supabase` 均通过，所有 JavaScript chunk 低于 500 kB。用户已于 2026-08-31 验收通过，本计划归档至 `docs/exec-plans/completed/home-ui/`。
