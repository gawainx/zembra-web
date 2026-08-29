# r055-compact-dynamic-heatmap 设计文档

日期：2026-08-29

## 方案

复用 `DailyNotesHeatmap`、`NotesClient` 和现有 notes store，不新增数据层。热力图组件通过 `ResizeObserver` 读取侧栏实际宽度，并结合 `--heatmap-cell-size` 与 `--heatmap-cell-gap` 主题 token 计算可容纳列数；列数乘以每周 7 天得到统计日数。组件将该值传给 store，store 再传给 client。Supabase client 以传入天数生成连续日期统计，笔记写入后的元数据刷新复用最近一次加载的天数。

展示采用 7 行紧凑方块矩阵，方块尺寸与间距通过主题 token 消费，移除格内日期数字和底部首末日期。每格继续通过 `title`、`aria-label` 提供日期与笔记数，颜色等级和现有语义 token 保持不变。本次只影响 Supabase 真实统计；Backend 接口不扩展也不改变请求参数。

## 验证

更新首页行为测试，覆盖 63 个热力格与动态无障碍区域名称；运行完整测试及 Backend、Supabase 两种生产构建。
