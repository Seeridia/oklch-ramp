import { describe, it, expect } from 'vite-plus/test';
import { generateColorTheme, contrastRatio } from '../src/index';
import { createAntdTheme } from '../packages/antd/src/index';
import { createShadcnCss, createShadcnTokens } from '../packages/shadcn/src/index';

describe('framework adapters', () => {
  const result = generateColorTheme('#0052D9', { mode: 'both', contrastPolicy: 'adjust' });
  it('uses independent dark surfaces and explicit Ant Design brand states', () => {
    const light = createAntdTheme(result);
    const dark = createAntdTheme(result, 'dark');
    expect(light.algorithm).toBe(false);
    expect(light.token.colorPrimaryHover).toBe(result.themes.light!.color.brand.hover);
    expect(dark.token.colorBgContainer).not.toBe(light.token.colorBgContainer);
    expect(dark.token).not.toHaveProperty('colorError');
    expect(() =>
      createAntdTheme(generateColorTheme('#0052D9', { mode: 'light' }), 'dark'),
    ).toThrow();
  });
  it('keeps shadcn foreground pairs and every CSS reference resolvable', () => {
    const tokens = createShadcnTokens(result.themes.light!);
    expect(
      contrastRatio(tokens['--primary-foreground']!, tokens['--primary']!),
    ).toBeGreaterThanOrEqual(4.5);
    const css = createShadcnCss(result);
    expect(css).toContain('.dark {');
    for (const match of css.matchAll(/var\((--[^)]+)\)/g)) expect(css).toContain(`${match[1]}:`);
    expect(css).not.toContain('--destructive:');
  });
});
