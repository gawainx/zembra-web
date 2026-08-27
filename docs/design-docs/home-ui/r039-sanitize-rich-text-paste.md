# r039-sanitize-rich-text-paste 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r039-sanitize-rich-text-paste.md`

## 方案

复用 `LiveMarkdownEditor` 的 Tiptap `editorProps` 入口，增加一个纯文本粘贴处理函数。函数阻止浏览器默认的 HTML 粘贴，读取剪贴板的 `text/plain`，再通过当前 ProseMirror 选区插入无 mark 的文本节点。编辑器既有 `onUpdate` 会继续把结果序列化为 Markdown 并回写父级草稿，无需新增状态、组件、client、依赖或解析器。

```text
剪贴板 HTML + text/plain
          ↓
LiveMarkdownEditor paste handler
          ↓ 只取 text/plain
ProseMirror 无样式文本节点
          ↓
既有 Markdown 状态、提交和卡片渲染
```

这种处理仅隔离来源格式，不影响用户主动输入的 Markdown、已有工具栏命令、tag suggestion 或只读卡片渲染。

## 验证策略

在首页交互测试中模拟同时包含 `text/html` 和 `text/plain` 的粘贴，验证编辑器内容只来自纯文本数据且不产生富文本语义节点；同时保留现有 Markdown 工具栏和提交测试。运行对应测试、全量测试和生产构建。
