import { describe, expect, it } from 'vite-plus/test';

import { ColorScaleError, generateColorScale, generateNeutralScale } from '../../src/index.js';

function expectDescendingLightness(values: readonly { oklch: { l: number } }[]) {
  for (let index = 1; index < values.length; index += 1) {
    expect(values[index]?.oklch.l).toBeLessThan(values[index - 1]?.oklch.l ?? 0);
  }
}

describe('generateColorScale', () => {
  it('uses tonal as the default and generates ten sRGB stops', () => {
    const result = generateColorScale('#0052D9');

    expect(result.strategy).toBe('tonal');
    expect(result.anchorIndex).toBeNull();
    expect(result.colors).toHaveLength(10);
    expect(result.colors.every((color) => /^#[0-9a-f]{6}$/u.test(color))).toBe(true);
    expect(result.stops.every((stop) => stop.inGamut)).toBe(true);
    expectDescendingLightness(result.stops);
  });

  it('keeps a reviewed baseline for the primary example', () => {
    expect(generateColorScale('#0052D9').colors).toEqual([
      '#f0f5ff',
      '#dce9ff',
      '#bdd5ff',
      '#94bbff',
      '#659cff',
      '#327aff',
      '#155dde',
      '#0244b4',
      '#002e84',
      '#001b54',
    ]);
  });

  it('keeps the normalized seed at the fixed anchor', () => {
    const result = generateColorScale('#0052D9', {
      strategy: 'fixed-anchor',
      anchorIndex: 5,
    });

    expect(result.anchorIndex).toBe(5);
    expect(result.stops[5]?.color).toBe(result.seed.normalized);
    expect(result.stops[5]?.source).toBe('seed');
    expectDescendingLightness(result.stops);
  });

  it('moves a very light seed toward the light end in adaptive mode', () => {
    const result = generateColorScale('#eaf6ff', {
      strategy: 'adaptive-anchor',
    });

    expect(result.anchorIndex).not.toBeNull();
    expect(result.anchorIndex ?? 10).toBeLessThan(5);
    expect(result.stops[result.anchorIndex ?? -1]?.color).toBe(result.seed.normalized);
    expect(result.diagnostics.messages).toContainEqual(
      expect.objectContaining({ code: 'ANCHOR_MOVED' }),
    );
  });

  it('reconstructs a complete tonal scale from an extremely light seed', () => {
    const result = generateColorScale('#f4f8ff', { strategy: 'tonal' });

    expect(result.stops[0]?.oklch.l).toBeGreaterThan(0.95);
    expect(result.stops.at(-1)?.oklch.l).toBeLessThan(0.3);
    expect(result.diagnostics.messages).toContainEqual(
      expect.objectContaining({ code: 'SEED_TOO_LIGHT' }),
    );
  });

  it('supports RGB and OKLCH output formats', () => {
    expect(generateColorScale('#0052d9', { output: 'rgb' }).colors[0]).toMatch(/^rgb\(/u);
    expect(generateColorScale('#0052d9', { output: 'oklch' }).colors[0]).toMatch(/^oklch\(/u);
  });

  it('validates option combinations and custom curves', () => {
    expect(() =>
      generateColorScale('#0052d9', {
        strategy: 'tonal',
        anchorIndex: 5,
      }),
    ).toThrowError(ColorScaleError);
    expect(() =>
      generateColorScale('#0052d9', {
        lightnessCurve: [0.9, 0.8],
      }),
    ).toThrowError(ColorScaleError);
    expect(() =>
      generateNeutralScale('#0052d9', {
        steps: 12 as 10,
      }),
    ).toThrowError(ColorScaleError);
  });
});

describe('generateNeutralScale', () => {
  it.each([10, 14] as const)('generates a %i-stop tinted neutral scale', (steps) => {
    const result = generateNeutralScale('#0052d9', { steps });

    expect(result.colors).toHaveLength(steps);
    expect(Math.max(...result.stops.map((stop) => stop.oklch.c))).toBeLessThanOrEqual(0.025_001);
    expectDescendingLightness(result.stops);
  });

  it('falls back safely for an achromatic seed', () => {
    const result = generateNeutralScale('#777777');
    expect(result.colors).toHaveLength(14);
    expect(result.diagnostics.messages).toContainEqual(
      expect.objectContaining({ code: 'SEED_LOW_CHROMA' }),
    );
  });
});
