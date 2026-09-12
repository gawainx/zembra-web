# R064 shadcn/ui 控件收敛

## 边界与方案

本次只使用 shadcn/ui 官方组件及其 Radix primitives，不参考其他产品。保持现有主题 palette、页面布局、卡片内容结构、底部悬浮编辑器位置和业务流程。复用现有 API、store、编辑器和测试设施，新增共享 UI 文件仅承载已有多处重复的控件行为，不新增业务抽象。

## 执行计划

- [x] 检查工作区和远端一致，确认改造前 HEAD 8ac74c63 已有推送到 origin 的回滚 tag。
- [x] 提供保持现有布局的控件替换示意。
- [x] 按官方 registry 引入必要组件，将颜色与尺寸适配现有语义 token。
- [x] 迁移通用表单控件、菜单、设置弹窗、删除确认和侧栏抽屉，保留现有业务回调。
- [x] 完成行为测试及 Backend、Supabase 两种生产构建，核对包体和 diff。
- [x] 补充实际实现文档；代码与文档统一提交推送，等待用户验收，不自动归档。

## 验证边界

自动化验证覆盖菜单键盘操作与关闭、弹窗焦点、抽屉断点、现有业务回归。当前未获本地 Browser/Computer Use 验证授权，界面视觉验收由用户完成。

## 实际验证结果

- `npm test`：25 个测试文件、149 项测试通过；包括 4 项新增共享控件测试，覆盖鼠标菜单选择、键盘跳过禁用项、Esc 焦点恢复、Dialog Tab 约束和 Alert Dialog 默认取消。
- `npm run build:backend` 与 `npm run build:supabase`：均通过，无超过 500 kB 的 JavaScript chunk 警告。
- Radix / Floating UI 分离至 `ui-primitives` chunk；保留 Tiptap、ProseMirror、React、router、i18n、Supabase 的原有分包边界。
- `git diff --check`：通过。主题 palette、共享 schema、历史需求文档未修改；临时 registry、测试及构建日志均存于 `/tmp`，未进入仓库。
- 尚未执行本地浏览器视觉检查，等待用户验收；执行计划保持 active。
