# OKRamp Studio

OKRamp 的 React 19 + TDesign React 1.18.3 交互式演示站。参考官方 [TDesign React Starter](https://github.com/Tencent/tdesign-react-starter) 的侧边导航、页头与卡片布局，使用 Vite+ 构建。

## 运行

从仓库根目录：

```sh
vp install
vp pack
vp run demo
vp run demo:build
vp -C playground check
vp test
```

本地地址默认是 `http://127.0.0.1:4173/`。

## 自动部署

推送到 `main` 后，GitHub Actions 的 `Deploy OKRamp site` 会使用 Vite+ 构建、检查和测试，将 `playground/dist/` 同步至 `deploy@121.41.122.164:/opt/1panel/www/sites/okramp.seeridia.top/index/`。也可在 Actions 手动运行。

SSH 凭据使用仓库 Secrets `DEPLOY_SSH_KEY` 和 `DEPLOY_KNOWN_HOSTS`，不写入源码。部署先上传静态资源，再替换 `index.html`；保留历史资源和服务器管理文件。线上地址为 <https://okramp.seeridia.top>。

## 页面

- 工作台：实时参数、品牌/中性色阶、HEX/RGB/OKLCH、色彩详情。
- 组件预览：真实 TDesign Button、Input、Select、Checkbox、Radio、Switch、Slider、Tabs、Tag、Alert。
- 业务预览：搜索、状态筛选、分页、新建与编辑项目；数据仅在当前预览组件内生效。
- Token：语义与 TDesign 变量映射，搜索、分组、复制浅/深色值。
- 诊断：明暗对比度结果、色域与生成警告及结构化细节。
- 策略对比：同一配置下三种策略，可应用回工作台。
- 使用指南：核心 API、TDesign CSS 加载与深色模式用法。
- 保存：浏览器 localStorage 保存最近 50 个方案，刷新后从「我的方案」载入。
- 导出：通用/TDesign、浅色/深色/两者、内容范围、CSS/JSON/TypeScript。

## 主题边界

`src/adapters/tdesign.ts` 是应用级适配器，不进入核心包。它映射 31 个已在 TDesign 1.18.3 中核对的品牌、背景、文字与边框变量；成功、警告、错误色沿用官方默认值。不是对 TDesign 全部 Token 的逐一重写，也不是官方色阶算法的复刻。

`src/theme-scopes.css` 从已安装 TDesign 的明暗 Token 声明生成，为并排预览提供完整默认值。预览的 ConfigProvider 将弹窗与下拉浮层挂载在对应主题作用域。工作台主题独立，用户可选择「同时应用到工作台」。

升级 TDesign 后执行并复核：

```sh
vp -C playground run sync:themes
vp test
```

导出 CSS 在 `tdesign-react/dist/tdesign.css` 后加载。使用 `document.documentElement.setAttribute('theme-mode', 'dark')` 切换深色模式。

## 生成与错误处理

3–9 阶只生成原始色阶，至少 10 阶才生成语义主题，不静默修改阶数。无效输入或 strict 对比度失败时显示错误并保留最后一次有效结果，暂停保存和导出。检查结果仅覆盖引擎列出的颜色组合，不表示整个页面符合 WCAG。

## 代码结构

- `src/model.ts`：配置、生成、颜色格式、本地方案。
- `src/adapters/tdesign.ts`：主题适配，与核心隔离。
- `src/export.ts`：统一导出；预览与导出共用适配器。
- `src/components/Controls.tsx`：基础与高级参数。
- `src/components/Scales.tsx`：色阶条、详情与复制。
- `src/components/Preview.tsx`：真实组件与业务场景。
- `src/components/Analysis.tsx`：Token、诊断、策略、指南。
- `src/App.tsx`：布局与保存/导出流程。

## 当前限制

方案保存在当前浏览器，没有云同步；未实现 URL 参数分享或颜色曲线图。演示引入 TDesign 完整样式和较多组件，生产构建仍有大 chunk 提示，可在正式部署前按页面进一步拆包。

## TDesign 规范与引用式导出

依据已安装的 TDesign React 1.18.3 官方 CSS 的中性色索引映射背景、边框和交互状态，取代临时混色。浅色容器使用白色；14 阶中性色直接按官方索引取值，10 阶按归一化位置取样。品牌与文字保留引擎语义及其对比度调整，因而这不是官方 tvision 算法的复刻。

TDesign CSS、JSON、TypeScript 导出均包含基础品牌色阶、中性色阶、基础黑白及必要的调整色；语义层使用 `var(--color-…)` 引用。JSON/TS 是 CSS 变量字典，不是 DTCG 文件。只选择语义层时自动包含依赖，避免悬空引用。导出的引用解析后与预览一致。普通边框依据 TDesign 的视觉层级，核心诊断的 3:1 检查不代表适配后所有组件边框达到该比例。

页面正文采用 14px/22px、辅助信息 12px，标题与圆角使用 TDesign Token；主要内容间距采用 16/24px。移除装饰性英文眉题，提升色值可读性，保留色阶局部横向滚动。
