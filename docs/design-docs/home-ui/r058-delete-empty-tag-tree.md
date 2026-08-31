# r058-delete-empty-tag-tree 设计文档

日期：2026-08-31

需求澄清文档：`docs/request-clarify/home-ui/r058-delete-empty-tag-tree.md`

## 核心方案

复用 `HomeSidebar` 已有 `NavItem` 的删除 slot、`HomePage` 已有应用内删除确认弹窗视觉模式，以及 `TaxonomyClient` / notes store 的数据边界，不新增 UI 组件、数据访问层或依赖。Tag Tree 行扩展为可选删除入口，只有其聚合笔记数为 0 时传入删除动作。

`HomePage` 持有待删除 Tag 根节点和删除状态。确认后调用 store 删除 action；若当前筛选路径为目标根或其后代，立即清空 Tag 筛选。确认内容只渲染“确认删除 #{{tag}}？”，不增加关联笔记、级联或不可恢复等说明文字。

## Supabase Direct 删除流程

`TaxonomyClient` 增加删除 Tag 子树的能力，Supabase 实现以 workspace scope 删除已解析出的子树 ID。store 从现有 `tags` 状态建立目标根及所有后代集合，按 `depth` 从大到小排序，先乐观移除完整子树，再通过既有实体串行队列提交远端删除。任一步失败时，仅当没有较新的同实体变更时恢复删除前的 `tags` 与筛选状态，并向页面抛出错误。

该能力不需要 schema migration：共享 schema 已提供 `tags` DELETE 权限，但 `parent_tag_id` 使用 `ON DELETE RESTRICT`，因此深度倒序是必要的。没有关联笔记是 UI 的准入条件，远端删除失败仍作为并发或数据不同步的安全兜底处理。

## 组件与状态

| 模块 | 改动 |
| --- | --- |
| `src/api/taxonomy.client.ts` | 为 taxonomy 边界声明 Tag 子树删除能力；HTTP 实现维持不支持，避免猜测后端接口。 |
| `src/api/supabase-taxonomy.client.ts` | 按传入的深度倒序 Tag ID、workspace scope 删除 `tags` 行，并记录不含敏感数据的成功/失败日志。 |
| `src/features/notes/noteStore.ts` | 推导子树、执行乐观删除、失败回滚，并在删除影响当前筛选时清空 `selectedTag`。 |
| `src/pages/home/HomeSidebar.tsx` | 让根 Tag 与子 Tag 行复用删除 slot；仅向聚合数为 0 的行暴露垃圾桶。 |
| `src/pages/home/HomePage.tsx` | 管理确认弹窗与 Tag 删除反馈。 |
| `src/i18n/locales/*/home.ts` | 添加 Tag 删除标题、确认、取消、删除中和失败通知所需文案；确认句保持最简。 |

## 测试与验证

| 类型 | 覆盖 |
| --- | --- |
| Supabase client 测试 | 删除按从叶到根的顺序，且每次请求带 workspace scope。 |
| Store 测试 | 空子树乐观删除与失败回滚；当前筛选在子树内时清空。 |
| 首页测试 | 仅聚合数为 0 的根/子 Tag 出现删除入口；确认、取消、成功与失败反馈符合需求。 |
| 回归验证 | 运行相关测试、完整测试及 `build:supabase`，确认没有超大 chunk 警告。 |
