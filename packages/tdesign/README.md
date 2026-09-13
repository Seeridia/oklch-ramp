# @okramp/tdesign

[![npm version](https://img.shields.io/npm/v/%40okramp%2Ftdesign?color=0052D9)](https://www.npmjs.com/package/@okramp/tdesign)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Seeridia/okramp/blob/main/LICENSE)

将 OKRamp 品牌色阶和关联中性色映射为 TDesign 主题变量。

[在线指南](https://okramp.seeridia.top/?page=guide&guideDoc=integrations/tdesign) · [源码](https://github.com/Seeridia/okramp/tree/main/packages/tdesign)

## 安装

```sh
npm install @okramp/core @okramp/tdesign
```

在已有 TDesign 项目中使用；React 项目需要另外安装 `tdesign-react`。

## 生成主题 CSS

```ts
import { generateColorTheme } from '@okramp/core';
import { createTDesignCss } from '@okramp/tdesign';

const result = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});
const css = createTDesignCss(result);
```

将输出保存为 `okramp-theme.css`，在默认样式之后加载：

```ts
import 'tdesign-react/dist/tdesign.css';
import './okramp-theme.css';

// 切换到深色模式
document.documentElement.setAttribute('theme-mode', 'dark');
// 切换到浅色模式
document.documentElement.setAttribute('theme-mode', 'light');
```

CSS 包含品牌、中性色和必要的基础颜色变量，`--td-*` 语义变量引用这些基础变量。主题仅包含实际生成的模式。

## 运行时变量

```ts
import { createTDesignTokens } from '@okramp/tdesign';

const tokens = createTDesignTokens(result);
for (const [name, value] of Object.entries(tokens.light)) {
  document.documentElement.style.setProperty(name, value);
}
```

变量对象包含实际颜色值。内联注入优先于样式表；采用这种方式时，切换模式需要重新应用对应对象，而不只是修改 `theme-mode`。

## API

| 导出 | 用途 |
| --- | --- |
| `createTDesignCss(result)` | 返回基础变量和明暗语义变量的 CSS 字符串 |
| `createTDesignTokens(result)` | 返回 `{ light, dark }` 变量对象，未生成的模式为空对象 |
| `toTDesignTheme(theme, neutral?)` | 将单个语义主题映射为 TDesign 变量，传入中性色阶以应用中性角色层级 |
| `mappedThemes` | `createTDesignTokens` 的同一实现 |
| `TOKEN_MAP`、`semanticValue` | 用于自定义映射的底层工具 |

## 适配范围

覆盖品牌交互、文字、背景与边框颜色，成功、警告、错误及字号、间距、圆角沿用 TDesign 默认值。中性角色参考 TDesign React 的背景与边框层级，不是官方主题生成算法的复刻。

组件库映射会影响最终颜色组合，核心语义主题的对比度结果不能代替实际页面的评估。局部应用变量时，还需确保 Dialog、Popup 等浮层挂载在对应主题作用域中。

## 许可证

MIT
