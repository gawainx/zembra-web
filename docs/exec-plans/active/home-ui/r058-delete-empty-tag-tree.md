# r058-delete-empty-tag-tree 执行计划

日期：2026-08-31

## 关联文档

- 需求澄清：`docs/request-clarify/home-ui/r058-delete-empty-tag-tree.md`
- 设计：`docs/design-docs/home-ui/r058-delete-empty-tag-tree.md`

## Stage #1：Supabase 与 store 删除能力

### Task #1：扩展 taxonomy 删除契约

**Status:** Designed

**Files:** Modify `src/api/taxonomy.client.ts`, `src/api/supabase-taxonomy.client.ts`, relevant tests

为 Supabase taxonomy client 增加按深度倒序删除 Tag 子树的操作。HTTP client 不实现该操作，避免在仅 Supabase Direct 范围内引入未确认的 Backend 契约。

### Task #2：实现 Tag 子树乐观删除

**Status:** Designed

**Files:** Modify `src/features/notes/noteStore.ts`, relevant tests

从现有 Tag 列表推导目标根及全部后代，验证聚合笔记数为 0 后乐观移除；远端失败时按现有版本队列规则回滚。当前筛选落在被删子树时清空筛选。

## Stage #2：侧栏与确认交互

### Task #3：接入 Tag 行删除入口

**Status:** Designed

**Files:** Modify `src/pages/home/HomeSidebar.tsx`, `src/pages/home/HomePage.tsx`, relevant tests

复用已有删除 slot，在聚合数为 0 的根 Tag 或子 Tag 行上于 hover/focus 时显示垃圾桶；删除按钮不触发行筛选。

### Task #4：实现简洁确认与反馈

**Status:** Designed

**Files:** Modify `src/pages/home/HomePage.tsx`, `src/i18n/locales/*/home.ts`, relevant tests

复用现有应用内弹窗样式，确认句仅为“确认删除 #完整路径？”。确认期间禁用重复提交；成功显示低干扰通知，失败回滚并显示失败通知。

## Stage #3：验证与记录

### Task #5：运行验证并回写实际结果

**Status:** Designed

**Files:** Modify this plan and implementation documentation as needed

运行定向测试、完整测试和 `npm run build:supabase`。开发完成后补充实际改动、验证结果与 Conventional Commit；未经用户验收不归档本计划。
