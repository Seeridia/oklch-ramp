# @okramp/shadcn

现代 shadcn/ui 完整 CSS 颜色变量适配。安装：`npm install @okramp/core @okramp/shadcn`。

```ts
import { generateColorTheme } from '@okramp/core';
import { createShadcnCss, createShadcnTokens } from '@okramp/shadcn';
const result = generateColorTheme('#0052D9', { mode: 'both' });
const css = createShadcnCss(result);
const light = createShadcnTokens(result.themes.light!);
```

CSS 使用 :root / .dark，语义变量引用品牌、中性色阶或显式基础色。
在现有主题声明之后加载，保留 Tailwind @theme 的语义映射。
覆盖页面、card、popover、primary、secondary、muted、accent、边框、input、ring 和 sidebar。
保留项目原有 destructive、chart、radius 配置，颜色引擎不推断错误色或类别色。
适用于直接使用 var(--primary) 的现代 shadcn；旧版 hsl(var(--primary)) 需要调整为完整颜色变量。
