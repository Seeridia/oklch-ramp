# 核心 API

`@okramp/core` 的参数、返回结构和错误处理参考。所有示例均使用 ESM 导入。

[项目首页](../README.md) · [算法说明](./ALGORITHMS.md)

## `generateColorScale(seed, options?)`

生成品牌色阶。

```ts
interface ColorScaleOptions {
  endpoints?: 'curve' | 'black-white';
  steps?: number;
  strategy?: 'fixed-anchor' | 'adaptive-anchor' | 'tonal';
  anchorIndex?: number;
  output?: 'hex' | 'rgb' | 'oklch';
  gamutMapping?: 'chroma-reduction';
  hueShift?: number | readonly number[];
  lightnessCurve?: readonly number[];
  chromaCurve?: readonly number[];
}
```

- `steps`：默认 10，允许 3～20；标准视觉预设是 10 阶。
- `strategy`：默认 `tonal`。
- `endpoints`：默认 `curve`，保留预设或自定义曲线的端点行为；`black-white` 将整条明度曲线归一化到 1→0，首尾色度强制为 0。适用于三种策略，仅影响品牌色阶。固定锚点必须位于中间阶位，否则抛出 `INVALID_OPTIONS`。自定义曲线也遵循此归一化规则，内部色度倍率保持不变。
- `anchorIndex`：仅能用于 `fixed-anchor`，从 0 开始，默认 5。
- `hueShift`：可以为所有阶位增加同一个角度，也可以传入与阶数等长的数组。
- `lightnessCurve`：必须与阶数等长，值位于 0～1 且严格递减。
- `chromaCurve`：必须与阶数等长，值为非负数，表示种子彩度倍率。

返回：

```ts
interface ColorScaleResult {
  seed: {
    input: string;
    normalized: string;
    oklch: { l: number; c: number; h: number | null };
  };
  strategy: ScaleStrategy;
  anchorIndex: number | null;
  recommendedIndex: number;
  colors: string[];
  stops: ColorStop[];
  diagnostics: Diagnostics;
}
```

`anchorIndex` 只表示“输入原值所在的位置”，因此 tonal 返回 `null`。`recommendedIndex` 在所有策略下都可用，表示与规范化输入色感知距离最近的阶位；是否用于具体品牌角色由主题映射决定。

## `generateNeutralScale(seed, options?)`

生成带有轻微品牌色倾向的中性色阶。

```ts
interface NeutralScaleOptions {
  steps?: 10 | 14;
  tintStrength?: number;
  hue?: 'seed' | number;
  lightnessCurve?: readonly number[];
  output?: 'hex' | 'rgb' | 'oklch';
  gamutMapping?: 'chroma-reduction';
}
```

- 默认 14 阶；
- `tintStrength` 是最大 OKLCH 彩度，默认 `0.025`，安全上限 `0.08`；
- 实际彩度还会受到种子彩度约束；
- 灰色种子会自然回退为无彩或接近无彩的中性色。

## `generateColorTheme(seed, options?)`

同时生成品牌色阶、中性色阶和语义主题。

```ts
interface ColorThemeOptions {
  mode?: 'light' | 'dark' | 'both';
  scale?: ColorScaleOptions;
  neutral?: NeutralScaleOptions;
  contrast?: {
    normalText?: number;
    nonText?: number;
  };
  contrastPolicy?: 'report' | 'adjust' | 'strict';
}
```

语义主题要求品牌色阶至少包含 10 阶，以保证 default、hover、active 等角色可以分配到不同颜色。品牌与中性色的 `output` 必须一致；只设置其中一个时，另一个会自动跟随。

返回结果包含：

```ts
{
  seed,
  scales: { brand, neutral },
  themes: { light?, dark? },
  diagnostics,
}
```

`adjust` 只从已经生成的色阶中选择距离原值最近、并满足目标的候选色，不会无限制改变色相或创造隐藏颜色。`brand.onBrand` 例外：它从纯黑与纯白中选择对比度更高者。

## 对比度工具

```ts
relativeLuminance('#0052d9');
contrastRatio('#ffffff', '#0052d9');
chooseContrastingForeground('#0052d9');
```

实现基于 WCAG 2.x sRGB 相对亮度。

`contrastRatio` 会先把半透明前景合成到不透明背景上；半透明背景因为缺少底层颜色会被拒绝。`relativeLuminance` 只接受不透明颜色。

## `ColorScaleError`

```ts
try {
  generateColorScale('invalid');
} catch (error) {
  if (error instanceof ColorScaleError) {
    console.log(error.code, error.details);
  }
}
```

错误代码：

- `INVALID_COLOR`；
- `INVALID_OPTIONS`；
- `CONTRAST_TARGET_UNMET`。

## 输入说明

输入由 Culori 解析，支持其可识别的 CSS 颜色字符串。生成结果是不透明色；输入 alpha 会被忽略，并产生 `ALPHA_IGNORED` 警告。

输入若来自比 sRGB 更大的颜色空间，会先映射到 sRGB，因此 fixed/adaptive 保留的是 `seed.normalized` 所代表的 sRGB 颜色。

## 相邻色阶诊断

相邻色阶诊断 `LOW_ADJACENT_DIFFERENCE` 使用 OKLab 欧氏色差，当前提示阈值为 0.025（经验值，并非 WCAG 标准）。品牌色阶为 `warning`，中性色阶为 `info`，因为细微差异可用于背景层次；颜色重复的 `DUPLICATE_STOPS` 仍为 `warning`。这些提示不代表生成失败。`details` 包含 `scale`（brand/neutral）、`metric`、`threshold` 和 `pairs`；每对含从 0 开始的 `from`、`to` 索引及实际 `distance`。
