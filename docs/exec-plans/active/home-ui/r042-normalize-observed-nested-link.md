# r042-normalize-observed-nested-link 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r042-normalize-observed-nested-link.md`
- 设计文档：`docs/design-docs/home-ui/r042-normalize-observed-nested-link.md`

## Stage #1: 修复实测嵌套链接

### Task #1: 扩展 Markdown 规整规则

**Status:** Finished

**Files:** Modify `src/pages/home/liveMarkdownEditorUtils.ts`, Modify `src/pages/home/liveMarkdownEditorUtils.test.ts`, Modify `src/pages/home/LiveMarkdownEditor.tsx`

**功能:** 从内层显示文本恢复完整 HTTPS URL，并在外部草稿是异常格式时强制以规整 Markdown 重建编辑器文档。

**验证:** 实测字符串、单反斜杠变体与保护性非匹配用例通过。

### Task #2: 验证卡片与编辑态

**Status:** Finished

## 执行记录

已根据 Safari 已登录会话观察到的实际草稿，规整 `[标题]([https://URL](URL去掉协议))` 结构；编辑器在传入草稿仍为异常格式时会强制以规整 Markdown 重建文档，防止旧富文本节点残留。`npm run test -- src/pages/home/liveMarkdownEditorUtils.test.ts src/pages/home/HomePage.test.tsx` 通过 38 项测试，`npm run test` 通过 131 项测试，`npm run build` 通过。

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**功能:** 使用 Safari 实测字符串验证卡片外链和双击编辑草稿。

**验证:** 对应测试、全量测试、生产构建和 Safari 页面复查通过。
