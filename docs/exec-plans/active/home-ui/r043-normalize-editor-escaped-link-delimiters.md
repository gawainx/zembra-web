# r043-normalize-editor-escaped-link-delimiters 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r043-normalize-editor-escaped-link-delimiters.md`
- 设计文档：`docs/design-docs/home-ui/r043-normalize-editor-escaped-link-delimiters.md`

## Stage #1: 修复编辑器转义链接边界

### Task #1: 规整已观察到的转义链接

**Status:** Finished

**Files:** Modify `src/pages/home/liveMarkdownEditorUtils.ts`, Modify `src/pages/home/liveMarkdownEditorUtils.test.ts`, Modify `src/pages/home/NoteMarkdownContent.tsx`, Modify `src/pages/home/HomePage.test.tsx`

**功能:** 将编辑器产生的 `\\[标题\\](https://URL)` 还原成标准 Markdown 链接，同时在 Markdown 已被解析成“标题文本、URL 链接、结束括号文本”时按同一严格结构恢复链接标题。

**验证:** 工具函数测试、全量测试、生产构建、已登录 Chrome 页面复查。

## 执行记录

Chrome 已登录页面确认该笔记的编辑器 Markdown 值为 `#cuda \\[标题\\](https://github.com/…)`。规整入口将这条确定结构还原成标准 Markdown；Markdown 解析后仍遗留的“标题文本、完整 URL 链接、结束括号文本”三节点序列也按相同 URL 校验重组成标准链接。Chrome 页面实测卡片链接文字为标题、链接目标为 GitHub URL，双击编辑显示标准 Markdown。`npm run test` 通过 20 个文件、132 项测试，`npm run build` 通过；构建保留既有大 chunk 警告。
