# @okramp/antd

Ant Design 5/6 颜色适配，返回 ConfigProvider 的 theme 配置。安装：`npm install @okramp/core @okramp/antd`。

```ts
import { generateColorTheme } from '@okramp/core';
import { createAntdTheme } from '@okramp/antd';
const result = generateColorTheme('#0052D9', { mode: 'both', contrastPolicy: 'adjust' });
const theme = createAntdTheme(result, 'dark');
// <ConfigProvider theme={theme}><App /></ConfigProvider>
```

`createAntdTheme(result, mode = 'light')` 返回 `{ algorithm: false, token }`；缺失所选模式时抛出错误。
`createAntdTokens(semanticTheme)` 返回显式品牌、背景、文字、边框、填充和选中态颜色映射。
请勿额外叠加 defaultAlgorithm 或 darkAlgorithm，以免重新生成颜色。
状态色、排版、尺寸、动效沿用 Ant Design 默认值。不会声称覆盖全部组件专属 Token。
