import { describe, expect, it } from 'vite-plus/test';

import {
  ColorScaleError,
  contrastRatio,
  generateColorTheme,
  relativeLuminance,
} from '../../src/index.js';

describe('generateColorTheme', () => {
  it('generates independent light and dark semantic themes', () => {
    const result = generateColorTheme('#0052d9');
    const light = result.themes.light;
    const dark = result.themes.dark;

    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(light?.mode).toBe('light');
    expect(dark?.mode).toBe('dark');
    expect(relativeLuminance(light?.color.background.page ?? '#000')).toBeGreaterThan(
      relativeLuminance(dark?.color.background.page ?? '#fff'),
    );
    expect(light?.color.brand.default).not.toBe(dark?.color.brand.default);
    expect(result.scales.brand.colors).toHaveLength(10);
    expect(result.scales.neutral.colors).toHaveLength(14);
  });

  it('supports generating a single mode', () => {
    const result = generateColorTheme('#0052d9', { mode: 'dark' });
    expect(result.themes.light).toBeUndefined();
    expect(result.themes.dark).toBeDefined();
  });

  it('adjusts checked roles to the nearest passing palette color', () => {
    const result = generateColorTheme('#0052d9', {
      contrastPolicy: 'adjust',
    });
    expect(result.diagnostics.contrastChecks.every((check) => check.passes)).toBe(true);

    const light = result.themes.light;
    expect(light).toBeDefined();
    expect(
      contrastRatio(light?.color.border.strong ?? '#fff', light?.color.background.page ?? '#fff'),
    ).toBeGreaterThan(
      contrastRatio(light?.color.border.default ?? '#fff', light?.color.background.page ?? '#fff'),
    );
  });

  it('uses one output format for every semantic theme token', () => {
    const result = generateColorTheme('#0052d9', {
      scale: { output: 'oklch' },
      contrastPolicy: 'adjust',
    });
    const light = result.themes.light;
    expect(light).toBeDefined();

    const values = [
      ...Object.values(light?.color.brand ?? {}),
      ...Object.values(light?.color.background ?? {}),
      ...Object.values(light?.color.text ?? {}),
      ...Object.values(light?.color.border ?? {}),
    ];
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value.startsWith('oklch('))).toBe(true);
  });

  it('throws in strict mode when an impossible target is requested', () => {
    expect(() =>
      generateColorTheme('#0052d9', {
        contrastPolicy: 'strict',
        contrast: { normalText: 21, nonText: 21 },
      }),
    ).toThrowError(ColorScaleError);
  });

  it('validates runtime options used by JavaScript callers', () => {
    expect(() =>
      generateColorTheme('#0052d9', {
        mode: 'sepia' as 'light',
      }),
    ).toThrowError(ColorScaleError);
    expect(() =>
      generateColorTheme('#0052d9', {
        scale: { steps: 3 },
      }),
    ).toThrowError(ColorScaleError);
    expect(() =>
      generateColorTheme('#0052d9', {
        scale: { output: 'rgb' },
        neutral: { output: 'hex' },
      }),
    ).toThrowError(ColorScaleError);
  });
});
