# r038-persisted-workspace-switching 需求澄清

日期：2026-08-26

## 目标

应用启动时恢复用户上一次有效选择的 workspace 并直接进入内容流；首页左上角移除数据源名称 badge，改为显示当前 workspace，并支持在已授权 workspace 间下拉切换。

## 范围

backend 与 Supabase 两种数据源均支持各自的 workspace 持久化、恢复与顶部切换。恢复的 workspace 不再可用时清除对应持久化值并展示既有选择门禁。切换 workspace 后更新数据源 scope 并重新加载首页内容。

## 验收标准

已保存且仍可访问的 workspace 启动后直接展示首页；顶部只展示当前 workspace 名称和切换控件，不展示 Supabase 或 Local badge；切换后首页数据来自新 workspace，刷新后仍保持该选择；无保存或无效选择时保留既有选择流程。
