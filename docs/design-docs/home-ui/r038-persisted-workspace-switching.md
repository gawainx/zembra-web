# r038-persisted-workspace-switching 设计

日期：2026-08-26

需求澄清文档：`docs/request-clarify/home-ui/r038-persisted-workspace-switching.md`

## 设计决策

新增轻量 `WorkspaceContext`，由 `DataSourceGate` 在数据源与 workspace 已激活后提供当前 workspace、可选 workspace 和切换函数。该上下文是门禁层和路由首页之间唯一共享状态，避免 HomePage 重复实现认证、RLS 查询或数据源 client 创建。

backend 继续复用既有 workspace API 与存储 key；Supabase 新增独立存储 key，避免与 backend workspace ID 混用。两个门禁在读取 workspace 列表后仅对有效的已保存选择自动激活；普通首次选择仍使用既有门禁确认入口。

HomePage 复用已存在的加载函数。workspace ID 变化时重置筛选并重新加载 notes、fields、tags 与每日统计；顶部通过原生 select 展示当前 workspace 并调用 context 切换函数。数据源 badge 删除。

## 不变项

不新增网络协议、数据表依赖或独立 client；workspace 可见性仍以 backend 响应和 Supabase RLS 为准。
