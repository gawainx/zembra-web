# 共享数据表契约引用

## 来源

本仓库通过 Git submodule 引入共享数据表契约：

```text
vendor/zembra-schema
```

远程仓库：

```text
https://github.com/zembra-open-sources-project/zembra-schema.git
```

当前固定版本：

```text
v0.5.1
```

当前 submodule commit：

```text
58fea0fb684d80495fd8e9a40c7e1a81b5ee6a21
```

## 使用规则

- 数据表说明、SQLite DDL、JSON Schema 和 migration 都以 `vendor/zembra-schema` 为准。
- 本仓库不复制维护数据表设计正文。
- 前端代码不得直接依赖 SQLite 表结构细节。
- 前端通过 API Client 或 Repository 层消费笔记、标签、附件等业务数据。
- 后续接入 Supabase 时，优先替换数据访问实现，不让 UI 组件直接绑定数据库提供方。

## 入口文件

| 类型 | 路径 |
| --- | --- |
| 统一表结构说明 | `vendor/zembra-schema/note_schema.md` |
| SQLite 初始化 DDL | `vendor/zembra-schema/sqlite/001_initial_schema.sql` |
| Migration | `vendor/zembra-schema/migrations/001_initial_schema.sql` |
| Postgres 初始化 DDL | `vendor/zembra-schema/postgres/001_initial_schema.sql` |
| Postgres Migration | `vendor/zembra-schema/postgres/migrations/005_add_unified_schema_contract.sql` |
| JSON Schema | `vendor/zembra-schema/json/` |

## 初始化和升级

首次拉取本仓库后，需要初始化 submodule：

```bash
git submodule update --init --recursive
```

升级共享 schema 时，在 `vendor/zembra-schema` 内切换到目标 tag 或 commit，再回到本仓库提交 submodule 指针变更。

提交前必须确认 schema 版本兼容性；如果数据结构有破坏性变化，需要同步更新本仓库的数据访问逻辑和迁移策略。
