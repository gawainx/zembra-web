# R059 移除 Tauri 桌面壳需求澄清

日期：2026-09-04

## 需求背景

项目主体是 React、Vite 构建的 Web UI。此前为 macOS 分发增加了 Tauri v2 桌面壳，但客户反馈桌面交付效果不理想，且 Tauri 工程、Rust 构建链和平台打包依赖增加了维护负担。产品正式宣发前改为以 GitHub 仓库和 Vercel Web 部署为主要交付方式，不再维护桌面应用路线。

## 澄清结论

本需求只移除 Tauri/macOS 桌面分发层，不改变任何 Web UI 行为、业务功能、数据源模式或既有 Web 构建行为。

| 范围 | 结论 |
| --- | --- |
| Tauri 工程 | 删除 `src-tauri/` 下的 Rust crate、配置、capability、图标和生成 schema。 |
| 桌面打包 | 删除 macOS 打包脚本以及只服务于 Tauri 的 npm scripts。 |
| Tauri 依赖 | 移除 `@tauri-apps/cli`，通过 npm 更新 lockfile，清除其平台二进制依赖。 |
| Web 构建命令 | `dev:backend`、`dev:supabase`、`build:backend`、`build:supabase`、`preview`、`test`、`test:watch` 的命令和值保持不变。 |
| 数据源模式 | Backend 与 Supabase Direct 两种构建目标全部保留，不合并、不删除，也不改变 Vite alias 选择行为。 |
| 部署渠道 | Docker 继续构建 Backend Web 产物；Vercel 继续构建 Supabase Web 产物。 |
| Web UI | 页面、路由、组件、状态、API Client、认证、workspace、笔记、标签、同步和主题行为全部保持不变。 |
| 历史文档 | R008、R052 等历史需求、设计和执行记录保持原文，不修改、不删除。 |
| 当前参考 | 删除已不再适用的 Tauri macOS 打包教程；由本文档记录桌面路线终止的当前决策。 |
| 数据契约 | 不修改 `vendor/zembra-schema`、数据库、Supabase 配置或 Backend OpenAPI 契约。 |

## 边界解释

“npm build 的行为不允许修改”指所有现有 Web 开发、测试和构建命令的名称、命令内容、数据源目标及产物语义保持原样。删除只服务于已撤销桌面路线的 `package:macos`、`tauri`、`tauri:dev` 和 `tauri:build`，不新增默认 `build` 或 `dev` 命令，不调整 `vite.config.ts`。

## 不在范围内

- 不将 Backend 与 Supabase Direct 合并为运行时切换模式。
- 不删除 Backend-only 或 Supabase-only 模块。
- 不修改 Dockerfile、Vercel 配置、Vite 配置或应用源码。
- 不改变依赖版本，不升级 npm 包，不调整生产 chunk 拆分。
- 不修改页面视觉或交互，不增加替代桌面能力、PWA、Electron 或其他客户端壳。
- 不清理与 Tauri 无关的代码、文档或技术债。

## 验收标准

| 场景 | 预期 |
| --- | --- |
| 仓库内容 | 不再存在 `src-tauri/`、macOS 打包脚本、Tauri npm scripts 或 Tauri CLI lockfile 条目。 |
| Tauri 残留扫描 | 除历史文档、新需求文档和历史进度记录外，不存在可执行的 Tauri 配置、代码、依赖或操作教程。 |
| 自动化测试 | 现有完整前端测试全部通过。 |
| Backend Web 构建 | `npm run build:backend` 成功，命令定义保持不变。 |
| Supabase Web 构建 | `npm run build:supabase` 成功，命令定义保持不变。 |
| Web 构建契约 | Docker 仍调用 Backend 构建，Vercel 仍调用 Supabase 构建，Vite alias 与 chunk 策略无变化。 |
| 变更隔离 | 应用源码、Web 部署配置和 `vendor/` 无改动；工作区无意外生成物。 |

## 与历史决策的关系

R008 在当时增加了 Tauri macOS 分发出口，R052 后续将 Tauri 固定为 Supabase Direct 构建。本需求基于当前客户反馈终止该桌面分发出口，但不反向修改历史文档，也不撤销 R052 已建立的 Backend/Supabase Web 构建隔离。历史记录继续用于解释演进过程，当前有效范围以本需求为准。
