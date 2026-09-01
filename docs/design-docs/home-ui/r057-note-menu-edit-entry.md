# r057-note-menu-edit-entry 设计文档

日期：2026-08-31

## 目标

将首页 note card 的编辑入口从展示态卡片的双击手势迁移到右上角“笔记操作”三点菜单，避免误触，同时保持原地编辑、草稿解析、提交和单卡片编辑锁定行为不变。

## 实际方案

复用 `src/pages/home/NoteCard.tsx` 已有的操作菜单状态和菜单容器，不新增组件、client、store 或依赖。展示态卡片不再绑定 `onDoubleClick`；菜单新增位于 Mention 之前的“编辑笔记”项，选择后调用既有 `onEditStart(note)`。当其他卡片已拥有编辑草稿时，该菜单项禁用，继续沿用 `HomePage` 的 `editingNoteId` 约束。

菜单触发器增加 `aria-haspopup="menu"`，菜单与各项使用既有按钮语义配合 `menu`/`menuitem` 角色，使入口能通过可访问性名称定位。三种现有语言资源增加 `note.edit.action` 文案。

## 影响范围

| 类型 | 内容 |
| --- | --- |
| 修改 | `NoteCard` 的编辑触发事件与操作菜单 |
| 修改 | `zh-CN`、`zh-TW`、`en-US` 的编辑菜单文案 |
| 修改 | 首页交互测试，覆盖双击无效、菜单编辑、编辑锁与 Mention 回归 |
| 不变 | 编辑提交、Field/Tag 解析、API Client、store 与 Markdown 编辑器 |

## 验证

执行 `npm test -- --run src/pages/home/HomePage.test.tsx`，31 项测试通过；执行 `npm run build:backend` 与 `npm run build:supabase`，两种生产构建通过且未出现超大 chunk 警告。
