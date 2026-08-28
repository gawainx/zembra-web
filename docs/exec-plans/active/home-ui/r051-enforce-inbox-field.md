# r051-enforce-inbox-field 执行计划

设计文档：`docs/design-docs/home-ui/r051-enforce-inbox-field.md`

## 执行结果

- [x] 新增前端默认 Field 常量和解析函数，统一使用 `inbox`。
- [x] HTTP 创建和显式清空更新请求统一发送非空 Field。
- [x] Supabase 写入确保 Field 存在，并处理并发创建时的唯一键冲突。
- [x] 首页编辑没有 inline Field 时保留原 Field，缺失时回退 `inbox`。
- [x] 测试 mock 的全部笔记都关联 Field，HTTP 回归测试覆盖默认值。
- [x] 移除 `src` 内全部 mock client 和示例数据，测试数据仅保留在单元测试文件。

## 验证结果

2026-08-28 已通过 `npm test -- --run src/pages/home/HomePage.test.tsx src/app/App.test.tsx src/api/data-source-client.test.ts`，44 个测试全部通过；已通过 `npm run build`，生产构建无超大 chunk 警告。

## 状态

等待用户验收，保留在 active 目录。
