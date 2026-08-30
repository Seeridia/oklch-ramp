# TypeScript 动态色阶生成库实施计划

## 1. 文档目的

本文档用于指导一个 TypeScript 色彩生成库从设计、实现、验证到发布的完整过程。

库接收一个种子色（例如 `#0052D9`），生成：

- 一套由浅到深、感知过渡均匀的 10 阶品牌色阶；
- 面向浅色与深色界面的语义主题 Token；
- 与品牌色存在视觉关联、但仍保持低彩度的中性色阶；
- 可被后续框架适配层消费的稳定、无框架依赖的数据结构。

第一阶段只实现通用颜色引擎和主题生成能力。TDesign 的变量命名、运行时注入和组件适配不进入核心库，而是在核心 API 稳定后作为独立 Adapter 实现。

---

## 2. 核心设计结论

### 2.1 颜色空间

内部计算统一使用 **OKLCH**：

- `L`：感知亮度，适合组织由浅到深的阶梯；
- `C`：彩度，可控制浅色端、深色端的饱和度衰减；
- `H`：色相，可进行轻微的色相补偿；
- 最终输出默认转换为可直接用于 Web 的 sRGB HEX。

不直接在 RGB 或 HSL 中线性插值。RGB 插值容易产生脏色和不均匀明暗；HSL 的数值步长也不等于人眼感知上的均匀步长。

### 2.2 三种品牌色阶策略

核心库同时提供三种策略：

1. `fixed-anchor`：把输入色固定到指定阶位，默认可设为第 6 阶；
2. `adaptive-anchor`：根据输入色的实际亮度，选择最接近的合理阶位；
3. `tonal`：将输入色视为色相与彩度来源，按预设的感知亮度曲线重建完整色阶，不承诺某一阶与输入 HEX 完全相等。

默认策略使用 `tonal`。它对过浅、过深或极端高彩度的输入最稳健。需要保留品牌色精确值时，可显式选择 `fixed-anchor`；需要尽可能保留输入色同时避免不合理锚点时，选择 `adaptive-anchor`。

### 2.3 色阶与主题分层

`generateColorScale` 只回答“有哪些颜色”，返回无业务含义的有序色阶。

`generateColorTheme` 回答“这些颜色在界面中如何使用”，返回浅色/深色模式下的背景、文字、边框、主按钮、悬浮、按下、禁用等语义 Token。

两者分开是为了避免将具体 UI 规则固化进底层算法，同时使同一套色阶能服务多个产品、主题模式和组件库。

---

## 3. 项目范围

### 3.1 第一阶段范围

- 解析常用 CSS 颜色输入，至少支持 HEX、RGB(A)、HSL(A)；
- 将输入规范化到 OKLCH；
- 生成 10 阶品牌色阶；
- 支持 `fixed-anchor`、`adaptive-anchor`、`tonal`；
- 生成 10 阶或 14 阶 tinted neutral 中性色阶；
- 生成浅色和深色语义主题；
- 进行 sRGB 色域映射；
- 计算 WCAG 对比度；
- 返回可机器处理的诊断信息和警告；
- 提供 ESM/CJS（若 VitePlus 当前打包能力与目标环境需要）以及 TypeScript 类型声明；
- 建立单元测试、属性测试和色板快照/视觉验证。

### 3.2 明确不进入第一阶段的内容

- TDesign 专属 Token 名称和 CSS 变量注入；
- React、Vue、Angular 等框架绑定；
- 在线色板编辑器；
- 自动替用户决定完整品牌规范；
- CIEDE2000 等传统 Lab 算法的兼容模式；
- Display-P3 原生输出；第一阶段可以保留扩展点，但以 sRGB 为发布基线；
- 基于环境光、设备显示能力或用户视觉障碍的实时自适应。

---

## 4. 建议目录结构

```text
色阶/
├─ src/
│  ├─ index.ts                    # 公共导出入口
│  ├─ types.ts                    # 公共类型
│  ├─ constants/
│  │  ├─ curves.ts                # 默认亮度/彩度曲线
│  │  └─ thresholds.ts            # 对比度与算法阈值
│  ├─ color/
│  │  ├─ parse.ts                 # 输入解析与规范化
│  │  ├─ convert.ts               # OKLCH/sRGB 转换封装
│  │  ├─ gamut.ts                 # 色域检测和映射
│  │  ├─ contrast.ts              # 相对亮度与对比度
│  │  └─ delta.ts                 # 色差/相邻阶差异工具
│  ├─ scale/
│  │  ├─ generate.ts              # 色阶生成统一入口
│  │  ├─ fixed-anchor.ts          # 固定锚点策略
│  │  ├─ adaptive-anchor.ts       # 自适应锚点策略
│  │  ├─ tonal.ts                 # 调性色板策略
│  │  ├─ neutral.ts               # 品牌关联中性色
│  │  └─ validate.ts              # 单调性、重复色等检查
│  ├─ theme/
│  │  ├─ generate.ts              # 主题统一入口
│  │  ├─ light.ts                 # 浅色模式语义映射
│  │  ├─ dark.ts                  # 深色模式语义映射
│  │  └─ foreground.ts            # 前景色选择与对比度修正
│  └─ diagnostics/
│     ├─ warnings.ts              # 警告代码定义
│     └─ report.ts                # 诊断汇总
├─ tests/
│  ├─ unit/
│  ├─ properties/
│  ├─ fixtures/
│  └─ visual/
├─ examples/
│  └─ basic.ts
├─ docs/
│  ├─ algorithms.md
│  ├─ api.md
│  └─ integration.md
├─ package.json
├─ tsconfig.json
├─ vite.config.ts                 # 仅在 VitePlus/打包方案需要时保留
├─ vp.config.ts                   # 以 VitePlus 实际版本配置格式为准
├─ README.md
└─ IMPLEMENTATION_PLAN.md
```

