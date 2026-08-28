# r051-enforce-inbox-field 设计

## 目标

前端内所有笔记写入路径都必须携带非空 Field。空、`null` 或未提供的创建 Field 统一收敛为 `inbox`；编辑时未提供 Field 保持原 Field，旧笔记没有 Field 时改为 `inbox`。

## 方案

新增 `src/api/defaultField.ts` 作为前端默认 Field 的唯一来源，复用 `defaultFieldName` 和 `resolveRequiredFieldName()`，不新增 Repository、Client 或 UI 抽象。HTTP Notes Client 在创建请求中总是发送解析后的 Field，在更新请求中仅将显式的空值转为 `inbox`，保留未提供字段的既有更新语义。Supabase Notes Client 在写入 note 前确保目标 Field 存在，遇到并发创建导致的唯一键冲突时重新查询并复用已创建的 Field。

首页编辑正文没有 `@field` 时优先保留笔记当前 Field；找不到当前 Field 时才使用 `inbox`。测试 mock 也为所有示例和新增 note 提供 Field ID，避免测试模式产生无 Field 笔记。

## 边界

本需求严格不修改 `vendor/zembra-schema`、数据库 DDL、migration 或任何 schema 产物。后端接收到的创建和显式清空更新请求会获得非空 `field: "inbox"`，Supabase 直连路径在客户端完成 Field 创建和关联。

生产 `src` 不保存任何 mock 笔记、Field、Tag 或同步数据。测试数据仅定义在 `*.test.ts` 和 `*.test.tsx`，并通过测试专用 client 注入。

## 验证

`src/api/notes.client.test.ts` 验证 HTTP 创建和显式清空更新均发送 `inbox`。`src/pages/home/HomePage.test.tsx` 覆盖首页现有 Field 选择和创建行为。执行 `npm test -- --run src/api/notes.client.test.ts src/pages/home/HomePage.test.tsx` 与 `npm run build`。
