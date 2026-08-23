# r021 Bonofix 启发的全局主题设计

日期：2026-08-23

需求澄清文档：[r021 Bonofix 启发的全局主题需求澄清](../../request-clarify/home-ui/r021-bonofix-inspired-global-theme.md)。

## 设计目标

在不改变数据、路由、编辑器或 API 契约的前提下，将 Zembra 的共享样式 token 和首页写作组件更新为 Bonofix 启发的统一视觉语言。主题切换继续保持现有的 `light` 与 `dark` 状态和本地存储行为。

## 复用与边界

复用 `src/styles/main.css` 作为颜色、字体和 Markdown 样式的唯一维护入口，复用 `ThemeProvider` 的主题切换机制，复用 `NoteCard` 的展示态 tag 渲染和 `LiveMarkdownEditor` 的编辑态 tag decoration。此需求不增加 React 组件、状态、client、接口或依赖包；外部字体通过 Google Fonts 的 IBM Plex Sans 样式表加载，并保留系统字体回退栈。

## 样式策略

| 层级 | 实现位置 | 设计决策 |
| --- | --- | --- |
| 全局字体 | `src/styles/main.css` | 加载 IBM Plex Sans，并作为正文、表单与编辑器继承字体的首选字体。 |
| 主题色板 | `src/styles/main.css` | 保持现有语义 token 名称，分别改为暖白/深灰褐的明亮色板和炭灰/浅灰的暗色色板，以 Bonofix 蓝承担交互强调。 |
| 表面层次 | `src/styles/main.css` | 降低卡片、菜单和弹窗边框与阴影的视觉重量，保留语义 token 的调用方式。 |
| Markdown 内容 | `src/styles/main.css` | 更新引用、代码和任务复选框；展示态任务复选框改为圆形，只读语义保持不变。 |
| tag | `src/pages/home/NoteCard.tsx` 与 `src/styles/main.css` | 展示态与编辑态均改为强调蓝背景、白字和圆角胶囊，保留完整层级路径和已有文本内容。 |

## 视觉关系

```text
主题 token
├─ 明亮：暖白背景 → 浅灰表面 → 深灰褐文字 → 强调蓝交互
├─ 暗色：炭灰背景 → 深灰表面 → 浅灰文字 → 浅亮蓝交互
└─ 共享组件
   ├─ 卡片、侧栏、设置、弹窗：继承表面与边框 token
   ├─ 展示态 tag：强调蓝底 + 白字
   ├─ 编辑态 tag：强调蓝底 + 白字
   └─ Markdown：链接、代码、引用、圆形任务框
```

## 验收标准

- 明亮和暗色模式均使用 IBM Plex Sans、Bonofix 风格蓝色强调与统一语义色板。
- 首页展示态 tag 与编辑器内 tag 都显示为蓝底白字圆角胶囊，文字和层级路径保持可读。
- Markdown 任务项显示为圆形只读复选框；链接、代码与引用在两种主题中可辨识。
- 现有主题切换、笔记创建编辑、tag 筛选和设置页交互不发生行为回归。
- 不新增 npm 依赖，不修改数据、API 或 Markdown 存储格式。