目录和配置文件名称应在初始化时根据所采用的 VitePlus 版本再次核对，避免在尚未锁定版本前写死已变化的配置格式。

---

## 5. 公共 API 设计

### 5.1 品牌色阶 API

```ts
export function generateColorScale(seed: ColorInput, options?: ColorScaleOptions): ColorScaleResult;
```

建议类型：

```ts
export type ColorInput = string;

export type ScaleStrategy = 'fixed-anchor' | 'adaptive-anchor' | 'tonal';

export interface ColorScaleOptions {
  steps?: number; // 第一阶段正式支持 10，内部避免写死
  strategy?: ScaleStrategy; // 默认 tonal
  anchorIndex?: number; // fixed-anchor 使用，0-based
  output?: 'hex' | 'rgb' | 'oklch';
  gamutMapping?: 'chroma-reduction' | 'css-oklch';
  hueShift?: number | number[]; // 可选高级能力
  lightnessCurve?: number[]; // 可覆盖默认曲线
  chromaCurve?: number[]; // 可覆盖默认曲线或倍率
  preserveSeed?: boolean; // tonal 下默认 false
  diagnostics?: boolean; // 默认 true
}

export interface ColorStop {
  index: number;
  label: string; // 例如 1...10，避免直接绑定 50...900
  color: string;
  oklch: {
    l: number;
    c: number;
    h: number | null;
  };
  inGamut: boolean;
  source: 'seed' | 'generated' | 'gamut-mapped';
}

export interface ColorScaleResult {
  seed: {
    input: string;
    normalized: string;
    oklch: ColorStop['oklch'];
  };
  strategy: ScaleStrategy;
  anchorIndex: number | null;
  colors: string[];
  stops: ColorStop[];
  diagnostics: Diagnostics;
}
```

### 5.2 中性色阶 API

```ts
export function generateNeutralScale(
  seed: ColorInput,
  options?: NeutralScaleOptions,
): ColorScaleResult;
```

```ts
export interface NeutralScaleOptions {
  steps?: 10 | 14;
  tintStrength?: number; // 建议默认约 0.04～0.10，需实验确定
  hue?: 'seed' | number;
  lightnessCurve?: number[];
  output?: 'hex' | 'rgb' | 'oklch';
  gamutMapping?: ColorScaleOptions['gamutMapping'];
}
```

这里的中性不是严格的 `C = 0`，而是保留极低彩度的品牌色倾向。浅色端应接近背景白，深色端应接近黑灰；中间阶允许稍明显的品牌色温，且必须限制最大彩度，防止中性色看起来像低饱和品牌色。

### 5.3 主题 API

```ts
export function generateColorTheme(seed: ColorInput, options?: ColorThemeOptions): ColorThemeResult;
```

```ts
export type ThemeMode = 'light' | 'dark' | 'both';

export interface ColorThemeOptions {
  mode?: ThemeMode; // 默认 both
  scale?: ColorScaleOptions;
  neutral?: NeutralScaleOptions;
  contrast?: {
    normalText?: number; // 默认 4.5
    nonText?: number; // 默认 3
  };
  contrastPolicy?: 'report' | 'adjust' | 'strict';
}

export interface SemanticTheme {
  mode: 'light' | 'dark';
  color: {
    brand: {
      default: string;
      hover: string;
      active: string;
      disabled: string;
      subtle: string;
      subtleHover: string;
      text: string;
      border: string;
      focusRing: string;
      onBrand: string;
    };
    background: {
      page: string;
      container: string;
      elevated: string;
      disabled: string;
    };
    text: {
      primary: string;
      secondary: string;
      placeholder: string;
      disabled: string;
      inverse: string;
      link: string;
      linkHover: string;
    };
    border: {
      default: string;
      subtle: string;
      strong: string;
      focus: string;
    };
  };
}

export interface ColorThemeResult {
  seed: ColorScaleResult['seed'];
  scales: {
    brand: ColorScaleResult;
    neutral: ColorScaleResult;
  };
  themes: {
    light?: SemanticTheme;
    dark?: SemanticTheme;
  };
  diagnostics: Diagnostics;
}
```

