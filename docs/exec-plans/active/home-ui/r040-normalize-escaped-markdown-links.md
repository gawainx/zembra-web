# r040-normalize-escaped-markdown-links 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r040-normalize-escaped-markdown-links.md`
- 设计文档：`docs/design-docs/home-ui/r040-normalize-escaped-markdown-links.md`

## Stage #1: 规整异常链接

### Task #1: 共享 Markdown 源文本规整规则

**Status:** Finished

**Files:** Modify `src/pages/home/liveMarkdownEditorUtils.ts`, Modify `src/pages/home/LiveMarkdownEditor.tsx`, Modify `src/pages/home/NoteMarkdownContent.tsx`

**功能:** 将明确的转义嵌套链接规整为标准 Markdown，并供编辑和展示链路复用。

**验证:** 异常链接保留标题和 URL，普通链接与非匹配文本不变。

### Task #2: 覆盖展示回归

**Status:** Finished

## 执行记录

已将编辑器与展示态共用的 Markdown 规整函数扩展为受限的异常链接修复，只在嵌套链接显示 URL 与目标 URL 相同的情况下规整为标准链接。`npm run test -- src/pages/home/liveMarkdownEditorUtils.test.ts src/pages/home/HomePage.test.tsx` 通过 37 项测试，`npm run test` 通过 130 项测试，`npm run build` 通过。

**Files:** Modify `src/pages/home/liveMarkdownEditorUtils.test.ts`, Modify `src/pages/home/HomePage.test.tsx`

**功能:** 验证既有卡片立即显示正确的外链语义。

**验证:** 对应测试、全量测试和生产构建通过。
