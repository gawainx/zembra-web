# r029-lazy-load-rich-text-editor 设计文档

日期：2026-08-24

需求澄清文档：`docs/request-clarify/home-ui/r029-lazy-load-rich-text-editor.md`

## 设计

复用 `NoteEditor` 和 `LiveMarkdownEditor` 的既有边界，不新增编辑器 service、状态层或依赖。`NoteEditor` 将现有静态模块引用改为 `lazy()` 引用，并用 `Suspense` 包裹编辑器。加载 fallback 只占用既有编辑区域的最小高度，并提供 `role="status"` 与 `aria-busy`。

```text
首页入口块
  └─ NoteEditor
       ├─ 编辑器加载提示
       └─ 按需块：LiveMarkdownEditor + Tiptap + ProseMirror
```

Vite 会将动态 import 输出为独立的带内容 hash 资源。Vercel 自动将这些静态资源通过自身 CDN 分发和缓存，本需求不配置 Cloudflare 或其他 CDN。

## 验证

构建输出必须存在独立的编辑器块；现有 HomePage 行为测试继续覆盖编辑器加载完成后的用户行为，并运行全量测试与生产构建。
