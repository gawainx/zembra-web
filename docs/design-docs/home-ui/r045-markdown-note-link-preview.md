# r045-markdown-note-link-preview 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r045-markdown-note-link-preview.md`

## 方案

`NoteLinkPreview` 在成功加载目标笔记后，复用同文件的 `NoteMarkdownContent` 渲染 `preview.content`，并透传原有 `onLoadNotePreview` 回调。加载中和失败时继续返回纯文本反馈。浮层从 `span` 改为 `div`，使 Markdown 生成的段落、列表和代码块保持有效 DOM 结构。

## 模块关系

```text
双链 hover → loadNotePreview → NoteMarkdownContent → 现有 Markdown / tag / 双链渲染
```

## 复用与边界

复用 `NoteMarkdownContent`、其内部 remark 插件以及预览加载回调，不新增 renderer、缓存、组件、依赖或数据访问接口。当前卡片正文和浮层正文是两个相同的渲染调用点，复用能够避免 Markdown 规则分叉。

## 验证

扩展首页双链预览行为测试，验证预览中的强调 Markdown 使用语义元素渲染。运行全量测试和生产构建。