主题 Token 的首版集合应保持“小而完整”。如果未来需要 success、warning、error 等功能色，应通过多个语义种子色或预设生成，不把所有状态色都推导自主品牌色。

### 5.4 错误与诊断 API

无效颜色属于调用错误，应抛出带错误代码的异常；合法但质量不理想的输入不应直接失败，而应返回警告。

```ts
export interface DiagnosticMessage {
  code:
    | 'SEED_TOO_LIGHT'
    | 'SEED_TOO_DARK'
    | 'SEED_LOW_CHROMA'
    | 'SEED_OUT_OF_GAMUT'
    | 'GAMUT_MAPPED'
    | 'DUPLICATE_STOPS'
    | 'LOW_ADJACENT_DIFFERENCE'
    | 'CONTRAST_TARGET_UNMET'
    | 'ANCHOR_MOVED';
  severity: 'info' | 'warning' | 'error';
  message: string;
  stopIndexes?: number[];
  details?: Record<string, unknown>;
}

export interface Diagnostics {
  valid: boolean;
  messages: DiagnosticMessage[];
  contrastChecks?: ContrastCheck[];
}
```

---

## 6. 色彩处理流水线

```mermaid
flowchart LR
  A["颜色输入"] --> B["解析并规范化"]
  B --> C["转换为 OKLCH"]
  C --> D["评估亮度、彩度与色域"]
  D --> E["选择色阶策略与锚点"]
  E --> F["生成目标 L/C/H 曲线"]
  F --> G["映射到 sRGB 色域"]
  G --> H["量化为输出颜色"]
  H --> I["单调性、重复色和色差检查"]
  I --> J["生成中性色阶"]
  J --> K["映射浅色/深色语义 Token"]
  K --> L["对比度验证与诊断"]
```

### 6.1 输入解析与规范化

1. 使用 Culori 解析输入；
2. 拒绝无法解析、包含非有限数值或完全透明且无法表达品牌色的输入；
3. 如果输入包含 alpha，首版建议保留解析结果但在生成实体色阶前明确处理：
   - 默认忽略 alpha 并发出警告；或
   - API 明确要求不透明色并抛错。
4. 将无色相的灰色表示为 `h = null`，避免对 `NaN` 色相进行插值；
5. 保存原始输入、规范化 sRGB 和 OKLCH 值，供诊断和调试。

### 6.2 输入质量分类

先通过可配置阈值对种子色分类：

- 过浅：亮度已接近色阶浅端，没有足够空间继续生成多个浅阶；
- 过深：亮度接近深端；
- 低彩度：品牌特征不足，生成结果会接近中性色；
- 高彩度/超出 sRGB：后续多个阶位可能需要明显压缩彩度；
- 常规输入：适合作为固定或自适应锚点。

阈值不应直接散落在策略代码中，应集中在 `constants/thresholds.ts` 并通过测试和样本调优。首轮建议以数据实验确定，而不是宣称某个阈值具有普适性。

---

## 7. 三种品牌色阶算法

### 7.1 共用曲线模型

每个色阶由三条曲线组成：

```text
L[i] = 第 i 阶目标感知亮度
C[i] = 第 i 阶目标彩度
H[i] = 第 i 阶目标色相
```

基本约束：

- `L` 从浅到深严格递减；
- `C` 通常在极浅端较低，向中间/品牌主阶提升，在极深端适度下降；
- `H` 默认接近输入色相，仅允许很小的可配置偏移；
- 生成后的 sRGB 量化结果不能出现大面积相邻重复；
- 曲线使用归一化位置 `t = i / (steps - 1)` 表达，为未来支持非 10 阶保留空间。

首版优先使用经过测试的离散默认曲线，而不是一开始追求复杂连续公式。离散曲线可读、可审查，后续再抽象为 easing 或样条函数。

### 7.2 `fixed-anchor`

目的：保证输入颜色原样出现在某一阶。

流程：

1. 校验 `anchorIndex`；
2. 将输入色的 `L/C/H` 放置在锚点；
3. 在锚点两侧分别生成浅色段和深色段；
4. 浅色段从近白目标向种子色插值，深色段从种子色向深色目标插值；
5. 调整彩度曲线，避免浅色端荧光感、深色端糊成黑色；
6. 锚点颜色不参与会改变 HEX 的 gamut mapping；如果输入本身是合法 sRGB，必须原值返回；
7. 运行单调性和重复色检查。

风险：当输入本身非常浅或非常深时，固定在第 6 阶会使其中一侧的亮度空间不足，从而产生拥挤、重复或不均匀色阶。

处理方式：

- 返回 `SEED_TOO_LIGHT` 或 `SEED_TOO_DARK`；
- 保持用户明确选择的固定锚点，不静默改动；
- 可在严格模式中拒绝明显不可行的锚点；
- 在诊断信息中推荐 `adaptive-anchor` 或 `tonal`。

