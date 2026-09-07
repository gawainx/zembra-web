# R061 中文 Tag 展示修复设计

日期：2026-09-04

需求澄清：`docs/request-clarify/home-ui/r061-unicode-tag-rendering.md`

## WHAT

修复 `NoteMarkdownContent` 展示态把 Unicode tag 显示成 URI 百分号编码的问题，使 tag chip 始终展示用户输入的原始文本。

## WHY

现有 `remarkInlineTokens` 把 tag 转为内部 Markdown link，link 的 `url` 和文本子节点都保存原始 tag。后续 Markdown 转换会按 URI 规则编码 `href`，而 tag renderer 又从 `href` 截取标签，导致中文等非 ASCII 字符以 `%E...` 显示。原始文本子节点未被破坏，适合作为展示数据。

## HOW

### 复用与改动边界

继续复用 `remarkInlineTokens`、`createInternalLinkNode()` 和现有 `Components.a` renderer，仅把 tag 分支的文字来源从内部 URI `href` 改为 React `children`。`href` 继续用于识别 `zembra-tag://` 分支；note link 仍用自己的 URI payload 加载预览，普通外链仍走原 renderer。

不引入解码 helper 或新抽象。直接使用现有文本子节点可以避免非法 `%` 序列、重复解码等额外边界，也不改变 Markdown、API payload 或数据库契约。

### 测试设计

新增 `NoteMarkdownContent` 行为测试，断言中文 tag、中英混合层级 tag 与 ASCII tag 的可见文本，并确认页面不暴露 `%E8` 编码片段。测试只验证用户可观察结果，不绑定视觉 class 或样式值。

## 实际实现

- tag renderer 改为输出 `#{children}`。
- 新增 2 项组件测试，覆盖 Unicode、层级混合 path、URI 编码不可见和 ASCII 回归。
- 未修改数据访问、状态、样式、依赖或构建配置。

