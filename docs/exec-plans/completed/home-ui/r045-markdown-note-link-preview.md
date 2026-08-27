# r045-markdown-note-link-preview 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r045-markdown-note-link-preview.md`
- 设计文档：`docs/design-docs/home-ui/r045-markdown-note-link-preview.md`

## Stage #1: 渲染双链预览正文

### Task #1: 复用 Markdown 正文渲染

**Status:** Finished

**Files:** Modify `src/pages/home/NoteMarkdownContent.tsx`, Modify `src/pages/home/HomePage.test.tsx`

**功能:** 在加载成功的双链浮层中复用 note card 的 Markdown 渲染，并使用块级浮层容器。

**验证:** 预览中的强调 Markdown 以语义结构显示，加载与失败反馈不变。

### Task #2: 执行回归验证

**Status:** Finished

**Files:** No source file changes

**功能:** 验证全量测试和生产构建。

**验证:** `npm run test`、`npm run build`。

## 执行记录

双链预览在成功加载后复用 `NoteMarkdownContent`，Markdown、tag 和内嵌双链与 note card 保持一致；浮层由 `span` 改为 `div`，可有效承载段落、列表和代码块。加载与失败文本反馈保持不变。首页行为测试验证预览中的强调文本按语义结构渲染；`npm run test` 通过 20 个文件、133 项测试，`npm run build` 通过，保留既有大 chunk 警告。