### 7.3 `adaptive-anchor`

目的：尽量保留输入色原值，但让输入位于与其亮度相匹配的阶位。

流程：

1. 读取默认目标亮度数组；
2. 计算输入 `L` 与各阶目标 `L[i]` 的距离；
3. 选择距离最小、且两侧仍有合理生成空间的阶位；
4. 对候选阶位加入边界惩罚，避免普通输入轻易落在第一或最后一阶；
5. 把输入色作为精确锚点，分别重建两侧曲线；
6. 如用户同时传入 `anchorIndex`，将它理解为偏好或直接禁止该组合，API 首版必须做出唯一规定；
7. 在结果中返回实际 `anchorIndex`；如果与默认/建议位置不同，添加 `ANCHOR_MOVED` 信息。

候选评分可以采用：

```text
score(i) = abs(seedL - targetL[i])
         + edgePenalty(i)
         + spacingPenalty(i, seedL)
```

首版不必把公式公开为兼容承诺，但必须为典型浅色、深色和中等亮度输入建立固定测试样本。

### 7.4 `tonal`

目的：优先保证整套色阶的系统性，不要求精确保留输入 HEX。

流程：

1. 从输入提取品牌色相 `seedH` 和彩度特征 `seedC`；
2. 使用完整的标准 `L` 曲线，不让输入亮度扭曲整条曲线；
3. 根据 `seedC` 和每阶彩度倍率计算 `C[i]`；
4. 对极低彩度输入设置稳定的色相处理；
5. 对每个候选颜色执行色域映射；
6. 在目标主阶附近选择与输入感知上最接近的一阶，作为“推荐品牌主色”，但 `anchorIndex` 返回 `null` 或另设 `recommendedIndex`，不要声称它是精确锚点；
7. 返回 `preserveSeed: false` 的可观察结果，文档明确说明输入只是生成依据。

`tonal` 最适合作为默认模式，因为过浅输入仍可生成可用的中间和深色阶，过深输入也能得到完整浅色端。

---

## 8. OKLCH 曲线设计

### 8.1 亮度曲线

首版建立一套 10 阶默认亮度目标，示意范围如下：

```text
浅端                                                   深端
0.97, 0.93, 0.87, 0.79, 0.70, 0.61, 0.52, 0.43, 0.34, 0.25
```

这些数字只是实施初始值，不应在未做样本验证前作为最终标准。调优重点：

- 浅色 1～3 阶在白色背景上仍能区分；
- 中间 4～7 阶承担填充、边框、主按钮和交互态；
- 深色 8～10 阶保持色相，不应快速坍缩为近黑；
- 转为 8-bit sRGB 后相邻阶不重复；
- 不同色相（黄、青、蓝、紫、红）的视觉明暗节奏尽量一致。

### 8.2 彩度曲线

使用种子彩度乘以阶位倍率，并根据当前亮度下的 sRGB 可表达范围进行裁剪：

```text
C[i] = min(seedC * chromaFactor[i], maxChromaInGamut(L[i], H[i]))
```

典型趋势：

- 极浅端降低彩度，避免粉笔感或荧光边缘；
- 中间主色区域保持或略增强品牌辨识度；
- 极深端适度降低彩度，避免色域映射导致严重色相偏移；
- 黄色、青色等高亮度色相与蓝紫色不能机械套用完全相同的最终 C 值，色域映射负责做必要限制。

### 8.3 色相补偿

首版默认保持色相不变，只允许极小的预设偏移。原因是大幅自动色相漂移会改变品牌识别，也难以形成可靠的通用规则。

未来可实验：

- 浅端向更暖或更冷方向轻微偏移；
- 深端针对蓝紫色进行 hue correction；
- 使用按色相分区的曲线预设。

所有色相补偿都必须可关闭，并通过视觉样本验证，不能只依据数值看起来连续。

---

## 9. sRGB 色域映射

### 9.1 为什么必须映射

OKLCH 中存在大量无法由 sRGB 显示的颜色。直接裁剪 RGB 通道会造成色相变化、彩度突降或多个阶位变成同一个 HEX。

### 9.2 首版建议算法：固定 L/H，二分降低 C

对每个超出色域的候选颜色：

1. 保持目标 `L` 和 `H`；
2. 在 `[0, targetC]` 上二分搜索；
3. 找到仍处于 sRGB 色域内的最大 `C`；
4. 转换成 sRGB 并量化；
5. 记录原始 C、映射后 C 和压缩比例；
6. 添加 `GAMUT_MAPPED` 诊断。

该方案行为稳定、易测试，并且比简单通道裁剪更能保持色相和亮度意图。后续可评估 CSS Color 4 的 local-MINDE 等感知映射方案，但不应在首版混用多个默认算法。

### 9.3 量化后修复

即使浮点颜色不同，转换成 8-bit HEX 后也可能重复。处理顺序：

