# R065 嵌套标签父级名称对齐修复执行计划

日期：2026-09-12

状态：已实现，等待用户验收

设计文档：`docs/design-docs/home-ui/r065-nested-tag-label-alignment.md`

## 实际执行

- [x] 确认远端与本地 `master` 无分叉，工作区干净。
- [x] 复现并定位共享 `Button` 默认 `justify-center` 覆盖父级标签行原生按钮行为的回归来源。
- [x] 在 `TagTreeItem` 的父标签选择按钮添加 `justify-start`，不改变子标签缩进、树形数据、筛选或展开状态。
- [x] 运行首页层级标签行为回归和两种生产构建，核对无超大 chunk 警告。
- [x] 提交代码：`80ec57d fix(tags): align parent labels in sidebar`。

## 验证记录

- `npm run test -- src/pages/home/HomePage.test.tsx`：通过，1 个测试文件、32 项测试。
- `npm run build:backend`：通过，无超过 500 kB 的 JavaScript chunk 警告。
- `npm run build:supabase`：通过，无超过 500 kB 的 JavaScript chunk 警告。
- `git diff --check`：代码提交前通过。

## 变更边界

未修改标签 API、store、树构建、筛选、子标签展示、主题 token 或依赖。未经用户验收，本计划保留在 `active/`，不归档。
