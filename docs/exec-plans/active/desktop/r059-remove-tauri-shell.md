# R059 移除 Tauri 桌面壳执行计划

日期：2026-09-04

需求澄清文档：`docs/request-clarify/desktop/r059-remove-tauri-shell.md`

设计文档：`docs/design-docs/desktop/r059-remove-tauri-shell.md`

状态：已实施，等待用户验收

## 成功标准

仓库不再包含可执行的 Tauri/macOS 桌面分发层和相关工具依赖；React/Vite Web UI、Backend 与 Supabase Direct 两种模式、全部 Web npm 命令及 Docker/Vercel 构建行为不受影响。

## Stage 1：移除桌面工程与操作入口

| Task | 状态 | 改动 | 验证 |
| --- | --- | --- | --- |
| 1.1 | Finished | 删除 `src-tauri/` 的 Rust crate、Tauri 配置、capability、图标和生成 schema。 | 文件清单确认整个桌面工程移除，`src/` 与 `vendor/` 无变化。 |
| 1.2 | Finished | 删除 `scripts/package_macos_app.sh` 和已失效的 `docs/references/tauri-macos-packaging.md`。 | 仓库不再暴露 macOS app 打包入口或当前操作教程；历史需求文档保持原文。 |
| 1.3 | Finished | 删除 `.gitignore` 中只服务于 Tauri target 目录的规则。 | 忽略规则中无已删除工程路径，其他规则逐行保持不变。 |

Stage 1 完成并验证后创建独立提交。

## Stage 2：移除 Tauri npm 工具链

| Task | 状态 | 改动 | 验证 |
| --- | --- | --- | --- |
| 2.1 | Finished | 从 `package.json` 删除四个桌面专属 scripts，不修改七个现有 Web scripts 的名称或值。 | 对比确认 Web scripts 完全不变。 |
| 2.2 | Finished | 使用 npm 移除 `@tauri-apps/cli`，同步更新 `package-lock.json`。 | npm 依赖树与 lockfile 中均无 `@tauri-apps/cli` 及其平台包，其他直接依赖版本不变。 |

Stage 2 完成并验证后创建独立提交。

## Stage 3：Web UI 全量回归与范围审计

| Task | 状态 | 改动 | 验证 |
| --- | --- | --- | --- |
| 3.1 | Finished | 不修改应用代码，仅运行完整测试。 | `npm test` 全部通过。 |
| 3.2 | Finished | 分别构建两种既有 Web 目标。 | `npm run build:backend` 与 `npm run build:supabase` 均通过，且无超过 500 kB 的 chunk 警告。 |
| 3.3 | Finished | 扫描 Tauri 残留并审计最终 diff。 | 除历史记录和 R059 文档外无 Tauri 可执行资产或操作入口；`vite.config.ts`、`Dockerfile`、`vercel.json`、`src/`、`vendor/` 无变化；`git diff --check` 通过。 |
| 3.4 | Finished | 更新本计划的实际执行与验证结果，并在 `docs/PROGRESS.md` 的 R059 单一条目追加实施结果。 | 文档与实际提交一致，计划仍留在 active 等待用户验收。 |

Stage 3 完成并验证后创建独立提交，并等待用户验收；未经用户允许不把计划移动到 `completed/`。

## 计划文件范围

实现阶段仅允许变更或删除以下范围：

- `src-tauri/`
- `scripts/package_macos_app.sh`
- `docs/references/tauri-macos-packaging.md`
- `.gitignore`
- `package.json`
- `package-lock.json`
- 本 R059 需求、设计、执行计划文档
- `docs/PROGRESS.md` 中既有 R059 条目的追加内容

如果验证发现必须修改 `src/`、`vite.config.ts`、`Dockerfile`、`vercel.json`、其他历史文档或 Web script，立即中断实施并请求用户决策，不自行扩大范围。

## 决策日志

- 2026-09-04：用户确认只移除 Tauri 桌面层；Web UI 所有行为、Backend/Supabase 全部模式及 npm Web build 行为必须完整保留。
- 2026-09-04：用户审核通过需求、设计和执行计划，同意进入开发实施。

## 执行记录

- Stage 1 提交 `74a6a46`：删除完整 `src-tauri/` 工程、macOS 打包脚本、失效的当前打包教程和对应 target 忽略规则；应用源码与 Web 部署配置未改动。
- Stage 2 提交 `c8bffc2`：删除四个桌面 npm scripts 和 `@tauri-apps/cli`，由 npm 同步清理 12 个 Tauri CLI lockfile 包；脚本对比确认七个 Web scripts 的名称和值保持不变，其他直接依赖和版本号未变化。
- Stage 3 验证：`npm test` 通过，共 21 个测试文件、140 项测试；`npm run build:backend` 与 `npm run build:supabase` 均通过，最大 JavaScript chunk 分别为 247.26 kB 和 253.31 kB，均无超大 chunk 警告。
- Stage 3 审计：`npm ci --ignore-scripts` 完成 lockfile 一致性安装，环境因 Node.js 20 低于当前 Supabase SDK 声明的 Node.js 22 最低版本而输出既有 `EBADENGINE` warning，但命令成功；Tauri 仅存在于历史文档、R059 文档和历史进度记录，`src/`、`vite.config.ts`、`Dockerfile`、`vercel.json` 与 `vendor/` 相对审核基线均无变化。
