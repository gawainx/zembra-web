# r021 Bonofix 启发的全局主题需求澄清

日期：2026-08-23

## 需求理解

用户希望将 Logseq Bonofix 主题中适合 Zembra 的视觉元素迁移为产品的统一视觉语言，重点包括字体、tag 展示、明暗配色和长期写作场景下的低干扰体验。迁移目标是形成高辨识度的 Bonofix 风格 Zembra，而非复制 Logseq 的页面结构、功能或源码实现。

## 调研结论

Bonofix 定位为面向 bullet journal 和长期专注写作的简洁主题，其 README 明确说明视觉风格受 Bujo Theme 和 Notion 启发。主题以 IBM Plex Sans 为全局字体，明亮主题使用暖白、浅灰与蓝色强调，暗色主题使用炭灰与浅色文字；tag 为蓝底白字的圆角胶囊，复选框为圆形，链接、代码、引用和任务项采用克制的内容强调。调研来源为 [Bonofix README](https://github.com/Sansui233/logseq-bonofix-theme/blob/master/README.md) 与 [主题 CSS](https://github.com/Sansui233/logseq-bonofix-theme/blob/master/custom.css)。

Bonofix 源码仓库未提供许可证文件。本需求只采纳经调研确认的视觉特征和体验原则，不复制其 CSS、图标、图片或其他源码资产。

## 仓库现状关联

Zembra 目前通过 `src/styles/main.css` 集中定义明暗主题语义 token，并由 `ThemeProvider` 在 `light` 和 `dark` 间切换。首页已有笔记卡片展示态 tag、`LiveMarkdownEditor` 的编辑态 tag chip、Markdown 内容渲染、侧栏、设置页和弹窗，能够在现有 token 和组件结构中完成主题迁移，不需要改变笔记存储、tag 层级、API 或编辑器的 Markdown 字符串契约。

首页展示态 tag 当前为低饱和浅色 chip，编辑态 tag chip 也使用浅色背景；这与已确认的蓝色实心圆角 tag 目标不同。现有主题强调色为青绿色，背景偏冷灰；需要统一替换为 Bonofix 风格的语义色板，并覆盖明亮和暗色模式。

## 兼容代价评估

保留当前青绿色、冷灰背景和浅色 tag 作为并行视觉路径，需要在每个 token、组件状态和验收场景中维护双重分支，增加测试范围与维护成本，也会让页面之间出现不一致的品牌识别。用户已确认按 Bonofix 风格正向替换，不保留旧视觉路径；明暗主题切换能力继续保留。

## 范围确认

本轮后续设计和实现纳入全局主题基础与首页写作区完整迁移：IBM Plex Sans、暖白与炭灰的明暗色板、Bonofix 风格强调蓝、展示态和编辑态 tag、圆形复选框、Markdown 的链接、代码与引用样式、低对比导航与表面层次。设置页、弹窗和通知等全局界面随字体与语义 token 更新，保证视觉一致。

不纳入 Logseq 专有页面布局、journal 标题日历 emoji、block 子弹线、query table、Logseq 插件界面或任何 Logseq 功能迁移。不复制 Bonofix 源码、图标、截图和其他资产。

## 已确认决策

用户确认采用“全局主题基础加首页写作区完整迁移”，并采用“高辨识度迁移”：IBM Plex Sans、Bonofix 风格的蓝色实心 tag、暖白与炭灰明暗配色、圆形复选框和 Markdown 内容细节均纳入范围。用户同时要求将这套视觉语言写入 `AGENTS.md` 作为后续开发的全局约束，防止风格漂移。
