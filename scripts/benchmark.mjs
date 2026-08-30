import { performance } from 'node:perf_hooks';

import { generateColorTheme } from '../dist/index.mjs';

const seeds = ['#0052D9', '#E34D59', '#00A870', '#F2C94C', '#8B5CF6'];
const iterations = 1_000;
const startedAt = performance.now();
let lastResult;

for (let index = 0; index < iterations; index += 1) {
  lastResult = generateColorTheme(seeds[index % seeds.length], {
    contrastPolicy: 'adjust',
  });
}

const elapsedMs = performance.now() - startedAt;
const averageMs = elapsedMs / iterations;
if (lastResult?.scales.brand.colors.length !== 10) {
  throw new Error('Benchmark result was not consumed correctly.');
}
if (averageMs > 5) {
  throw new Error(`Average generation time ${averageMs.toFixed(3)}ms exceeded the 5ms budget.`);
}

console.log(
  JSON.stringify(
    {
      iterations,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      averageMs: Number(averageMs.toFixed(4)),
      budgetMs: 5,
    },
    null,
    2,
  ),
);
