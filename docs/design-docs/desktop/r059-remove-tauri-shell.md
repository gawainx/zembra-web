# R059 移除 Tauri 桌面壳设计文档

日期：2026-09-04

需求澄清文档：`docs/request-clarify/desktop/r059-remove-tauri-shell.md`

## WHAT

从仓库中移除只负责 macOS 桌面封装的 Tauri 层，包括 Rust/Tauri 工程、桌面打包脚本、桌面 npm scripts、Tauri CLI 开发依赖及其 lockfile 记录，并移除已经失效的当前打包教程。React/Vite Web UI、两种数据源目标及全部 Web 构建、部署和运行行为保持原样。

## WHY

Tauri shell 没有承载业务逻辑或必须迁移的原生能力，只把既有 Supabase Web 构建装入 macOS WebView。客户反馈桌面效果不如直接通过 GitHub 与 Vercel 发布，而 Rust toolchain、Tauri CLI、多平台二进制和 macOS bundle 脚本持续增加安装、构建与维护成本。在正式宣发前删除该分发层，可以让仓库职责回归纯 Web UI，同时不影响已有产品能力。

## HOW

### 1. 删除桌面分发资产

整体删除 `src-tauri/` 和 `scripts/package_macos_app.sh`。这些文件形成独立桌面边界，Web 入口、页面和 API Client 没有导入其中内容，因此无需新增 adapter、client、service 或替代实现。

### 2. 收缩 npm 桌面工具链

使用 npm 的依赖管理命令移除 `@tauri-apps/cli`，让 `package.json` 与 `package-lock.json` 同步更新；同时删除四个桌面专属 scripts。除这些明确属于桌面路线的字段外，不重排或修改其他 scripts、dependencies、devDependencies 和版本号。

| 删除项 | 原因 |
| --- | --- |
| `package:macos` | 入口脚本随 macOS 打包脚本删除。 |
| `tauri` | 不再需要 Tauri CLI 透传命令。 |
| `tauri:dev` | 不再启动桌面开发壳。 |
| `tauri:build` | 不再构建 macOS app bundle。 |
| `@tauri-apps/cli` | 仅服务于上述桌面命令。 |

### 3. 保持 Web 构建边界不变

不修改 `vite.config.ts`、`Dockerfile`、`vercel.json` 或 `src/`。Backend 与 Supabase Direct 继续在 Vite 解析模块图前通过 mode 和 alias 选择唯一实现：

```text
Docker  ── npm run build:backend  ── Backend Web UI
Vercel  ── npm run build:supabase ── Supabase Web UI
```

本需求不新增默认目标，也不把两种构建恢复为运行时切换。现有业务接口和测试设施足以验证行为，无需新增抽象或专用测试模块。

### 4. 文档与忽略规则

历史 R008、R052 文档是既有决策记录，保持不变。删除作为当前操作入口的 `docs/references/tauri-macos-packaging.md`，避免宣发后继续提供失效命令。删除 `.gitignore` 中仅匹配已移除工程构建产物的 `src-tauri/target` 规则。新需求三层文档负责记录当前决策、实施边界与验证证据。

## 变更不变量

- Web scripts 的名称和值逐项保持不变。
- `vite.config.ts` 的目标校验、alias 和 `manualChunks` 保持不变。
- Docker 与 Vercel 的构建目标保持不变。
- `src/` 和 `vendor/` 不发生变更。
- 不改变 UI、认证、数据访问、同步或本地状态行为。
- 不引入任何新依赖或替代桌面技术。

## 验证设计

| 验证层级 | 方法 | 通过条件 |
| --- | --- | --- |
| 依赖完整性 | 运行 npm 安装一致性检查并扫描 lockfile | npm 元数据有效且无 Tauri CLI 包。 |
| 行为回归 | 运行完整 `npm test` | 现有测试全部通过。 |
| Backend 构建 | 运行 `npm run build:backend` | 类型检查和生产构建通过，无超大 chunk 警告。 |
| Supabase 构建 | 运行 `npm run build:supabase` | 类型检查和生产构建通过，无超大 chunk 警告。 |
| 范围审计 | 检查 diff、文件列表及 Tauri 引用 | 只有规划内桌面资产、依赖元数据、当前参考和本需求文档变化；历史文档未改。 |
| 格式检查 | 运行 `git diff --check` | 无空白或补丁格式错误。 |

由于本需求不修改可见 UI，无需截图验证。
