# R069 移除 Field 删除交互执行计划

## 状态

实现与自动化验证完成，等待用户验收；保留于 active，不自动归档。

## 实施记录

1. 检查远端与本地一致，先向用户展示 Field 名称和数量保留、删除入口移除的目标示意图。
2. 复用 NavItem 的普通导航分支，移除 HomePage 的 Field 删除 props、状态、事件和弹窗；删除不再使用的 FieldDeleteDialog，保留 Tag 交互与底层 API。
3. 将原 Field 删除测试替换为不暴露删除交互且仍可筛选的行为测试，不断言静态样式。
4. 补写当前设计、计划和进度记录，不修改历史需求文档或数据库契约。

## 验证结果

- `npm test -- src/pages/home/HomePage.test.tsx`：41 项通过，包括 Field 导航和 Tag 删除回归。
- `npm run build:backend`、`npm run build:supabase`：均通过，无超大 chunk 警告。
- 按 React 检查技能核对组件改动：清除失效状态、事件与导入，复用既有导航语义，无新增请求或依赖。
- 未使用浏览器或 Computer Use；视觉与实际操作等待用户验收。

## 边界

本次只移除产品入口，底层删除方法继续保留且未修复。数据库契约和 vendor 内容、指针均保持原样。
