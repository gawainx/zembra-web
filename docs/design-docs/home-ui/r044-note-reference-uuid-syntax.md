# r044-note-reference-uuid-syntax 设计文档

日期：2026-08-27

需求澄清文档：`docs/request-clarify/home-ui/r044-note-reference-uuid-syntax.md`

## 方案

将 `src/pages/home/homeUtils.ts` 中的双链完整 ID 正则定义为模块导出，并由 `NoteMarkdownContent` 直接复用。规则使用同一个捕获组返回目标 ID，接受 `[[...]]` 中不含空白或方括号的 ID 文本，不再猜测 `notes.id` 的 UUID 格式。Mention 继续写入原始 `note.id`，不增加任何 ID 生成、转换、缓存或远端预校验逻辑。

## 模块关系

```text
NoteCard Mention → HomePage 写入 [[note.id]]
                              ↓
homeUtils 共享双链规则 → 提交 links / Markdown 渲染短 ID与预览
```

## 复用与边界

复用现有 `parseNoteLinks()`、`NoteMarkdownContent`、`NotesClient.getNote()` 和 store 内存预览缓存。两个现有调用点存在实际重复的 ID 规则；导出同一正则可以避免生成、提交和展示各自采用不同语法。无需新增 client、service、缓存层或依赖。

## 验证

在 `homeUtils` 单元测试中覆盖截图中 Mention 产生的 ID 和保留的 32 位格式；在首页既有行为测试中覆盖该 ID 的卡片短 ID 与 hover 预览调用。运行全量测试和生产构建。