1. 检测相邻 HEX 重复；
2. 尝试在安全范围微调 L；
3. 重新做 gamut mapping；
4. 若仍重复，则保留确定性结果并发出 `DUPLICATE_STOPS`；
5. 不进行不可预测的随机扰动。

---

## 10. 品牌关联中性色阶

### 10.1 生成目标

中性色需满足：

- 在纯灰基础上带有轻微品牌色倾向；
- 不抢夺品牌色和功能色的注意力；
- 可覆盖页面背景、容器、边框、禁用态和各级文字；
- 浅色和深色模式都能使用；
- 在同一品牌下具有统一冷暖感。

### 10.2 算法

1. 使用品牌种子色相作为 neutral hue；
2. 采用独立于品牌色阶的亮度曲线；
3. 彩度取很低的绝对值，而不是简单使用品牌彩度倍率；
4. 中间灰可比极浅/极深端略高彩度；
5. 极浅背景和彩色文字附近的中性色应更克制；
6. 对无色相种子或极低彩度种子，回退到预设中性色相或纯中性灰；
7. 生成后执行相同的 sRGB 映射和重复色检查。

可以表达为：

```text
neutralC[i] = min(
  maxNeutralChroma,
  tintStrength * neutralChromaShape[i]
)
```

`tintStrength` 必须有安全上限。即使调用方传入过大值，也应校验或发出警告。

### 10.3 10 阶与 14 阶

- 10 阶：与品牌色阶易对应，适合较简单的设计系统；
- 14 阶：为页面背景、浮层、多个边框层级和文字层级提供更细粒度选择；
- 内部生成器应接受任意曲线长度，但公共 API 第一阶段只承诺 10 和 14；
- 主题映射不应依赖硬编码数组下标，应通过角色选择器或归一化位置取色。

---

## 11. 浅色与深色主题

### 11.1 深色模式不是简单反转

深色主题不能把浅色 Token 索引倒序后直接使用，原因包括：

- 深色背景上的高彩度颜色会显得更亮、更刺眼；
- hover/active 的明暗方向可能与浅色模式不同；
- 边框和分层依赖较小的亮度差；
- 文本和填充需要分别满足对比度；
- 同一品牌主色在深背景上通常需要更高 L、更低或重新约束 C。

### 11.2 主题映射流程

1. 生成品牌和中性色阶；
2. 根据主题模式选择 page/container/elevated 背景；
3. 从中性色阶中选择 primary/secondary/disabled 文本；
4. 从品牌色阶选择 default/hover/active/subtle 等角色；
5. 根据状态关系检查交互态是否可区分；
6. 为 `onBrand` 在近白和近黑候选中选择对比度更高者；
7. 检查文本、非文本控件和焦点环对比度；
8. 按 `contrastPolicy` 报告、修正或失败。

### 11.3 浅色模式建议关系

- `background.page`：neutral 最浅端；
- `background.container`：接近白但与 page 有轻微区分；
- `text.primary`：neutral 最深区域；
- `brand.default`：品牌中间偏深阶；
- `brand.hover`：通常比 default 稍深或彩度稍高；
- `brand.active`：继续加深，并保证和 hover 可区分；
- `brand.subtle`：品牌浅端；
- `brand.onBrand`：通常为白色，但必须通过实际对比度选择。

### 11.4 深色模式建议关系

- `background.page`：neutral 最深端，但不必是纯黑；
- `background.container/elevated`：逐级提高亮度；
- `text.primary`：neutral 浅端；
- `brand.default`：选择比浅色主题更亮的品牌阶；
- `brand.hover`：可以适当提亮，而不是沿用浅色主题的加深规则；
- `brand.active`：结合组件反馈约定决定比 hover 稍亮或稍暗，必须全库一致；
- `brand.subtle`：使用深色背景可承载的低亮度、低彩度品牌色；
- `focusRing`：必须同时与页面背景和相邻控件有足够区分。

首版应通过明确的角色映射表实现，不让主题生成器充斥零散下标。

---

## 12. 对比度与可访问性

### 12.1 检查目标

默认采用 WCAG 2.x 对比度作为发布基线：

- 普通文本：至少 `4.5:1`；
- 重要非文本 UI 和焦点指示：至少 `3:1`。

大文本在 WCAG 中可使用 `3:1`，但当前语义 Token 不携带字号信息，因此主题 API 不暴露无法准确应用的 `largeText` 配置；调用方可以通过公共 `contrastRatio` 工具自行检查具体大文本场景。

APCA 可在后续作为实验诊断指标加入，但首版不应同时将两套模型作为强制门槛，以免产生难以解释的冲突。

### 12.2 `contrastPolicy`

- `report`：不改变颜色，只返回失败项；默认建议采用；
- `adjust`：在预设候选阶位中寻找满足目标的最近颜色，不能任意漂移品牌色；
- `strict`：存在必须满足但无法满足的角色时抛出结构化错误。

