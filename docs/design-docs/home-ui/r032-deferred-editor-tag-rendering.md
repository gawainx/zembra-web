# r032-deferred-editor-tag-rendering 设计文档

日期：2026-08-25

需求澄清文档：`docs/request-clarify/home-ui/r032-deferred-editor-tag-rendering.md`

## 方案

复用 `LiveMarkdownEditor` 现有的 ProseMirror inline decoration 扩展，只收紧 tag 正则的结束条件：tag 后必须紧跟空白字符才创建 decoration。该空白字符不属于 decoration，因此会保留在 Markdown 和编辑器文本中。

不新增状态、组件、依赖或解析器。候选菜单仍在输入 tag 查询时显示，用户选择候选后现有插入逻辑会同时写入结束空格，因此会立即完成 chip 渲染。
