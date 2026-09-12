# shadcn/ui 控件参考

## 来源

本次从 [shadcn/ui 官方 registry](https://ui.shadcn.com/r/styles/new-york-v4/dropdown-menu.json) 引入 new-york-v4 的 Button、Input、Native Select、Dropdown Menu、Dialog、Alert Dialog、Sheet、Switch 和 Tooltip 源码，并按项目 token 适配。行为基础使用 Radix UI，不依赖其他产品参考。

- [组件文档](https://ui.shadcn.com/docs/components)
- [主题文档](https://ui.shadcn.com/docs/theming)
- [Dropdown Menu](https://ui.shadcn.com/docs/components/radix/dropdown-menu)
- [Dialog](https://ui.shadcn.com/docs/components/radix/dialog)
- [Alert Dialog](https://ui.shadcn.com/docs/components/radix/alert-dialog)
- [Sheet](https://ui.shadcn.com/docs/components/radix/sheet)

## 本地适配

源码位于 `src/components/ui/`，`src/lib/utils.ts` 只负责合并 class；`components.json` 与 `@/` alias 提供后续添加组件的标准入口。颜色直接使用既有 `--color-*`，不安装默认调色板、不追加 `.dark` 配色、不改主题文件。Button 的 `plain` / `content` 变体保留现有调用方外观与尺寸，公共实现集中处理 Slot、focus-visible 和禁用状态；Input 与 Native Select 保留现有表单尺寸及原生选择交互。

Dialog 与 Alert Dialog 增加受控外部触发场景的焦点恢复；Sheet 使用原有左侧抽屉位置与宽度；Switch 保留原有开关尺寸与 thumb 色。工具栏 Tooltip 复用三语言标签。移除 registry 的默认动画类，避免引入未使用的动画依赖。

新增生产依赖为 `radix-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`；新增测试依赖为 `@testing-library/user-event`。均不涉及数据库与持久化。UI primitives 在 Vite 中按加载边界单独拆包，具体版本以 lockfile 为准。

后续更新组件时需保留这些适配，核对官方源码差异，不应直接使用 CLI 覆盖主题或现有组件。校验采用行为测试及两种生产构建；不通过调高 warning threshold 掩盖包体问题。

## 上游许可证

以下为 [上游 MIT 许可证](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) 原文：

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
