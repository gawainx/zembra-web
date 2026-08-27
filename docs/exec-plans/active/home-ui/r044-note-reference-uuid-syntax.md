# r044-note-reference-uuid-syntax 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r044-note-reference-uuid-syntax.md`
- 设计文档：`docs/design-docs/home-ui/r044-note-reference-uuid-syntax.md`

## Stage #1: 统一双链 UUID 语法

### Task #1: 复用完整 ID 识别规则

**Status:** Finished

**Files:** Modify `src/pages/home/homeUtils.ts`, Modify `src/pages/home/NoteMarkdownContent.tsx`

**功能:** 让提交解析和 Markdown 渲染同时接受 Mention 当前产生的完整 note ID，并保留 32 位无连字符 UUID。

**验证:** 提交解析和渲染调用共享同一规则。

### Task #2: 补齐行为回归测试

**Status:** Finished

**Files:** Modify `src/pages/home/homeUtils.test.ts`, Modify existing home page behavior tests as needed

**功能:** 覆盖带连字符 UUID 的双链解析、短 ID 展示和 hover 预览。

**验证:** `npm run test`、`npm run build`。

## 执行记录

共享双链规则现在接受双中括号内不含空白或方括号的完整 note ID，Mention 输出的 `db4b2d02-fdfa-4915-8bfe-edfe685f54d11` 因此可被提交解析和 Markdown 渲染共同消费。规则继续兼容既有 32 位 ID，并新增截图 ID、短 ID 和 hover 预览的行为覆盖。`npm run test` 通过 20 个文件、133 项测试；`npm run build` 通过，保留既有大 chunk 警告。
