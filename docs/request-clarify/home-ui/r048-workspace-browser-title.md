# R048 Workspace 浏览器标题

## 需求范围

用户进入 workspace 后，浏览器页面标题显示为 `<workspace-name> - Zembra`。标题使用 workspace 的纯名称，不包含笔记数量等列表展示信息。

## 范围边界

仅更新 HTML document title，不修改页面内 workspace 切换器、入口页、数据源选择或 workspace 的展示文案。workspace 没有名称时，沿用现有显示名回退规则。

## 验收条件

Backend 和 Supabase 数据源进入 workspace 后均显示当前 workspace 名称加 ` - Zembra`；切换 workspace 后标题同步更新。
