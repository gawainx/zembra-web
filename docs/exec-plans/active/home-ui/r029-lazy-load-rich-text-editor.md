# r029-lazy-load-rich-text-editor 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r029-lazy-load-rich-text-editor.md`
- 设计文档：`docs/design-docs/home-ui/r029-lazy-load-rich-text-editor.md`

## Stage #1: 编辑器按需加载

### Task #1: 拆分富文本编辑器模块

**Status:** Finished

**Files:** Modify `src/pages/home/NoteEditor.tsx`

**功能:** 用 React `lazy()` 和 `Suspense` 将 Tiptap/ProseMirror 移出首页入口块，并保留加载期间可访问的稳定占位。

**验证:** 生产构建生成独立编辑器 JavaScript 块。

### Task #2: 补齐加载文案与回归验证

**Status:** Finished

**Files:** Modify `src/i18n/locales/*/home.ts`

**功能:** 为加载状态提供三语言文案，运行现有编辑器行为测试、全量测试和生产构建。

**验证:** `npm run test` 与 `npm run build` 通过。

## 执行记录

已将 `LiveMarkdownEditor` 改为 React `lazy()` 动态 import，并使用可访问的 `Suspense` fallback 保持编辑器区域高度。`npm run test -- src/pages/home/HomePage.test.tsx` 通过 27 项测试，`npm run test` 通过 126 项测试，`npm run build` 通过。构建结果由单一 1.35 MB JavaScript 入口变为 796.88 KB 首页入口和 549.09 KB 的独立编辑器块；两者 gzip 后分别为 237.05 KB 与 174.69 KB。
