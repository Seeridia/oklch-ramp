# OKRamp Studio

OKRamp 的 React 与 TDesign 交互式体验站，支持色阶生成、明暗组件预览、算法对比、主题导出和使用指南。

[在线体验](https://okramp.seeridia.top) · [项目首页](../README.md) · [核心 API](../docs/API.md)

## 本地运行

安装 [Vite+](https://viteplus.dev/guide/) 后，在仓库根目录执行：

```sh
vp install
vp pack
vp run demo
```

默认地址为 `http://127.0.0.1:4173/`。执行 `vp run demo:build` 可将站点构建至 `playground/dist/`。

## 页面与功能

| 页面或区域 | 功能 |
| --- | --- |
| 工作台 | 调整主色、策略、阶数、锚点与高级参数，查看品牌和关联中性色阶 |
| 色彩详情 | 查看 HEX、RGB、OKLCH 数值并复制 |
| 组件预览 | 使用真实 TDesign 组件，并排观察浅色与深色主题 |
| Token 与诊断 | 查看语义映射、颜色组合对比度与生成警告 |
| 方案对比 | 逐行比较 OKRamp、TDesign、Ant Design、HSL、sRGB 和 CIELAB 的结果 |
| 使用指南 | 快速开始、原理、主题、组件库集成、API 与诊断 |
| 导出 | 生成可用于项目的颜色和主题文件 |

工作台参数使用 URL 中的 `workspace.*`，对比参数使用 `compare.*`，可通过复制地址分享配置。A 表示输入色锚点，R 表示推荐阶位；两者重合时显示 A。无效输入会保留最后一次有效结果并暂停导出。

默认界面语言为简体中文，可切换英文；语言选择保存在本地。工作台支持整体明暗切换，组件预览的明暗模式可以独立设置。

## 主题与对比方式

预览通过 `@okramp/tdesign` 映射品牌、背景、文字及边框颜色，成功、警告、错误色沿用 TDesign 默认值。并排预览的弹窗与下拉浮层挂载在对应主题作用域中。默认开启「同时应用到工作台」。

品牌色阶为 3–9 阶时只生成原始色阶，至少 10 阶才生成语义主题。核心对比度诊断仅覆盖指定颜色组合，不能代表适配后整个页面的可访问性结果。

方案对比统一输入主色和 10 阶数量，保留各算法自身的端点和锚点规则；按阶号对齐不代表相同感知明度。`tvision-color` 与 `@ant-design/colors` 仅用于演示比较，不进入核心包。

## 代码结构

| 位置 | 职责 |
| --- | --- |
| `src/App.tsx` | 应用布局、页面与导出流程 |
| `src/model.ts` | 参数模型与生成入口 |
| `src/components/Controls.tsx` | 基础和高级参数控件 |
| `src/components/Scales.tsx` | 色阶、详情和复制 |
| `src/components/Preview.tsx` | 真实组件及业务场景 |
| `src/components/Analysis.tsx` | Token、诊断和方案对比 |
| `src/components/Guide.tsx` | 文章导航与自动大纲 |
| `src/export.ts` | 主题与颜色导出 |
| `src/adapters/tdesign.ts` | TDesign 适配包接入 |
| `src/docs/` | MDX 文章与双语内容 |

## 编辑使用指南

指南分为快速开始、色阶生成、生成原理、语义主题、集成、API 与诊断六个章节。「集成」下包含 TDesign、Ant Design、shadcn/ui 三篇文章。

1. 在 `src/docs/articles/` 新增或编辑 MDX 文件。
2. 在 `src/docs/catalog.json` 配置文章 ID、章节、文件名、中英文标题和摘要。
3. 使用 `##` 与 `###` 定义大纲层级；双语内容可使用 `Text`，段落可使用 `DocParagraph`。
4. 交互示例直接导入 React 组件。共用内容位于 `src/docs/content/`。

MDX 使用 `@mdx-js/rollup` 编译，配合 `remark-gfm` 和 `rehype-slug`。正文采用 TDesign Typography 和 Link，代码块使用 highlight.js。大纲从渲染后的标题生成，无需单独维护目录。

文章链接采用 `?page=guide&guideDoc=integrations/tdesign`，支持直接访问及浏览器前进后退。

## 更新 TDesign

预览作用域的默认变量由已安装的 TDesign 样式生成。升级依赖后，可执行以下命令更新变量文件：

```sh
vp -C playground run sync:themes
```

随后检查明暗预览及浮层表现。体验站布局参考 [TDesign React Starter](https://github.com/Tencent/tdesign-react-starter)。
