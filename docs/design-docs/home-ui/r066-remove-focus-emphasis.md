# R066 移除焦点强调框

## 已采用方案

复用现有 Button、Input、NativeSelect、Switch、Dialog 和 Sheet，不新增组件、依赖或抽象。移除共享控件的 focus-visible ring 和焦点边框变色，以及 destructive 与 aria-invalid 的 ring 色配置；保留 aria-invalid 错误边框。入口和设置表单移除 focus:border 强调色。Dialog、Sheet 默认关闭按钮移除 ring 与 offset。基础 reset 用 :focus 的 outline:none 清除原生控件、Markdown 链接、复选框及可聚焦容器的浏览器默认焦点轮廓，避免组件 ring 移除后仍出现原生外框。

普通 border、错误状态边框、卡片与浮层阴影、悬停反馈、菜单聚焦背景、选中态、光标和文本选择保持原有逻辑。保留 Tab、方向键、Enter、Escape、自动聚焦和焦点恢复，不修改业务操作。

## 与历史决策的关系

R064 引入共享控件时保留了默认焦点 ring。本需求根据用户明确要求移除所有焦点强调框，以本次决定为准，不修改历史需求文档。按钮不再提供 ring 作为键盘焦点视觉定位；菜单仍保留背景反馈，输入区仍保留光标。

## 实际改动

| 文件 | 移除内容 |
|---|---|
| src/components/ui/button.tsx | 默认 3px ring、焦点边框色、destructive 与无效状态 ring 色 |
| src/components/ui/input.tsx | 默认 3px ring、焦点边框色、无效状态 ring 色 |
| src/components/ui/native-select.tsx | 默认 3px ring、焦点边框色、无效状态 ring 色 |
| src/components/ui/switch.tsx | 默认 3px ring、焦点边框色 |
| src/components/ui/dialog.tsx、sheet.tsx | 默认关闭按钮的 2px ring、2px offset |
| src/app/BackendUrlGate.tsx、SupabaseEntry.tsx | 输入和选择控件聚焦后的强调边框色 |
| src/pages/settings/SupabaseSettingsSection.tsx | 设置输入框聚焦后的强调下边框色 |
| src/styles/foundations/reset.css | 清除浏览器默认焦点 outline |

原默认 ring 为明亮 #3E8ADC、暗色 #6CBCFA；destructive／错误态 ring 配置为明亮 #B42318、暗色 #FFB3B3。移除后均不绘制焦点外框。普通边框颜色不属于移除范围。

## 验证与状态

复用现有行为测试及 Backend、Supabase 生产构建，不新增绑定静态样式的测试。逐项视觉验收清单和验证结果见同名执行计划。实现待用户视觉验收，未归档。
