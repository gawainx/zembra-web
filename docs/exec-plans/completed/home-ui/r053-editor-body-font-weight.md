# r053-editor-body-font-weight 开发计划

## 关联文档

- 设计文档：`docs/design-docs/home-ui/r053-editor-body-font-weight.md`

## Stage #1: 对齐编辑器与 Note Card 正文字重

### Task #1: 移除编辑器普通文本的固定字重

**Status:** Finished

**Files:** Modify `src/styles/main.css`

**功能:** 移除编辑器根元素的 `font-weight: 500`，让普通文本继承全局默认 400；保留 Markdown 标题与手动加粗的语义字重。

**验证:** `npm run build`。

## 执行记录

已移除编辑器普通文本的固定 Medium 字重，普通输入与 Note Card 正文均使用继承的常规字重。标题和用户主动加粗内容未改动。