自动修正的搜索顺序应确定且可测试。例如先尝试相邻阶位，再选择黑/白前景，最后报告失败。不能在用户不知情的情况下无限调整种子色。

---

## 13. 依赖与工具链

### 13.1 运行时依赖

首选 **Culori**，用于：

- CSS 颜色解析；
- sRGB、OKLab、OKLCH 转换；
- 色域判断或辅助函数；
- 颜色格式化。

核心算法的曲线、锚点选择、色域压缩策略和诊断逻辑由本库实现，避免把产品行为完全交给某个第三方 palette generator。

是否引入其他运行时依赖应遵循最小化原则。对比度公式简单且需要稳定行为，建议自行实现并用权威样例验证。

### 13.2 VitePlus

计划使用 VitePlus 统一开发工具链，预期职责：

- `vp pack`：构建 npm 包和类型声明；
- `vp test`：运行单元测试、属性测试及覆盖率；
- `vp check`：执行类型检查、代码风格和静态检查；
- 通过其 workspace/任务能力为后续核心包、可视化示例和 Adapter 扩展保留空间。

实施前必须以项目实际锁定版本的官方文档为准，核对：

- package 配置字段；
- library build 的入口和产物格式；
- DTS 生成方式；
- 测试配置格式；
- lint/format/check 的默认规则；
- Node.js 最低版本；
- monorepo 和 changeset/release 支持边界。

不要同时堆叠一套重复的 ESLint、Prettier、tsup、Vitest 配置，除非 VitePlus 缺少必要能力或生态兼容性要求明确。若底层测试运行器兼容 Vitest API，可以使用 Vitest 风格测试，但脚本入口仍统一为 `vp test`。

### 13.3 开发依赖候选

- `typescript`：类型系统与声明；
- `culori`：颜色转换；
- VitePlus 对应的官方包；
- `fast-check`：属性测试候选；如果 VitePlus 测试环境兼容且包体/维护成本可接受；
- 可选的轻量可视化示例，仅用于人工检查，不作为运行时依赖。

### 13.4 包发布要求

- `sideEffects: false`，前提是所有入口确实无副作用；
- 正确配置 `exports`、`types`；
- 浏览器与 Node 环境均不依赖 DOM；
- 公开 API 可 tree-shaking；
- 不在模块初始化时读取系统主题或浏览器状态；
- 锁定最低 Node 和 TypeScript 支持版本；
- 首版发布前检查 ESM/CJS 的真实消费需求，若无必要可优先 ESM-only，减少双包歧义。

---

## 14. 分阶段实施计划

### 阶段 0：技术验证与基准样本

任务：

- 锁定 VitePlus、TypeScript、Culori 版本；
- 验证 Culori 的解析、OKLCH 转换和 gamut API 行为；
- 收集覆盖不同色相/亮度/彩度的种子色样本；
- 建立预期特性，不急于固定所有 HEX 快照；
- 确认输出包格式和目标运行环境。

建议样本至少包括：

- 标准蓝 `#0052D9`；
- 高亮黄；
- 高彩青；
- 红色；
- 紫色；
- 很浅的品牌色；
- 很深的品牌色；
- 低彩度灰蓝；
- 纯白、纯黑、纯灰边界；
- 带 alpha 和非法输入。

验收：

- 开发、测试、检查、构建命令可运行；
- 已记录依赖版本和 API 验证结果；
- 基准样本进入 fixtures。

### 阶段 1：颜色基础设施

任务：

- 实现输入解析与结构化错误；
- 封装 OKLCH/sRGB 转换；
- 实现 sRGB in-gamut 判断；
- 实现固定 L/H 的彩度二分压缩；
- 实现相对亮度和 WCAG 对比度；
- 定义诊断结构。

验收：

- 常见 CSS 输入可正确解析；
- 转换往返误差有明确容限；
- gamut mapping 输出始终位于 sRGB；
- 对比度通过官方黑白等已知样例验证；
- 非法输入产生稳定错误码。

### 阶段 2：三种品牌色阶策略

任务：

- 定义首版默认 L/C 曲线；
- 实现共用曲线工具；
- 实现 `fixed-anchor`；
- 实现 `adaptive-anchor` 及评分逻辑；
- 实现默认 `tonal`；
- 实现相邻重复、亮度单调和低差异诊断；
- 保证相同输入和配置产生完全确定的结果。

验收：

- 每种策略都返回 10 阶；
- `fixed-anchor` 的指定阶与规范化输入精确一致；
- `adaptive-anchor` 对浅/深输入能移动到合理位置；
- `tonal` 对极端输入仍生成完整亮度跨度；
- 所有输出都在 sRGB；
- L 总体严格递减；如量化限制导致异常，必须有诊断；
- 无 `NaN`、无限值或非法颜色字符串。

### 阶段 3：品牌关联中性色阶

任务：

- 设计 10/14 阶 neutral L 曲线；
- 设计低彩度形状和安全上限；
- 实现无色相种子的回退；
- 建立暖色、冷色、高彩品牌种子的视觉样本；
- 验证文字与背景用途。

