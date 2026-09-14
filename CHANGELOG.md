# Changelog

## 0.4.0

- docs: reorganize guides and refresh open source documentation ([315a17d](https://github.com/Seeridia/okramp/commit/315a17d2c17f706547ed0a9ac266b79fcfce43f3))
- chore: format documentation sources for Vite+ checks ([c431e97](https://github.com/Seeridia/okramp/commit/c431e976a0ffb533a043c4da9dc54a8f4d6f5e97))
- style: increase TDesign border radius tokens ([d5ba6e4](https://github.com/Seeridia/okramp/commit/d5ba6e4750f1e8f863095ebfc4a8a38d9f2e347f))
- feat: add OKRamp brand logo ([89924c2](https://github.com/Seeridia/okramp/commit/89924c2714fb12ea6f31180552989257043249fa))
- refactor: move branding into full-width header ([32cc7c0](https://github.com/Seeridia/okramp/commit/32cc7c063a65ae317b9ce5ad3fcc7bb691f82b1f))
- style: simplify header brand spacing ([05f4779](https://github.com/Seeridia/okramp/commit/05f477915c3e7c9eb341986e3f0db4f4f7ecd6da))
- feat: update OKRamp brand assets ([bf739a6](https://github.com/Seeridia/okramp/commit/bf739a6ddb15673aefc7326742a4d7f66228a42f))

## 0.3.0

- feat: migrate to okramp and extract TDesign adapter ([dc59b25](https://github.com/Seeridia/okramp/commit/dc59b257f4176e2fb40a02b4f4c6c2138c6f304d))
- docs: update npm publication status and format workspace manifest ([a5acc2b](https://github.com/Seeridia/okramp/commit/a5acc2b2f9417c82ada31088ed21d12b007216e3))
- docs: confirm TDesign adapter npm publication ([9425085](https://github.com/Seeridia/okramp/commit/94250852a4961ff9b7347075b6011f163e21ad8c))
- fix: resolve adapter and demo type checks ([37c5856](https://github.com/Seeridia/okramp/commit/37c5856b1528d82f6ad8f5fea18f998df8d1744f))
- feat: migrate packages to the okramp npm scope ([f0c8cec](https://github.com/Seeridia/okramp/commit/f0c8cec20b232e7df965db1c46b594a24619f6bc))
- feat: add Ant Design and shadcn theme adapters ([9052744](https://github.com/Seeridia/okramp/commit/90527442558700d6d8c51292eb843537771c67b2))

## 0.2.1

- ci: automate version PRs and publish npm after merge ([261398d](https://github.com/Seeridia/okramp/commit/261398d4b4644a25d25e37e8433801afaed6eb61))

## 0.2.0

- 新增品牌色阶 `endpoints: 'curve' | 'black-white'`，默认保留曲线端点，支持纯黑白端点及主题 API 透传；
- 中性色相邻色差诊断降为信息提示，品牌色差及重复颜色保留警告，增加具体阶位、色差和来源信息；
- 修复诊断合并时不同色阶来源被去重的问题；
- 重构演示站方案对比，加入 TDesign、Ant Design、HSL、sRGB、CIELAB 生成结果；
- 优化 TDesign 主题适配、色彩详情、参数布局、URL 状态和使用指南，移除方案保存功能。

## 0.1.0

- 实现 OKLCH 品牌色阶引擎；
- 支持 fixed-anchor、adaptive-anchor、tonal；
- 支持 10/14 阶品牌关联中性色；
- 支持浅色和深色语义主题；
- 支持 sRGB 色域映射、WCAG 对比度和结构化诊断；
- 正确处理半透明前景的对比度合成，并拒绝缺少底层颜色的半透明背景；
- 保证主题输出格式一致、最低语义色阶数量和边框强弱顺序；
- 增加覆盖率门槛与可重复的性能基准；
- 使用 VitePlus 完成检查、测试和 ESM 库构建。
