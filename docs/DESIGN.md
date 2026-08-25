# DESIGN

本文档记录设计规范约束以及历史教训。

## 历史教训

### 主题色只能从 palette 到语义 token 单向流动

`src/styles/main.css` 中的 `--palette-*` 是亮暗主题唯一允许定义物理颜色的位置；`--color-*` 只能引用 palette 或其他语义 token；组件只能引用 `--color-*`。禁止在组件中写入 `white`、`black`、十六进制、`rgba()` 或 `color-mix()`，禁止将 palette token 直接用于组件。新增主题只覆写 palette，不新增组件级颜色例外。

### Tag chip 色彩只能消费语义 token

tag chip 的组件选择器只能使用 `--color-tag-chip-background` 与 `--color-tag-chip-text`，禁止直接使用 `--color-accent`、任意十六进制色或在组件内进行 `color-mix()`。主题 pigment 与合成规则统一维护在 `src/styles/main.css` 的亮暗主题 token 区；新增主题只覆写该区 token，禁止为单个组件追加颜色例外。

### 布局间距和边框只能由单一层级负责

页面和区域容器只负责区域间距；列表、表单和工具栏只负责同级元素 gap；card、编辑器、弹窗、菜单和通知等表面只负责自身 padding、圆角与一条真实 border；Markdown 只负责内容块内部节奏。组件不得通过外边距推挤相邻组件，禁止用 inset shadow 模拟第二道边框。间距、圆角和控件尺寸只能消费 `src/styles/main.css` 中的 `--space-*`、`--radius-*` 和 `--control-*` token。

### 2026-05-30 Role 图标标识不要擅自升级为 Badge

当需求明确要求“只用图标区分状态或类型”时，UI 实现必须保持图标本体表达，不得自行增加文本、背景、边框、圆角容器、chip、badge 或其他视觉 chrome。额外包装会改变信息层级和视觉重量，即使保留了图标，也违背了原始设计目标。

适用规则：
- 需求说“图标”时，默认实现为裸图标。
- 只有用户明确要求 badge、chip、label、tooltip 可见文本或状态胶囊时，才增加外框、背景或可见文本。
- 可访问性信息可以保留在 `aria-label`、`title` 或等价语义属性中，但不得变成可见 UI。
- 修改现有 card/header/action 区域时，先确认该区域只承担图标动作还是信息展示；不要把图标标识扩展成新的视觉组件。