验收：

- 10/14 阶数量正确；
- 中性色保持低彩度上限；
- 亮度顺序稳定；
- 不同品牌色能观察到克制且一致的色调关联；
- 极浅/极深阶仍适合作为背景和文字候选。

### 阶段 4：浅色/深色语义主题

任务：

- 定义最小语义 Token 集；
- 建立 light/dark 角色映射表；
- 实现 `onBrand` 前景选择；
- 实现三种对比度策略；
- 统一交互态顺序；
- 汇总品牌和 neutral 的诊断。

验收：

- `mode: light | dark | both` 行为正确；
- 深色主题不是浅色数组简单倒序；
- 默认品牌样本的关键文字/背景组合满足目标或明确报告失败；
- hover/active/disabled 在视觉和数值上可区分；
- 所有主题 Token 都可追溯到具体 scale stop 或修正决策。

### 阶段 5：质量、文档与发布准备

任务：

- 完成 API 文档和算法说明；
- 添加基本用法和高级配置示例；
- 建立颜色样本展示页或静态 HTML 报告；
- 完成 bundle、类型声明和消费测试；
- 添加变更记录和版本策略；
- 进行性能基准测试。

验收：

- `vp check`、`vp test`、`vp pack` 全部通过；
- 从干净临时项目可以安装并导入；
- 类型声明无内部路径泄漏；
- README 能独立说明三种策略的差异；
- 发布包不包含无关源码、测试产物或大型截图；
- 批量生成不会产生明显性能问题。

### 阶段 6：TDesign Adapter（后续独立工作）

该阶段不修改核心算法，只消费核心库输出。

建议形成独立包或应用侧模块，例如：

```text
packages/
├─ color-core/
└─ tdesign-color-adapter/
```

Adapter 的职责：

- 将通用语义 Token 映射为 TDesign 对应变量；
- 按目标 TDesign 技术栈处理 CSS Variables、Less Variables 或主题配置；
- 支持浅色和深色变量集合；
- 提供 DOM 注入或 CSS 文本输出；
- 针对实际使用的 TDesign 版本建立契约测试；
- 检测 TDesign 升级后 Token 名称或组件消费关系变化。

核心库不得：

- 导出 `--td-*` 变量；
- 依赖 TDesign 包；
- 假设 TDesign 的品牌色阶编号；
- 将某个组件库的 hover/active 规则变成底层算法规则。

---

## 15. 测试策略

### 15.1 单元测试

覆盖：

- 各输入格式解析；
- 色彩空间转换；
- gamut mapping；
- 对比度计算；
- 曲线插值；
- 锚点选择；
- 三种策略；
- neutral 生成；
- light/dark Token 映射；
- 错误和警告。

单元测试应优先断言算法不变量，不要让所有测试都依赖完整 HEX 数组快照，否则任何合理调优都会造成大量无意义更新。

### 15.2 属性测试

随机生成合法 sRGB 种子色，验证：

- 不抛出非预期异常；
- 输出数量正确；
- 所有通道有限；
- 所有 HEX 格式有效；
- 输出均在 sRGB；
- 亮度方向正确；
- `fixed-anchor` 保留输入；
- 结果确定性；
- neutral 彩度不超过上限；
- 主题引用的颜色都来自结果或被标记为对比度修正色。

对随机失败用例保留 seed，转化为固定回归测试。

### 15.3 快照测试

只为少量代表性种子建立稳定快照：

- 用于检测大范围算法漂移；
- 快照同时保存 HEX 和 OKLCH；
- 算法调优导致快照变化时，必须配合视觉审查和变更说明；
- 不用快照代替不变量断言。

### 15.4 视觉测试

生成静态色板矩阵：

- 行：典型种子色；
- 列：10 个色阶；
- 分组：三种策略；
- 附加：light/dark 背景上的按钮、文本、边框和状态示例；
- 显示每阶 HEX、OKLCH 和关键对比度。

视觉审查重点：

- 是否有突跳；
- 浅端是否脏、深端是否发黑；
- 品牌色相是否漂移；
- 相邻阶是否难以区分；
- 深色主题是否过度发光；
- tinted neutral 是否过彩；
- 黄、青、紫等困难色相是否表现异常。

### 15.5 消费与兼容测试

- ESM 导入；
- 若发布 CJS，则测试 `require`；
- TypeScript 类型推断；
- tree-shaking；
- Node 环境无 DOM 运行；
- 浏览器打包；
- 最低支持版本验证；
- 未来 Adapter 对核心返回结构做契约测试。

---

## 16. 性能目标

颜色生成不是高频渲染算法，但仍需保证可用于主题实时切换。

建议目标：

- 单次品牌色阶 + neutral + 双主题生成在普通桌面环境中保持毫秒级；
- 不使用随机数，结果可缓存；
- 相同 `seed + options` 可由调用方或未来可选缓存层复用；
- 色域二分搜索设定最大迭代次数和容差；
- 核心库不持有全局可变状态。

