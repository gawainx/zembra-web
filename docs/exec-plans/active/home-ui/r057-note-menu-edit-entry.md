# r057-note-menu-edit-entry 执行计划

日期：2026-08-31

## 关联设计文档

- 设计文档：`docs/design-docs/home-ui/r057-note-menu-edit-entry.md`

## 实施项

### Task #1：迁移编辑入口

**Status:** Finished

**Files:** Modify `src/pages/home/NoteCard.tsx`

移除展示态 note card 的双击事件，复用现有右上角三点操作菜单，新增“编辑笔记”菜单项。该项调用已有 `onEditStart`，在另一张卡片正在编辑时禁用，保持单草稿锁定不变。

### Task #2：补齐多语言与菜单语义

**Status:** Finished

**Files:** Modify `src/i18n/locales/zh-CN/home.ts`, `src/i18n/locales/zh-TW/home.ts`, `src/i18n/locales/en-US/home.ts`, `src/pages/home/NoteCard.tsx`

新增 `note.edit.action` 三语言文案；为既有三点菜单补充 `aria-haspopup="menu"` 与菜单项角色，确保编辑入口可被辅助技术识别。

### Task #3：回归验证

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`

测试覆盖双击不进入编辑、从菜单进入编辑、编辑期间其他卡片的编辑菜单项禁用，以及 Mention 菜单行为不回归。

## 验证结果

- `npm test -- --run src/pages/home/HomePage.test.tsx`：31 项通过。
- `npm run build:backend`：通过。
- `npm run build:supabase`：通过。

## 状态

已完成开发并等待用户验收；未经用户验收不得移动至 `docs/exec-plans/completed/`。
