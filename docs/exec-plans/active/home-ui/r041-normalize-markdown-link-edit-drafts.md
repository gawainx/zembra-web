# r041-normalize-markdown-link-edit-drafts 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r041-normalize-markdown-link-edit-drafts.md`
- 设计文档：`docs/design-docs/home-ui/r041-normalize-markdown-link-edit-drafts.md`

## Stage #1: 规整展示与编辑草稿

### Task #1: 修正编辑器同步与草稿初始化

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, Modify `src/pages/home/LiveMarkdownEditor.tsx`

**功能:** 让传入编辑器的内容和双击生成的草稿都使用标准 Markdown。

**验证:** 原始异常内容不会在编辑器中重新出现。

### Task #2: 覆盖完整用户场景

**Status:** Finished

## 执行记录

已在编辑草稿创建和编辑器外部值同步时使用标准化后的 Markdown，避免原始异常字符串重新覆盖编辑器内容。测试覆盖用户提供的完整 `#cuda` 内容在卡片中的标题外链和纯函数规整结果。`npm run test -- src/pages/home/liveMarkdownEditorUtils.test.ts src/pages/home/HomePage.test.tsx` 通过 38 项测试，`npm run test` 通过 131 项测试，`npm run build` 通过。

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**功能:** 使用完整 `#cuda` 内容验证卡片链接和双击编辑内容。

**验证:** 对应测试、全量测试和生产构建通过。
