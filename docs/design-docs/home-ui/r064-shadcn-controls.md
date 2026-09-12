# R064 shadcn/ui 控件收敛

## 当前需求边界

本次仅收敛到 shadcn/ui，不参考其他产品。保留既有主题 palette、页面布局、卡片内容结构、三语言文案和底部悬浮编辑器位置。用户已完成视觉验收并确认通过。

## 实际实现

| 现有入口 | 采用组件 | 行为与复用 |
| --- | --- | --- |
| 全站按钮、登录、设置、搜索与工作区输入 | Button、Input、Native Select | 保留现有回调、原生 select 语义与尺寸；统一 focus-visible、禁用状态和组合方式。 |
| 卡片操作、分类切换、工作区选择 | Dropdown Menu | Portal 避免祖先裁切，支持键盘导航、Esc、外部点击关闭与选中标记。 |
| 设置 | Dialog | 保留原分类和内容，统一模态焦点约束、Esc、外部关闭及焦点恢复。 |
| 空 Field、Tag 删除确认 | Alert Dialog | 保留原确认文案和乐观删除回调，初始焦点放在取消，外部点击不会误确认。 |
| 移动端侧栏 | Sheet | 保持左侧抽屉与桌面侧栏，复用既有导航内容，保留断点关闭与焦点返回。 |
| 后端同步启用 | Switch | 复用原保存、失败回滚、禁用和日志逻辑。 |
| 编辑器工具栏提示 | Tooltip | 复用现有三语言名称，鼠标悬停或键盘聚焦时显示。 |

共享 UI 层承接多处实际重复的交互；业务层继续使用原 API、store 和编辑器，不新增 client、service 或数据抽象。`TaxonomyDeleteDialogs.tsx` 与 `homeComposerTools.tsx` 从页面提取已有独立职责，页面只协调它们。Markdown 只读任务项、富文本编辑内核、笔记引用预览以及通知的业务逻辑继续复用现有实现。

## 主题与构建

组件源码基于官方 new-york-v4 registry，来源及 MIT 许可证见 `docs/references/shadcn-ui.md`。组件只消费现有语义颜色；Switch 尺寸加入非主题 layout token。未改 `themes/` 及颜色映射。`components.json` 提供组件维护入口，`cn` 仅合并 class。Radix 与 Floating UI 单独进入 `ui-primitives` chunk，富文本与数据源延迟加载边界继续保留。

## 与既有决策的关系

本需求以用户最新指令为准，仅替换控件技术实现。早期文档中的手写弹层实现不约束本次迁移，历史文档不修改；不新增页面布局设计或迁移编辑器位置。

## 验证与状态

现有业务回归、共享控件键盘与指针行为测试，以及 Backend、Supabase 生产构建作为提交门禁。测试验证 Portal 的可访问角色、焦点、选中、取消、写入回调和回滚，不断言颜色或 CSS class。实际结果记录于同名执行计划；视觉效果已由用户在本地 Supabase 服务验收通过；执行计划已归档至 completed。
