# @okramp/antd

[![npm version](https://img.shields.io/npm/v/%40okramp%2Fantd?color=0052D9)](https://www.npmjs.com/package/@okramp/antd)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Seeridia/okramp/blob/main/LICENSE)

为 Ant Design 5/6 生成显式颜色 Token 和 `ConfigProvider` 主题配置。

[在线指南](https://okramp.seeridia.top/?page=guide&guideDoc=integrations/antd) · [源码](https://github.com/Seeridia/okramp/tree/main/packages/antd)

## 安装

```sh
npm install @okramp/core @okramp/antd antd
```

## 快速开始

```tsx
import { generateColorTheme } from '@okramp/core';
import { createAntdTheme } from '@okramp/antd';
import { Button, ConfigProvider } from 'antd';

const colors = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});

export default function App() {
  return (
    <ConfigProvider theme={createAntdTheme(colors, 'light')}>
      <Button type="primary">OKRamp</Button>
    </ConfigProvider>
  );
}
```

## 明暗切换与自定义

```ts
const base = createAntdTheme(colors, isDark ? 'dark' : 'light');
const config = {
  ...base,
  token: { ...base.token, borderRadius: 6 },
};
```

将更新后的配置传入 `ConfigProvider`。适配器返回 `algorithm: false`；不要叠加 `defaultAlgorithm` 或 `darkAlgorithm`，以免重新计算并覆盖显式颜色。

## API

| 函数 | 返回值 |
| --- | --- |
| `createAntdTheme(result, mode = 'light')` | `{ algorithm: false, token }`，请求未生成的模式时抛出错误 |
| `createAntdTokens(semanticTheme)` | 颜色别名到颜色值的对象 |

直接使用 `createAntdTokens` 时，也应将 `algorithm` 设置为 `false`。

## 适配范围

覆盖 primary、info、链接、文字、背景、边框、填充和选中态颜色。成功、警告、错误色以及排版、尺寸和动效沿用 Ant Design 默认值；可通过 `token` 或 `components` 添加业务覆盖。

静态 `message`、`Modal` 等方法可能无法消费当前 `ConfigProvider` 上下文，可使用 Ant Design `App` 提供的上下文方法。自定义覆盖后应检查实际界面的文字、背景与交互状态对比度。

## 许可证

MIT
