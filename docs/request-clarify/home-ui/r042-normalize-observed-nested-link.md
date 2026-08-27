# r042-normalize-observed-nested-link 需求澄清

日期：2026-08-27

## 需求背景

通过用户 Safari 已登录会话直接检查到这条笔记的实际编辑草稿为 `#cuda [标题]([https://github.com/…](github.com/…))`：外层标题后没有反斜杠，内层显示文本保留完整 HTTPS URL，内层链接目标却缺少协议。此前基于用户手动转录字符串实现的规则未覆盖该真实结构。

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 识别范围 | 匹配 `[标题]([https://URL](URL去掉协议))`，并继续兼容同结构前存在反斜杠的内容。 |
| 修复结果 | 规整为 `[标题](https://URL)`。 |
| 可信来源 | 仅当内层显示文本是 HTTPS URL，且目标 URL 等于该 URL 或去掉协议后的值时修复。 |
| 展示与编辑 | 已保存卡片立即修复；双击编辑和后续提交使用标准 Markdown。 |

## 验收标准

| 输入 | 期望 |
| --- | --- |
| `[标题]([https://github.com/org/repo](github.com/org/repo))` | 标题是链接文字，目标为 `https://github.com/org/repo`。 |
| `[标题]\([https://github.com/org/repo](https://github.com/org/repo))` | 同样规整为标准链接。 |
| 内层显示文本不是 HTTPS URL | 保留原文。 |
