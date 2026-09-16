# R067 行内代码支持设计

## 现状与复用

LiveMarkdownEditor 的 StarterKit 已包含 Code，支持反引号输入、Markdown 读取与输出；NoteMarkdownContent 已由 ReactMarkdown 渲染行内 code。markdown.css 已为两处提供共享等宽字体、背景和文字语义 token，亮暗主题均有对应 palette。

## 实施方案

复用现有粘贴函数，在纯文本插入时仅将单行单反引号代码转换为 Code mark，保留其他文本和外部 HTML 隔离规则。在已有工具文件增加局部文本分段 helper，跳过转义反引号、多反引号和未闭合语法，不引入依赖或新的服务层。编辑器标签 decoration 跳过 Code mark，保证代码字面量。卡片沿用现有 renderer，不重复实现解析器。

## 验证

覆盖普通文本粘贴、行内代码粘贴、反引号输入、保存与重新编辑、代码内标签字面量；验证卡片 code 语义。运行相关自动化测试及两种生产构建，不使用浏览器验证，不断言静态视觉样式。
