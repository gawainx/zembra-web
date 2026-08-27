# R047 笔记卡片 Markdown 外链样式设计

## 关联需求

需求澄清见 [r047-note-card-markdown-external-link-style.md](../../request-clarify/home-ui/r047-note-card-markdown-external-link-style.md)。

## 设计决策

复用 `NoteMarkdownContent` 已有的 Markdown `a` 元素 renderer，在排除 `zembra-note://` 和 `zembra-tag://` 后的标准外链节点上，将现有强调蓝替换为语义 token `--color-field`，并添加下划线。`--color-field` 已在 `src/styles/main.css` 的明暗主题中映射到 Bonofix 红色 field 色系，无需新增 palette 或语义 token。

## 边界与影响

内部笔记链接在 renderer 中提前返回 `NoteLinkPreview`，标签链接提前返回 `note-tag-chip`，两者不会获得外链样式。本次不新增组件、抽象、依赖或数据访问逻辑；唯一调用点正是该 renderer，局部修改能够清晰承载需求。

## 验证策略

保留既有外链语义与安全属性断言，并增加可观察的链接装饰语义检查。测试不绑定 token 名称、颜色值或 CSS class，实现后执行相关 Vitest 用例和完整生产构建。
