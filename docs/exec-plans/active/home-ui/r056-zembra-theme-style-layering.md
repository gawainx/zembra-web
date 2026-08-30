# r056-zembra-theme-style-layering 执行计划

日期：2026-08-30

## 状态

实现完成，等待用户验收。

## 实际改动

1. 将原 `src/styles/main.css` 拆为唯一入口、基础层、`zembra-bonofix` 主题层、语义 token 层和 Markdown 内容层。
2. 将亮暗主题重复的 `--color-*` 映射收敛至 `semantic-tokens.css`，主题文件只保留 palette 和 `color-scheme`。
3. 更新 `AGENTS.md` 与 `docs/DESIGN.md`，将分层边界和 `zembra-*` 命名约束设为全局开发规则。

## 验证

- [已通过] `npm run test`：20 个测试文件、137 项测试通过。
- [已通过] `npm run build:backend`。
- [已通过] `npm run build:supabase`。

## 验收后动作

用户验收后将本计划移入 `docs/exec-plans/completed/home-ui/`。
