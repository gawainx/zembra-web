# R068 引用笔记默认 Field

## 目标与规则

创建笔记引用其他笔记时，以正文中第一条引用的 Field 作为默认目标。优先级为显式 `@field`、第一条引用的 Field、侧栏选中 Field、`inbox`。第一条引用存在但没有可识别 Field 时使用 `inbox`；引用无法读取时回退侧栏或 `inbox`，不跳到第二条引用。

```text
正文 [[A]] [[B]]，A 属于 work，B 属于 ideas
编辑框原有提示：Default field for note is @work
正文 @personal [[A]]：Default field for note is @personal
```

引用顺序以当前正文为准，删除或重排引用立即重新计算；Mention 菜单与手写引用共用同一路径。编辑已有笔记继续保持其原 Field，除非正文明确指定其他 Field。

## 复用与实现

复用 parseNoteLinks、parseFieldNames、默认 Field 常量、notePreviewById 和 loadNotePreview，不新增依赖、API、Client 或 Repository。新建 useComposerField 是编辑框专属状态 hook，用于隔离异步引用读取、请求复用与默认值计算，避免继续把异步逻辑堆入已超过 300 行的 HomePage；调用方仅 HomePage。原有底部提示和创建 payload 共用该结果，不改变布局。

已加载笔记直接读取 Field；未加载引用复用既有缓存和读取接口。等待期间可继续编辑；立即发送时先捕获内容并清空编辑框，再等待已有查询，确定 Field 后调用既有乐观创建动作。不会清除查询期间输入的新草稿。离开工作区后取消尚未进入创建动作的提交，避免写入另一个工作区。读取日志覆盖开始、成功和失败，不记录笔记正文。

## 与历史决策的关系

本需求在原创建 Field 优先级中插入引用默认值；显式 Field 仍然优先。历史文档保持原样。仅更新新建笔记的默认值与提示，不改变已有笔记编辑规则。
