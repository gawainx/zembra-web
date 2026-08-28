# R048 Workspace 浏览器标题设计

## 关联需求

需求澄清见 [r048-workspace-browser-title.md](../../request-clarify/home-ui/r048-workspace-browser-title.md)。

## 设计决策

复用 `WorkspaceProvider` 的活动 workspace 上下文，在首页通过 effect 写入 document title。为避免 Backend 数据源的现有导航名称包含笔记数量，活动 workspace 补充仅用于标题的纯名称字段；Supabase 继续复用已有 workspace 名称和回退值。

## 验证策略

新增行为测试，验证当前 workspace 激活后 document title 的值，以及切换 workspace 后标题同步变化。执行相关 Vitest 用例和生产构建。
