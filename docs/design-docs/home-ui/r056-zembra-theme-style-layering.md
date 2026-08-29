# r056-zembra-theme-style-layering 设计文档

日期：2026-08-30

## 目标

将单一全局 CSS 拆为可维护的主题层级，保持现有亮暗视觉和组件调用方式不变，并以 Zembra 名称标识主题文件，避免与 Logseq 的 Bonofix 主题混淆。

## 复用与边界

复用 `ThemeProvider` 写入 `html[data-theme]` 的现有机制、组件中的 `--color-*` 消费方式和 Vite 的 CSS import 处理；不新增 React 状态、主题运行时、依赖或组件级样式抽象。现有 `--palette-* → --color-* → 组件` 单向链路继续保留，差异仅在于其文件归属明确化。

| 层级 | 文件 | 职责 | 禁止内容 |
| --- | --- | --- | --- |
| 入口 | `src/styles/index.css` | 加载顺序 | 具体样式规则和 token 定义 |
| 基础 | `src/styles/foundations/` | reset、字体、尺寸 token | 主题物理颜色和内容选择器 |
| 主题 | `src/styles/themes/zembra-*.css` | palette、`color-scheme` | 结构选择器和 `--color-*` |
| 语义 | `src/styles/foundations/semantic-tokens.css` | `--color-*` 映射与主题无关的全局状态规则 | 物理颜色值 |
| 内容 | `src/styles/content/markdown.css` | Markdown 与编辑器内容结构 | palette 或语义 token 定义 |

## 命名

亮暗主题文件固定命名为 `zembra-bonofix-light.css` 与 `zembra-bonofix-dark.css`。`bonofix` 仅表示 Zembra 的视觉灵感来源，`zembra-` 前缀明确这些文件不是可与 Logseq 主题混用的主题包。

## 验证

执行 `npm run test`、`npm run build:backend` 与 `npm run build:supabase`。三项命令均通过，两个生产构建的 CSS 产物均为 41.15 kB，未出现超大 chunk 警告。
