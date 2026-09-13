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

## 语言

演示站默认使用简体中文，并支持完整的英文界面。页头的语言按钮会同步切换页面文案、可访问名称、浏览器标题与 TDesign 组件内置文案，同时更新根元素的 `lang` 属性。选择结果保存在浏览器的 `okramp-locale` 本地存储项中，后续访问会继续使用上次选择的语言。

## 自动部署

推送到 `main` 后，GitHub Actions 的 `Deploy OKRamp site` 会使用 Vite+ 构建、检查和测试，将 `playground/dist/` 同步至 `deploy@121.41.122.164:/opt/1panel/www/sites/okramp.seeridia.top/index/`。也可在 Actions 手动运行。

SSH 凭据使用仓库 Secrets `DEPLOY_SSH_KEY` 和 `DEPLOY_KNOWN_HOSTS`，不写入源码。部署先上传静态资源，再替换 `index.html`；保留历史资源和服务器管理文件。线上地址为 <https://okramp.seeridia.top>。

## 页面

- 工作台：实时参数、品牌/中性色阶、HEX/RGB/OKLCH、色彩详情。根据色阶栏的实际宽度自动采用紧凑显示，完整色值在详情栏查看；默认选择算法推荐阶位，选择或调整窗口时自动让选中色块横向进入视野，仅在实际溢出时提示滚动。
- 组件预览：真实 TDesign Button、Input、Select、Checkbox、Radio、Switch、Slider、Tabs、Tag、Alert。
- 业务预览：搜索、状态筛选、分页、新建与编辑项目；数据仅在当前预览组件内生效。
- Token：语义与 TDesign 变量映射，搜索、分组、复制浅/深色值。
- 诊断：明暗对比度结果、色域与生成警告及结构化细节。
- 方案对比：以相同输入主色，逐行对照 OKRamp、TDesign、Ant Design、HSL、sRGB 与 CIELAB 的色阶生成效果。TDesign 调用 `tvision-color@1.6.0` 的 HCT 算法并固定生成 10 阶；Ant Design 调用 `@ant-design/colors@8.0.1` 的浅色色板算法，保留官方固定 10 阶与第 6 阶主色。对比参数独立于工作台：主色配置位于页面顶部，OKRamp 策略和固定锚点阶位位于其卡片左侧说明下方；各方案统一 10 阶，按阶号对齐，不对官方结果重采样；阶号相同不意味着感知明度相同。这两个依赖仅用于演示站，不进入核心 Library。
- 使用指南：拆分为快速开始、色阶生成、生成原理、主题系统、TDesign 接入、API 参考、诊断与错误七篇文档。生成原理覆盖 OKLCH 模型、默认曲线、三种策略、端点、sRGB 色域映射、中性色、语义主题、对比度与已知边界；所有内容均提供中英文。文档支持标准链接、篇内锚点和动态页面标题；中等宽度收起大纲，代码块提供语言标识、语法高亮和复制，快速开始展示实际生成色阶。
- 导出：通用/TDesign、浅色/深色/两者、内容范围、CSS/JSON/TypeScript。

工作台参数以 `workspace.*`、对比参数以 `compare.*` 写入 URL，刷新、复制地址和浏览器前进后退可恢复对应配置。默认值省略，修改参数替换当前历史记录，不逐次增加历史条目。A 表示输入色锚点，R 表示推荐主色，重合时显示 A；对比色块支持悬停或键盘聚焦查看 HEX、OKLCH 明度及输入色保留情况。

## 主题边界

`src/adapters/tdesign.ts` 从 workspace 包 `okramp-tdesign` 导入适配器，不进入核心包。它映射 31 个已在 TDesign 1.18.3 中核对的品牌、背景、文字与边框变量；成功、警告、错误色沿用官方默认值。不是对 TDesign 全部 Token 的逐一重写，也不是官方色阶算法的复刻。

`src/theme-scopes.css` 从已安装 TDesign 的明暗 Token 声明生成，为并排预览提供完整默认值。预览的 ConfigProvider 将弹窗与下拉浮层挂载在对应主题作用域。默认开启「同时应用到工作台」，生成的主题同步用于工作台；取消勾选后恢复独立的工作台主题。

升级 TDesign 后执行并复核：

```sh
vp -C playground run sync:themes
vp test
```

导出 CSS 在 `tdesign-react/dist/tdesign.css` 后加载。使用 `document.documentElement.setAttribute('theme-mode', 'dark')` 切换深色模式。

## 生成与错误处理

3–9 阶只生成原始色阶，至少 10 阶才生成语义主题，不静默修改阶数。无效输入或 strict 对比度失败时显示错误并保留最后一次有效结果，暂停导出。检查结果仅覆盖引擎列出的颜色组合，不表示整个页面符合 WCAG。

## 代码结构

- `src/model.ts`：配置、生成与颜色格式。
- `src/adapters/tdesign.ts`：主题适配，与核心隔离。
- `src/export.ts`：统一导出；预览与导出共用适配器。
- `src/components/Controls.tsx`：基础与高级参数。
- `src/components/Scales.tsx`：色阶条、详情与复制。
- `src/components/Preview.tsx`：真实组件与业务场景。
- `src/components/Analysis.tsx`：Token、诊断、方案对比与指南。
- `src/App.tsx`：布局与导出流程。

## 当前限制

演示引入 TDesign 完整样式和较多组件，生产构建仍有大 chunk 提示，可在正式部署前按页面进一步拆包。

## TDesign 规范与引用式导出

依据已安装的 TDesign React 1.18.3 官方 CSS 的中性色索引映射背景、边框和交互状态，取代临时混色。浅色容器使用白色；14 阶中性色直接按官方索引取值，10 阶按归一化位置取样。品牌与文字保留引擎语义及其对比度调整，因而这不是官方 tvision 算法的复刻。

TDesign CSS、JSON、TypeScript 导出均包含基础品牌色阶、中性色阶、基础黑白及必要的调整色；语义层使用 `var(--color-…)` 引用。JSON/TS 是 CSS 变量字典，不是 DTCG 文件。只选择语义层时自动包含依赖，避免悬空引用。导出的引用解析后与预览一致。普通边框依据 TDesign 的视觉层级，核心诊断的 3:1 检查不代表适配后所有组件边框达到该比例。

页面正文采用 14px/22px、辅助信息 12px，标题与圆角使用 TDesign Token；主要内容间距采用 16/24px。移除装饰性英文眉题，提升色值可读性，保留色阶局部横向滚动。
