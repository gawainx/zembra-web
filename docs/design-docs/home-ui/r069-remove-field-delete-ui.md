# R069 移除 Field 删除交互

## 目标与范围

用户明确要求不修改数据库契约，将本次修复限定为 UI 和交互层面不呈现 Field 删除。所有 Field 保留名称、数量和筛选入口，数量为 0 时悬停或聚焦也不出现删除按钮；页面不再打开 Field 删除确认弹窗或调用删除动作。

```text
Fields
  @ inbox       12
  @ project      0
```

## 复用与实际实现

复用 HomeSidebar 的 NavItem 非删除分支，只从 HomePage 的 Field 导航中移除删除相关 props；继续使用既有 countFields 和 handleFieldSelect。移除 HomePage 中待删除 Field 状态、删除事件和弹窗渲染，同时删除 TaxonomyDeleteDialogs 中不再使用的 FieldDeleteDialog。TagDeleteDialog 和 Tag 删除入口保持现有行为。未新增组件、抽象或依赖，未扩展已较长页面的职责。

保留 store 与 API Client 已有删除方法，本需求只关闭产品交互入口，不修复或调用底层删除能力。数据库契约、migration 与 vendor 指针均未修改。

## 与历史决策的关系

本需求按用户最新决定撤除 R020 引入的 Field 删除界面，不再沿用其删除入口要求；历史文档保持原样。此前分析发现的软删除引用和全量使用量判定问题未在本次修复，不将隐藏入口表述为底层删除能力已修复。

## 验证

首页 41 项行为测试通过；新增回归覆盖空与非空 Field 数量、悬停和聚焦无删除入口、点击仍可筛选、不打开确认弹窗且不调用删除动作。原 Tag 删除测试通过。Backend 与 Supabase 两种生产构建通过，无超过 500 kB 的 JavaScript chunk 警告。未进行浏览器或 Computer Use 验证。