性能测试至少比较：单次调用、1,000 次批量调用、最坏色域映射输入。

---

## 17. 风险与应对

| 风险                      | 影响                       | 应对                                                 |
| ------------------------- | -------------------------- | ---------------------------------------------------- |
| 一套曲线无法适配所有色相  | 黄、青、紫等视觉节奏不一致 | 先建立跨色相样本；后续引入少量分区预设，不急于复杂化 |
| 过浅/过深输入作为固定锚点 | 一侧色阶拥挤或重复         | 默认 tonal；提供 adaptive；fixed 返回明确警告        |
| OKLCH 超出 sRGB           | 色相漂移或重复 HEX         | 固定 L/H、二分压缩 C，并记录诊断                     |
| 自动对比度修正改变品牌感  | UI 合规但不符合品牌预期    | 默认 report；adjust 只在候选阶中搜索；保留修正记录   |
| 深色模式直接复用浅色规则  | 颜色刺眼、层级不清         | 独立角色映射和对比度验证                             |
| tinted neutral 彩度过高   | 中性色抢夺注意力           | 使用绝对彩度上限和专用曲线                           |
| 快照过度约束算法          | 难以持续调优               | 以不变量测试为主，少量代表性快照为辅                 |
| VitePlus 生态快速变化     | 配置或命令失效             | 初始化时锁版本并依据当期官方文档验证，不提前写死细节 |
| TDesign Token 版本变化    | Adapter 映射失效           | 独立包、版本矩阵、契约测试，不污染核心库             |

---

## 18. 兼容性与版本策略

以下内容一旦发布，应视为公共契约：

- 函数名与参数结构；
- 策略名称；
- 返回对象字段；
- 错误和诊断代码；
- Token 的语义名称。

以下内容可在 minor 版本中调优，但必须记录：

- 默认 L/C 曲线；
- gamut mapping 容差；
- adaptive 锚点评分权重；
- 主题角色对应的具体阶位；
- 对比度自动修正候选顺序。

因为算法微调会改变输出颜色，建议：

- 在结果或包元数据中暴露算法版本；
- 重要曲线升级写入 changelog；
- 对需要视觉完全稳定的使用方，允许选择预设版本，例如 `preset: 'v1'`；
- 不承诺不同 minor 版本生成的 HEX 永远不变，除非使用锁定预设。

---

## 19. 最终验收清单

> 实施状态（2026-08-30）：核心库阶段已完成。TDesign Adapter 按原定边界留待后续独立实施。

二次验收后已补充：半透明前景合成、主题最低阶数限制、统一输出格式、边框语义顺序、覆盖率门槛、性能基准和完整发布文档打包。

功能：

- [x] 支持三种品牌色阶策略；
- [x] 默认策略为 `tonal`；
- [x] 支持 10 阶品牌色；
- [x] 支持 10/14 阶 tinted neutral；
- [x] 支持 light/dark/both；
- [x] 支持 sRGB gamut mapping；
- [x] 支持对比度报告与策略；
- [x] 对极浅、极深、低彩度和非法输入有明确行为。

质量：

- [x] 单元测试通过；
- [x] 属性测试通过；
- [x] 代表性快照经审查；
- [x] 视觉样本经人工检查；
- [x] 关键对比度满足目标或有诊断；
- [x] 输出确定、无 `NaN`、无非法颜色；
- [x] `vp check`、`vp test`、`vp pack` 通过。

发布：

- [x] 类型声明正确；
- [x] exports 配置正确；
- [x] 构建产物通过包名自引用消费测试；
- [x] API、算法、限制和迁移策略已文档化；
- [x] 核心包不包含 TDesign 依赖或 `--td-*` Token；
- [x] TDesign Adapter 的输入边界和后续任务已记录。

---

## 20. 已落地决策与后续待定项

核心库已经采用以下选择：

1. 首版发布 ESM-only；
2. `fixed-anchor` 使用 0-based `anchorIndex`，默认 `5`，文档称“第 6 阶”；
3. 色阶采用中性标签 `1...N`，同时提供 0-based `index`；
4. alpha 输入被忽略并返回 `ALPHA_IGNORED`；
5. tonal 返回 `recommendedIndex`，但 `anchorIndex` 为 `null`；
6. `anchorIndex` 只允许与 fixed-anchor 同时使用，其他策略传入时抛出 `INVALID_OPTIONS`；
7. `report`、`adjust`、`strict` 均作为首版能力实现，默认使用 `report`；
8. Node.js 最低版本为 20，工具链锁定 VitePlus 0.3.0 与 TypeScript 6.0.3；
9. 0.1.0 暂未暴露算法 preset 版本，稳定发布前仍建议增加 `preset: 'v1'`；
10. TDesign Adapter 的具体目标技术栈和 TDesign 版本仍待后续接入阶段确定。
