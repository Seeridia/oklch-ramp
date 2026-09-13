# @okramp/shadcn

[![npm version](https://img.shields.io/npm/v/%40okramp%2Fshadcn?color=0052D9)](https://www.npmjs.com/package/@okramp/shadcn)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Seeridia/okramp/blob/main/LICENSE)

为 shadcn/ui 生成完整 CSS 颜色变量，支持浅色、深色以及 sidebar 主题。

[在线指南](https://okramp.seeridia.top/?page=guide&guideDoc=integrations/shadcn) · [源码](https://github.com/Seeridia/okramp/tree/main/packages/shadcn)

## 安装

在已有 shadcn/ui 项目中安装：

```sh
npm install @okramp/core @okramp/shadcn
```

## 生成主题

```ts
import { generateColorTheme } from '@okramp/core';
import { createShadcnCss } from '@okramp/shadcn';

const result = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});
const css = createShadcnCss(result);
```

将输出保存为 CSS 文件，在现有主题声明之后加载。保留 Tailwind 的 `@theme` 语义映射和组件源码。输出中的语义变量引用品牌、中性色阶及必要的基础颜色变量。

## 深色模式

导出选择器为 `:root` 和 `.dark`：

```ts
document.documentElement.classList.toggle('dark', true);
```

如果项目已使用主题管理器，继续由它管理 `dark` 类即可。生成时使用 `mode: 'both'`，确保两种模式都包含在 CSS 中。

## API

| 函数 | 返回值 |
| --- | --- |
| `createShadcnCss(result)` | 包含基础色阶及已生成模式的 CSS 字符串 |
| `createShadcnTokens(semanticTheme)` | CSS 变量名到完整颜色值的对象，可用于运行时或局部主题 |

```ts
import { createShadcnTokens } from '@okramp/shadcn';

const tokens = createShadcnTokens(result.themes.light!);
for (const [name, value] of Object.entries(tokens)) {
  document.documentElement.style.setProperty(name, value);
}
```

内联变量会覆盖样式表；运行时切换需要更新对应变量。局部主题还需注意 Portal 的挂载位置。

## 变量范围与兼容性

覆盖 background、foreground、card、popover、primary、secondary、muted、accent、border、input、ring 和 sidebar。保留项目原有的 destructive、chart、radius 配置，适配器不推断错误色或类别色。

变量值是完整 CSS 颜色。旧项目中的 `hsl(var(--primary))` 应调整为 `var(--primary)`；Tailwind 配置中相同的 HSL 包装也需要同步调整。

## 许可证

MIT
