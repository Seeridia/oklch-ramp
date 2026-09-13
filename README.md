# OKRamp

[![npm version](https://img.shields.io/npm/v/%40okramp%2Fcore?label=%40okramp%2Fcore&color=0052D9)](https://www.npmjs.com/package/@okramp/core)
[![CI](https://github.com/Seeridia/okramp/actions/workflows/ci.yml/badge.svg)](https://github.com/Seeridia/okramp/actions/workflows/ci.yml)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-types%20included-3178C6)](./docs/API.md)

基于 OKLCH 的 TypeScript 色彩引擎。从一个主色生成由浅到深的品牌色阶、关联中性色，以及可接入组件库的浅色和深色主题。

**[在线体验](https://okramp.seeridia.top)** · **[使用指南](https://okramp.seeridia.top/?page=guide)** · **[API 文档](./docs/API.md)** · **[算法说明](./docs/ALGORITHMS.md)**

## 特性

- **品牌色阶**：默认 10 阶，支持 3–20 阶、三种生成策略和自定义曲线。
- **关联中性色**：10 或 14 阶，以低彩度保留品牌的冷暖倾向。
- **明暗主题**：独立映射背景、文字、边框和品牌交互状态。
- **色域映射**：固定 OKLCH 明度与色相，通过降低彩度映射到 sRGB。
- **对比度与诊断**：WCAG 2.x 对比度工具，支持报告、调整和严格校验。
- **组件库集成**：独立适配 TDesign、Ant Design 和 shadcn/ui。
- **框架无关**：核心不依赖 DOM，可用于 Node.js 与现代浏览器，提供 TypeScript 类型。

## 安装

```sh
npm install @okramp/core
```

也可以使用你项目的包管理器：

```sh
pnpm add @okramp/core
yarn add @okramp/core
bun add @okramp/core
```

核心包采用 ESM，Node.js 运行环境要求 20 及以上。浏览器项目可通过 Vite 等工具打包使用。

## 快速开始

### 生成品牌色阶

```ts
import { generateColorScale } from '@okramp/core';

const scale = generateColorScale('#0052D9');

console.log(scale.colors);
// [
//   '#f0f5ff', '#dce9ff', '#bdd5ff', '#94bbff', '#659cff',
//   '#327aff', '#155dde', '#0244b4', '#002e84', '#001b54',
// ]

console.log(scale.recommendedIndex); // 最接近输入色的阶位，从 0 开始
console.log(scale.diagnostics.messages);
```

默认 `tonal` 策略使用输入色的色相和彩度重建完整明度曲线，**不保证输入色原样出现在色阶中**。如果需要保留品牌原色，请使用锚点策略。

### 生成中性色和明暗主题

```ts
import { generateNeutralScale, generateColorTheme } from '@okramp/core';

const neutral = generateNeutralScale('#0052D9', {
  steps: 14,
  tintStrength: 0.025,
});

const theme = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});

console.log(neutral.colors);
console.log(theme.themes.light?.color.brand.default);
console.log(theme.themes.dark?.color.background.page);
```

原始色阶只表示颜色的排列；语义主题进一步分配 `brand.default`、`brand.hover`、`text.primary`、`background.page` 等角色。深色主题采用独立映射，而不是将浅色色阶倒序。

## 选择生成策略

| 策略              | 输入色保留方式                 | 适用场景                       |
| ----------------- | ------------------------------ | ------------------------------ |
| `tonal` 默认      | 不保证原样保留                 | 探索主题，处理过浅或过深的输入 |
| `adaptive-anchor` | 保留规范化主色，自动选择阶位   | 品牌色必须保留，阶位可以变化   |
| `fixed-anchor`    | 保留规范化主色，固定在指定阶位 | 已有明确的设计系统阶位约定     |

```ts
const anchored = generateColorScale('#0052D9', {
  strategy: 'fixed-anchor',
  anchorIndex: 5, // 第 6 阶
});

const adaptive = generateColorScale('#eaf6ff', {
  strategy: 'adaptive-anchor',
});
```

极端输入在固定锚点下可能压缩一侧的明度空间，库会返回诊断。锚点保留的是规范化后的不透明 sRGB 颜色。

### 自定义输出

```ts
const scale = generateColorScale('#0052D9', {
  steps: 10,
  output: 'oklch', // 'hex' | 'rgb' | 'oklch'
  endpoints: 'curve', // 'curve' | 'black-white'
  hueShift: 0,
});
```

`curve` 保留带色端点；`black-white` 将明度范围拉伸到纯白至纯黑。自定义明度和彩度曲线、参数限制和返回类型见 [API 文档](./docs/API.md)。

## 组件库集成

核心负责颜色计算，适配包负责组件库的 Token 映射。只需安装项目实际使用的适配器。

| 包                                                           | npm 版本                                                                                                                | 用途                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`@okramp/core`](https://www.npmjs.com/package/@okramp/core) | [![npm](https://img.shields.io/npm/v/%40okramp%2Fcore?label=version)](https://www.npmjs.com/package/@okramp/core)       | 色阶、中性色、语义主题及诊断       |
| [`@okramp/tdesign`](./packages/tdesign/README.md)            | [![npm](https://img.shields.io/npm/v/%40okramp%2Ftdesign?label=version)](https://www.npmjs.com/package/@okramp/tdesign) | TDesign CSS 变量与主题导出         |
| [`@okramp/antd`](./packages/antd/README.md)                  | [![npm](https://img.shields.io/npm/v/%40okramp%2Fantd?label=version)](https://www.npmjs.com/package/@okramp/antd)       | Ant Design 5/6 ConfigProvider 配置 |
| [`@okramp/shadcn`](./packages/shadcn/README.md)              | [![npm](https://img.shields.io/npm/v/%40okramp%2Fshadcn?label=version)](https://www.npmjs.com/package/@okramp/shadcn)   | shadcn/ui 语义变量与明暗 CSS       |

例如，生成 TDesign 主题样式：

```sh
npm install @okramp/core @okramp/tdesign
```

```ts
import { generateColorTheme } from '@okramp/core';
import { createTDesignCss } from '@okramp/tdesign';

const theme = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});
const css = createTDesignCss(theme);
// 将 css 保存为主题文件，在 TDesign 默认样式之后加载。
```

TDesign 和 shadcn/ui 的 CSS 语义变量引用基础色阶，便于追踪来源。各适配包的使用方式与覆盖范围见对应 README。

## 对比度与错误处理

`generateColorTheme` 支持三种对比度策略：

| 策略          | 行为                                                           |
| ------------- | -------------------------------------------------------------- |
| `report` 默认 | 保留颜色，报告检查结果                                         |
| `adjust`      | 从已有色阶中选择接近原值且满足目标的颜色；无合格候选时报告失败 |
| `strict`      | 不调整颜色，存在失败项时抛出 `ColorScaleError`                 |

默认目标为普通文字 `4.5:1`、重要非文本元素 `3:1`。检查只覆盖引擎列出的颜色组合，不等同于整个页面或组件库适配后的可访问性认证。

```ts
import { ColorScaleError, generateColorScale } from '@okramp/core';

try {
  const result = generateColorScale('#f8fbff');
  for (const message of result.diagnostics.messages) {
    console.log(message.code, message.severity, message.message);
  }
} catch (error) {
  if (error instanceof ColorScaleError) {
    console.error(error.code, error.details);
  } else {
    throw error;
  }
}
```

无法解析的输入和无效配置会抛出错误。合法但不理想的输入通过诊断提示，例如主色过浅、彩度偏低、色域映射、重复阶位及相邻色差偏小。

## 体验站与文档

[OKRamp Studio](https://okramp.seeridia.top) 提供实时参数设置、品牌与中性色阶、颜色详情、真实 TDesign 组件明暗预览、Token 查看、诊断和主题导出。方案对比页支持逐行比较不同算法的生成结果。

- [使用指南](https://okramp.seeridia.top/?page=guide)：快速开始、生成原理、主题与组件库集成。
- [API 文档](./docs/API.md)：参数、返回值、对比度工具与错误处理。
- [算法说明](./docs/ALGORITHMS.md)：曲线、锚点、色域映射与已知边界。
- [体验站开发说明](./playground/README.md)：本地运行、目录结构与文档编辑。
- [更新记录](./CHANGELOG.md)。

## 本地开发

仓库使用 [Vite+](https://viteplus.dev/guide/) 管理开发、构建与测试。安装 Vite+ 后：

```sh
git clone https://github.com/Seeridia/okramp.git
cd okramp
vp install
vp pack
vp run demo
```

默认体验地址为 `http://127.0.0.1:4173/`。构建全部包后可进行仓库检查：

```sh
vp -C packages/tdesign pack
vp -C packages/antd pack
vp -C packages/shadcn pack
vp check
vp test
```

其他命令：`vp run coverage` 查看测试覆盖率，`vp run benchmark` 运行性能基准，`vp run demo:build` 构建体验站。

## 当前边界

- 输出基线为 sRGB，暂不生成原生 Display-P3 色板。
- 输入透明度会被忽略并报告，生成结果是不透明颜色。
- 不同色相共享基础曲线；极端配置及 HEX 量化仍可能产生低色差或重复阶位。
- 算法更新可能改变具体颜色值；需要固定结果时，请锁定依赖版本并保留项目侧色板基线。

## 参与贡献

欢迎通过 [Issues](https://github.com/Seeridia/okramp/issues) 反馈问题或提出建议，也欢迎提交 Pull Request。色彩问题请附上输入主色、生成参数、包版本、实际结果和预期用途；涉及视觉效果时，提供浅色或深色背景下的截图会更有帮助。

修改算法时，请同步更新相关测试和文档，并说明对现有输出的影响。

## 致谢

OKRamp 起源于 TDesign 色阶生成挑战。核心使用 [culori](https://culorijs.org/) 处理颜色解析与空间转换；体验站使用 [TDesign React](https://tdesign.tencent.com/react/)，布局参考 [TDesign React Starter](https://github.com/Tencent/tdesign-react-starter)。对比页面使用的 `tvision-color` 和 `@ant-design/colors` 仅属于演示依赖。

## 许可证

[MIT](./LICENSE)
