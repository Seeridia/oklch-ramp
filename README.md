# OKRamp

Perceptual color ramps and themes powered by OKLCH。OKRamp 是一个基于 TypeScript 的框架无关颜色引擎：输入一个种子色，生成感知过渡更均匀的品牌色阶、品牌关联中性色阶，以及浅色/深色语义主题。

## 能力

- 默认生成 10 阶品牌色；
- `fixed-anchor`、`adaptive-anchor`、`tonal` 三种策略；
- 10 或 14 阶低彩度品牌关联中性色；
- 独立设计的浅色与深色语义主题；
- 固定 OKLCH 亮度/色相、二分压缩彩度的 sRGB 色域映射；
- WCAG 2.x 对比度计算与 `report`、`adjust`、`strict` 策略；
- 结构化诊断、稳定错误码和完整 TypeScript 类型；
- 浏览器与 Node.js 均可使用，不依赖 DOM。

核心库不依赖 TDesign，也不导出 `--td-*` Token。演示站已包含独立的应用级 TDesign Adapter，用于真实组件预览和 CSS/JSON/TypeScript 主题导出。该适配器不属于核心 npm 包 API。

## 安装

```bash
pnpm add oklch-ramp
```

已发布到 npm：[oklch-ramp](https://www.npmjs.com/package/oklch-ramp)。当前稳定版本为 `0.1.0`。

## 快速开始

```ts
import { generateColorScale, generateColorTheme, generateNeutralScale } from 'oklch-ramp';

const brand = generateColorScale('#0052D9');
console.log(brand.colors);

const neutral = generateNeutralScale('#0052D9', { steps: 14 });

const theme = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});
```

`#0052D9` 使用默认 `tonal` 策略时会得到类似下面的 10 阶色板：

```ts
[
  '#f0f5ff',
  '#dce9ff',
  '#bdd5ff',
  '#94bbff',
  '#659cff',
  '#327aff',
  '#155dde',
  '#0244b4',
  '#002e84',
  '#001b54',
];
```

算法调整可能改变具体 HEX；如需要视觉完全稳定，应锁定依赖版本并保留产品侧视觉回归快照。

## 三种策略

品牌色阶支持两种端点模式，默认保持现有曲线行为：

```ts
generateColorScale('#0052D9', { endpoints: 'curve' });
generateColorScale('#0052D9', { endpoints: 'black-white' });
generateColorTheme('#0052D9', { scale: { endpoints: 'black-white' } });
```

`curve` 保留带色端点；`black-white` 将整条明度曲线拉伸到纯白至纯黑，首尾色度设为零。黑白模式的固定锚点只能选择中间阶位。中性色阶不受该选项影响。

### `tonal`（默认）

把输入色作为色相和彩度来源，使用完整的标准亮度曲线重建色阶。输入色不保证原样出现在数组中，适合未知质量的用户输入，也最能应对过浅或过深的种子色。

```ts
generateColorScale('#dce9ff', { strategy: 'tonal' });
```

### `adaptive-anchor`

保留规范化后的输入色，并根据输入的感知亮度自动选择锚点。适合品牌色必须保留，但它未必适合作为固定“第 6 阶”的情况。

```ts
const result = generateColorScale('#dce9ff', {
  strategy: 'adaptive-anchor',
});

console.log(result.anchorIndex);
```

### `fixed-anchor`

把输入色固定在显式阶位。`anchorIndex` 使用从 0 开始的索引，默认值 `5` 对应“第 6 阶”。极浅或极深输入可能让锚点一侧的可用亮度空间不足，结果会返回诊断警告。

```ts
generateColorScale('#0052D9', {
  strategy: 'fixed-anchor',
  anchorIndex: 5,
});
```

## 主题与色阶的区别

`generateColorScale` 只生成按亮度排列的原始颜色，没有按钮、文字或背景含义。

`generateColorTheme` 在品牌色阶和中性色阶之上建立语义，例如：

- `brand.default / hover / active / disabled`；
- `brand.onBrand / focusRing / subtle`；
- `background.page / container / elevated`；
- `text.primary / secondary / link`；
- `border.default / strong / focus`。

深色主题拥有独立映射，不是把浅色色阶简单倒序。

## 对比度策略

```ts
generateColorTheme('#0052D9', {
  contrastPolicy: 'report', // 默认，只报告
});

generateColorTheme('#0052D9', {
  contrastPolicy: 'adjust', // 从现有色阶选择距离最近的合格颜色
});

generateColorTheme('#0052D9', {
  contrastPolicy: 'strict', // 存在失败项时抛出 ColorScaleError
});
```

默认目标：普通文本 `4.5:1`，重要非文本元素 `3:1`。主题 Token 不包含字号信息，因此不暴露无法准确应用的“大文本”目标。

## 诊断

合法但不理想的输入不会静默失败：

```ts
const result = generateColorScale('#f8fbff', {
  strategy: 'fixed-anchor',
});

for (const message of result.diagnostics.messages) {
  console.log(message.code, message.severity, message.message);
}
```

常见代码包括：

- `SEED_TOO_LIGHT` / `SEED_TOO_DARK`；
- `SEED_LOW_CHROMA`；
- `SEED_OUT_OF_GAMUT` / `GAMUT_MAPPED`；
- `DUPLICATE_STOPS` / `LOW_ADJACENT_DIFFERENCE`；
- `CONTRAST_TARGET_UNMET`；
- `ANCHOR_MOVED`。

无法解析的颜色、无效配置以及 strict 模式对比度失败会抛出 `ColorScaleError`，并带有稳定的 `code`。

## 输出格式

```ts
generateColorScale('#0052D9', { output: 'hex' });
generateColorScale('#0052D9', { output: 'rgb' });
generateColorScale('#0052D9', { output: 'oklch' });
```

无论输出字符串格式如何，`stop.oklch` 都会保留最终映射后的数值，方便调试和二次消费。

## 本地开发

项目使用 [Vite+](https://viteplus.dev/guide/) 0.3。安装 Vite+ 后，从仓库根目录执行；先构建 library，生成工作区引用所需的类型声明：

```bash
vp install
vp pack
vp check
vp test
vp run coverage
vp run benchmark
```

### 交互式演示站

OKRamp 演示站位于 `playground/`，使用 React 19、TDesign React 1.18.3 和 Vite+，直接引用工作区中的引擎源码。界面参考 TDesign React Starter 的侧边导航与卡片布局，覆盖三种策略、阶数与锚点、输出格式、色相偏移、中性色染色、明暗主题、对比度策略和诊断。

提供真实 TDesign 组件与项目列表预览、31 个主题变量映射，以及通用/TDesign 导出。浅色、深色预览及其浮层独立作用域。详见 [演示站说明](./playground/README.md)。

从仓库根目录启动：

```bash
vp run demo
```

也可以独立运行：

```bash
cd playground
vp dev
vp check
vp build
```

## 文档

- [详细 API](./docs/API.md)
- [算法说明](./docs/ALGORITHMS.md)
- [npm 自动发版与首次配置](./docs/RELEASING.md)

## 兼容性

- ESM-only；
- Node.js 20 及以上；
- 支持现代浏览器打包；
- 包含 `.d.mts` 类型声明；
- 当前输出基线为 sRGB。

## License

MIT
