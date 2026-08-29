# r053-editor-body-font-weight 设计文档

日期：2026-08-29

## 方案

移除 `.live-markdown-editor-content` 的固定 `font-weight: 500`，使编辑器普通文本继承全局 IBM Plex Sans 的默认 400 字重，并与 Note Card 正文保持一致。现有 Markdown 标题规则和 Tiptap 的手动加粗 mark 继续使用各自的语义字重，不新增组件、状态或依赖。

## 验证

执行生产构建，确认样式编译和产物拆包保持正常。
