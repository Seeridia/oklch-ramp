import { describe, expect, it } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { contrastRatio, generateColorTheme } from '../src/index';
import { toTDesignTheme } from '../playground/src/adapters/tdesign';
import { createExport } from '../playground/src/export';
import { DEFAULTS, generate } from '../playground/src/model';

const require = createRequire(new URL('../playground/package.json', import.meta.url));
const officialCss = readFileSync(require.resolve('tdesign-react/dist/tdesign.css'), 'utf8');

describe('TDesign application adapter', () => {
  it('keeps everyday outlines quieter than enhanced core borders and info text readable', () => {
    for (const seed of ['#0052D9', '#7C3AED', '#D54941', '#ED7B2F', '#00A870', '#0099B8']) {
      const result = generateColorTheme(seed, { mode: 'both', contrastPolicy: 'adjust' });
      for (const mode of ['light', 'dark'] as const) {
        const theme = result.themes[mode]!;
        const tokens = toTDesignTheme(theme, result.scales.neutral);
        const surface = tokens['--td-bg-color-container']!;
        expect(contrastRatio(tokens['--td-component-border']!, surface)).toBeLessThan(
          contrastRatio(theme.color.border.strong, surface),
        );
        expect(contrastRatio(tokens['--td-component-stroke']!, surface)).toBeLessThan(
          contrastRatio(tokens['--td-component-border']!, surface),
        );
        expect(
          contrastRatio(tokens['--td-text-color-primary']!, tokens['--td-brand-color-focus']!),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(tokens['--td-text-color-secondary']!, tokens['--td-brand-color-focus']!),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('exports only variables present in the installed component library', () => {
    const theme = generateColorTheme('#0052D9', { mode: 'both', contrastPolicy: 'adjust' });
    for (const mode of ['light', 'dark'] as const) {
      for (const key of Object.keys(toTDesignTheme(theme.themes[mode]!, theme.scales.neutral))) {
        expect(officialCss.includes(`${key}:`), key).toBe(true);
      }
    }
  });
  it('preserves independent light/dark roles and leaves official status colors intact', () => {
    const theme = generateColorTheme('#7C3AED', { mode: 'both', contrastPolicy: 'adjust' });
    const light = toTDesignTheme(theme.themes.light!, theme.scales.neutral);
    const dark = toTDesignTheme(theme.themes.dark!, theme.scales.neutral);
    expect(light['--td-brand-color']).toBe(theme.themes.light!.color.brand.default);
    expect(dark['--td-brand-color']).toBe(theme.themes.dark!.color.brand.default);
    expect(light['--td-brand-color']).not.toBe(dark['--td-brand-color']);
    expect(Object.keys(light).some((key) => /success|warning|error/.test(key))).toBe(false);
  });
  it('exports exactly the semantic variables consumed by the live preview', () => {
    const result = generate(DEFAULTS);
    const json = JSON.parse(
      createExport(result, {
        target: 'tdesign',
        format: 'json',
        mode: 'both',
        colorFormat: 'hex',
        sections: ['semantic'],
      }),
    );
    const primitives = { ...json.tokens.brand, ...json.tokens.neutral, ...json.tokens.base };
    for (const mode of ['light', 'dark'] as const) {
      const resolved = Object.fromEntries(
        Object.entries(json.tokens[mode]).map(([key, value]) => {
          expect(value).toMatch(/^var\(--color-/);
          const primitive = String(value).slice(4, -1);
          expect(primitives[primitive], primitive).toBeDefined();
          return [key, primitives[primitive]];
        }),
      );
      expect(resolved).toEqual(
        toTDesignTheme(result.theme!.themes[mode]!, result.theme!.scales.neutral),
      );
    }
    expect(Object.keys(json.tokens.brand)).toHaveLength(10);
    expect(Object.keys(json.tokens.neutral)).toHaveLength(14);
    const css = createExport(result, {
      target: 'tdesign',
      format: 'css',
      mode: 'both',
      colorFormat: 'hex',
      sections: ['semantic'],
    });
    expect(css).toContain(':root[theme-mode="dark"]');
    expect(css).toContain(`--td-brand-color: ${json.tokens.dark['--td-brand-color']}`);
  });
  it('keeps raw scale settings explicit instead of silently increasing the theme stop count', () => {
    const result = generate({ ...DEFAULTS, steps: 3 });
    expect(result.scale.stops).toHaveLength(3);
    expect(result.theme).toBeUndefined();
    const json = JSON.parse(
      createExport(result, {
        target: 'generic',
        format: 'json',
        mode: 'both',
        colorFormat: 'hex',
        sections: ['brand'],
      }),
    );
    expect(Object.keys(json.tokens.brand)).toHaveLength(3);
    expect(json.tokens.light).toBeUndefined();
  });
  it('surfaces strict policy errors instead of exporting a partially generated theme', () => {
    expect(() =>
      generate({ ...DEFAULTS, contrastPolicy: 'strict', normalText: 21, nonText: 21 }),
    ).toThrow();
  });
});
