# R061 中文 Tag 展示修复需求澄清

日期：2026-09-04

## 问题与结论

Note Card 展示态会把正文中的中文 tag 显示为 `%E8...` 形式。调研确认 tag 输入、`parseTagNames()`、提交 payload 与 taxonomy 数据均保留原始 Unicode；问题仅发生在 Markdown 自定义 link 转为 React 元素后，renderer 从已完成 URI 百分号编码的 `href` 截取可见文字。

## 澄清结果

- 采用方案 A：tag chip 使用内部 link 的原始 `children` 作为可见文字，不对 `href` 解码。
- 覆盖中文、中英混合与中文层级 path 等 Unicode tag，并保持 ASCII tag 行为。
- 不修改 tag 允许字符、层级分隔、输入建议、保存契约、数据源或视觉样式。

## 验收标准

1. `#自动化寻优` 在 Note Card 中显示原始中文，不显示百分号编码。
2. `#研发/AI工具` 等层级或中英混合 tag 保持完整 path。
3. ASCII tag、外链和双链分支不发生行为回退。

