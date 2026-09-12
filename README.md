# Zembra Web

Zembra Web 是一个围绕 Workspace 组织笔记的网页应用。它支持用 Markdown 快速记录想法，并通过 Field、Tag、角色和笔记引用将内容保持可查找、可关联。

## 你可以用它做什么

- 在底部编辑器中创建 Markdown 笔记，使用常见的富文本与 Markdown 编辑能力。
- 用 `@Field` 为笔记归类；未指定时会保存到默认 Field。
- 用 `#Tag` 标记内容，并在侧边栏按层级浏览和筛选标签。
- 使用 `[[笔记 ID]]` 引用另一篇笔记，在阅读时查看引用内容。
- 按关键词、Field、Tag 或创建角色筛选笔记。
- 查看最近笔记活跃度、笔记数量、标签数量和 Field 数量。
- 编辑、切换 Field 或删除笔记；无笔记的 Field 与无使用记录的标签树也可删除。
- 在多个已授权 Workspace 之间切换；Supabase 数据源下可修改 Workspace 名称。
- 在简体中文、繁体中文和英文之间切换，并使用浅色或深色主题。

## 开始使用

需要 Node.js 与 npm。安装依赖后，选择一种数据源启动应用：

```bash
npm install
```

### 连接 Zembra Backend

适合由 Zembra Backend 提供笔记和 Workspace 数据的场景。

```bash
npm run dev:backend
```

在浏览器打开 Vite 显示的地址后，输入 Backend 的主机与端口。应用会检查连接并加载可用 Workspace；选择 Workspace 后即可进入笔记页。默认连接地址为 `http://127.0.0.1:3000`，也可通过以下环境变量在启动前指定：

```bash
VITE_ZEMBRA_API_BASE_URL=http://127.0.0.1:3000
```

### 直接连接 Supabase

适合使用 Supabase 身份认证和 Row Level Security 管理访问权限的部署。

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
npm run dev:supabase
```

打开应用后输入邮箱，使用邮件中的 Magic Link 登录，再选择已获授权的 Workspace。浏览器端只使用 Supabase 的公开 URL 与 Publishable Key；访问范围由 Supabase 的权限策略控制。

## 记录笔记

在编辑器中直接输入内容，然后发送即可保存。下面是一条同时带有 Field、标签和笔记引用的示例：

```md
整理本周阅读笔记 @Reading #research/papers

关联：[[note-id]]
```

`@Reading` 会成为笔记的 Field，`#research/papers` 会以层级标签出现。标签和 Field 可从侧边栏进入筛选；搜索框可用于快速检索笔记、Field 和 Tag。

## 使用建议

- 把 Field 用于稳定的大类，例如 `@Inbox`、`@Work`、`@Reading`。
- 用层级 Tag 表达更细的主题，例如 `#project/zembra` 或 `#research/papers`。
- 通过笔记引用连接上下文，减少复制同一段内容。
- 用 Workspace 区隔团队、项目或个人知识库；切换 Workspace 不会混合显示不同范围的笔记。

## 构建应用

根据部署所用的数据源选择对应构建命令：

```bash
npm run build:backend
npm run build:supabase
```

构建产物位于 `dist/`，可部署到任意可托管静态网站的环境。Backend 模式需要部署环境中的浏览器能够访问所配置的 Backend；Supabase 模式需要在构建环境提供对应的公开配置变量。
