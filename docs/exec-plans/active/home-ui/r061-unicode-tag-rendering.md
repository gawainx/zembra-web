# R061 中文 Tag 展示修复执行计划

日期：2026-09-04

状态：已实现，等待用户验收

设计文档：`docs/design-docs/home-ui/r061-unicode-tag-rendering.md`

## Stage 1：修复展示数据来源

- [x] Task 1.1：确认 Unicode tag 的输入、解析和内部 link 节点仍保留原始文本。
- [x] Task 1.2：复用 tag link 的 `children` 渲染 chip，不再从编码后的 `href` 提取展示文字。
- [x] Task 1.3：提交实现，提交为 `c68de7e6`。

## Stage 2：回归验证

- [x] Task 2.1：增加中文、中英混合层级 path 和 ASCII tag 的用户可见行为测试。
- [x] Task 2.2：运行定向测试与完整测试。
- [x] Task 2.3：运行 Backend 与 Supabase 两种生产构建，确认无超大 chunk 警告。
- [x] Task 2.4：检查 diff 格式与最终工作区状态。

## 变更边界

- 不新增依赖、模块、client、service 或状态。
- 不修改 tag 的解析、保存、筛选、层级或视觉规则。
- 未经用户验收，本计划保留在 `active/`，不归档。

## 验证记录

- `npx vitest run src/pages/home/NoteMarkdownContent.test.tsx`：通过，1 个测试文件、2 项测试。
- `npm test`：通过，23 个测试文件、143 项测试。
- `npm run build:backend`：通过，无超过 500 kB 的 JavaScript chunk 警告。
- `npm run build:supabase`：通过，无超过 500 kB 的 JavaScript chunk 警告。
- `git diff --check`：通过。

