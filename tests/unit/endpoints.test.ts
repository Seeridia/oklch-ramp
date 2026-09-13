import { expect, it } from 'vite-plus/test';
import { generateColorScale, generateColorTheme } from '../../src/index.js';

it('preserves existing defaults in curve mode', () => {
  expect(generateColorScale('#0052d9', { endpoints: 'curve' })).toEqual(
    generateColorScale('#0052d9'),
  );
});

it.each(['tonal', 'adaptive-anchor', 'fixed-anchor'] as const)(
  'generates black and white endpoints for %s',
  (strategy) => {
    for (const steps of [3, 10, 20]) {
      const result = generateColorScale('#0052d9', { strategy, steps, endpoints: 'black-white' });
      expect(result.colors[0]).toBe('#ffffff');
      expect(result.colors.at(-1)).toBe('#000000');
      expect(result.stops[0]!.oklch.c).toBe(0);
      expect(result.stops.at(-1)!.oklch.c).toBe(0);
      for (let i = 1; i < steps; i++) {
        expect(result.stops[i]!.oklch.l).toBeLessThan(result.stops[i - 1]!.oklch.l);
      }
      if (result.anchorIndex !== null) expect(result.colors[result.anchorIndex]).toBe('#0052d9');
    }
  },
);

it('normalizes custom curves without mutating them', () => {
  const lightnessCurve = [0.9, 0.6, 0.3];
  const chromaCurve = [0.1, 1, 0.5];
  const result = generateColorScale('#0052d9', {
    steps: 3,
    endpoints: 'black-white',
    lightnessCurve,
    chromaCurve,
  });
  expect(result.stops[0]!.oklch.l).toBe(1);
  expect(result.stops[1]!.oklch.l).toBeCloseTo(0.5, 5);
  expect(result.stops[2]!.oklch.l).toBe(0);
  expect(lightnessCurve).toEqual([0.9, 0.6, 0.3]);
  expect(chromaCurve).toEqual([0.1, 1, 0.5]);
});

it('rejects fixed anchors at either endpoint', () => {
  for (const anchorIndex of [0, 9]) {
    expect(() =>
      generateColorScale('#0052d9', {
        strategy: 'fixed-anchor',
        endpoints: 'black-white',
        anchorIndex,
      }),
    ).toThrow(/interior/);
  }
});

it('passes endpoint options through theme generation', () => {
  const result = generateColorTheme('#0052d9', { scale: { endpoints: 'black-white' } });
  expect(result.scales.brand.colors[0]).toBe('#ffffff');
  expect(result.scales.brand.colors.at(-1)).toBe('#000000');
});
