# R050 Supabase 非阻塞写操作

## 关联背景

复用 `docs/exec-plans/active/sync/r026-dual-data-source-vercel.md` 中已完成的乐观创建、删除与低干扰通知原则。本次将该原则补齐到 workspace 改名、笔记更新、field 切换和 field 删除。

## 实现方案

保留现有 `mutationToast` 事件与全局 toast，仅扩展消息类型和多语言文案。`noteStore` 以 note 或 field ID 为键维护本地操作版本和 Promise 队列；SupabaseEntry 以 workspace ID 维护改名队列。每次写入先更新本地状态，再按实体串行提交远端请求。最新本地操作失败时才回滚，较早操作失败不会覆盖后续乐观状态。

## 交互边界

笔记编辑、field 选择、field 删除和 workspace 改名不再禁用控件或等待请求完成。写入成功显示 3 秒通知，失败时回滚并显示 10 秒通知。登录、会话恢复和首次 workspace 授权查询继续作为访问权限门禁；局部读取维持局部加载行为。

## 验证

补充笔记更新在远端返回前立即可见、失败回滚的测试，并将既有 field 删除测试改为断言确认对话框立即关闭。完整 Vitest 和生产构建通过。
