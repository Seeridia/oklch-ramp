import { describe, expect, it } from 'vite-plus/test';

import {
  ColorScaleError,
  chooseContrastingForeground,
  contrastRatio,
  generateColorScale,
  relativeLuminance,
} from '../../src/index.js';

describe('color utilities', () => {
  it('calculates the WCAG black/white contrast ratio', () => {
    expect(relativeLuminance('#000')).toBe(0);
    expect(relativeLuminance('#fff')).toBe(1);
    expect(contrastRatio('#000', '#fff')).toBe(21);
  });

  it('chooses the stronger black or white foreground', () => {
    expect(chooseContrastingForeground('#0052d9')).toBe('#ffffff');
    expect(chooseContrastingForeground('#ffd700')).toBe('#000000');
  });

  it('composites translucent foregrounds before calculating contrast', () => {
    expect(contrastRatio('rgb(0 0 0 / 0%)', '#ffffff')).toBe(1);
    expect(contrastRatio('rgb(0 0 0 / 50%)', '#ffffff')).toBeCloseTo(3.98, 1);
  });

  it('rejects luminance and contrast calculations with an unknown backdrop', () => {
    expect(() => relativeLuminance('transparent')).toThrowError(ColorScaleError);
    expect(() => contrastRatio('#000000', 'rgb(255 255 255 / 50%)')).toThrowError(ColorScaleError);
  });

  it('rejects invalid color input with a stable error code', () => {
    expect(() => generateColorScale('definitely-not-a-color')).toThrowError(ColorScaleError);

    try {
      generateColorScale('definitely-not-a-color');
    } catch (error) {
      expect(error).toBeInstanceOf(ColorScaleError);
      expect((error as ColorScaleError).code).toBe('INVALID_COLOR');
    }
  });

  it('reports that alpha is ignored', () => {
    const result = generateColorScale('rgb(0 82 217 / 40%)');
    expect(result.diagnostics.messages).toContainEqual(
      expect.objectContaining({ code: 'ALPHA_IGNORED' }),
    );
  });
});
