# r039-sanitize-rich-text-paste 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r039-sanitize-rich-text-paste.md`
- 设计文档：`docs/design-docs/home-ui/r039-sanitize-rich-text-paste.md`

## Stage #1: 净化富文本粘贴

### Task #1: 拦截编辑器的富文本粘贴

**Status:** Finished

**Files:** Modify `src/pages/home/LiveMarkdownEditor.tsx`

**功能:** 只从剪贴板读取纯文本，并在当前选区插入不带格式的文本。

**验证:** 富文本剪贴板中的 HTML 不会形成编辑器 mark。

### Task #2: 覆盖粘贴与既有编辑行为

**Status:** Finished

## 执行记录

`LiveMarkdownEditor` 已在 Tiptap 粘贴入口中阻止默认 HTML 粘贴，只读取并插入 `text/plain`。首页交互测试覆盖带 HTML 的外部剪贴板内容，`npm run test -- src/pages/home/HomePage.test.tsx` 通过 28 项测试，`npm run test` 通过 127 项测试，`npm run build` 通过。

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**功能:** 验证外部 HTML 粘贴被净化，现有 Markdown 编辑行为仍可用。

**验证:** 对应测试、全量测试和生产构建通过。
