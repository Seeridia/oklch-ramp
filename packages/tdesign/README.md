# okramp-tdesign

TDesign React 主题适配包，基于 OKRamp 的品牌与中性色阶生成语义变量。
已发布到 npm：`npm install okramp okramp-tdesign`。

```ts
import { generateColorTheme } from 'okramp';
import { createTDesignTokens, createTDesignCss } from 'okramp-tdesign';

const theme = generateColorTheme('#0052D9', { mode: 'both', contrastPolicy: 'adjust' });
const tokens = createTDesignTokens(theme); // { light, dark }
const css = createTDesignCss(theme);
```

CSS 在 TDesign 样式之后加载，通过 `theme-mode="dark"` 切换深色主题。
语义 Token 引用品牌、中性色及基础颜色变量，状态色沿用 TDesign 默认值。
同时导出 `toTDesignTheme(theme, neutral)`、`TOKEN_MAP` 和 `semanticValue`。

本地打包：先在根目录执行 `vp pack`，再执行 `vp -C packages/tdesign pack`。
