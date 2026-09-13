import type { ColorScaleResult, ColorThemeResult, SemanticTheme } from '@okramp/core';

// Independent TDesign adapter. The framework-agnostic core never imports TDesign.
export const TOKEN_MAP = [
  ['品牌主色', 'brand.default', '--td-brand-color'],
  ['品牌悬停', 'brand.hover', '--td-brand-color-hover'],
  ['品牌按下', 'brand.active', '--td-brand-color-active'],
  ['品牌禁用', 'brand.disabled', '--td-brand-color-disabled'],
  ['品牌浅色背景', 'brand.subtle', '--td-brand-color-light'],
  ['品牌浅色悬停', 'brand.subtleHover', '--td-brand-color-light-hover'],
  ['品牌文字', 'brand.text', '--td-text-color-brand'],
  ['品牌焦点浅底', 'brand.subtle', '--td-brand-color-focus'],
  ['品牌上的文字', 'brand.onBrand', '--td-text-color-anti'],
  ['页面背景', 'background.page', '--td-bg-color-page'],
  ['容器背景', 'background.container', '--td-bg-color-container'],
  ['容器悬停背景', 'background.elevated', '--td-bg-color-container-hover'],
  ['禁用背景', 'background.disabled', '--td-bg-color-component-disabled'],
  ['一级文字', 'text.primary', '--td-text-color-primary'],
  ['二级文字', 'text.secondary', '--td-text-color-secondary'],
  ['占位文字', 'text.placeholder', '--td-text-color-placeholder'],
  ['禁用文字', 'text.disabled', '--td-text-color-disabled'],
  ['默认边框', 'border.default', '--td-border-level-1-color'],
  ['弱边框', 'border.subtle', '--td-component-stroke'],
  ['强边框', 'border.strong', '--td-border-level-2-color'],
] as const;
export function semanticValue(theme: SemanticTheme, path: string): string {
  const [group, name] = path.split('.');
  const values = theme.color[group as keyof typeof theme.color] as unknown as
    | Record<string, string>
    | undefined;
  const value = name ? values?.[name] : undefined;
  if (value === undefined) throw new Error(`Unknown semantic color: ${path}`);
  return value;
}
export function toTDesignTheme(
  theme: SemanticTheme,
  neutral: ColorScaleResult,
): Record<string, string> {
  const tokens: Record<string, string> = Object.fromEntries(
    TOKEN_MAP.map(([, path, token]) => [token, semanticValue(theme, path)]),
  );
  // Surface roles are mapped independently for each mode, never by reversing a palette.
  Object.assign(tokens, {
    '--td-bg-color-container-active': theme.color.background.elevated,
    '--td-bg-color-container-select': theme.color.brand.subtle,
    '--td-bg-color-secondarycontainer': theme.color.background.page,
    '--td-bg-color-secondarycontainer-hover': theme.color.background.elevated,
    '--td-bg-color-secondarycontainer-active': theme.color.background.disabled,
    '--td-bg-color-component': theme.color.background.disabled,
    '--td-bg-color-component-hover': theme.color.background.elevated,
    '--td-bg-color-component-active': theme.color.background.disabled,
    '--td-bg-color-specialcomponent': theme.color.background.elevated,
    '--td-text-color-link': theme.color.text.link,
  });
  if (neutral) {
    // Match TDesign 1.18.3's neutral-role hierarchy. The generated OKLCH ramp has
    // darker endpoints than TDesign gray, so dark roles use the nearest visual level.
    const n = (index: number) =>
      neutral.stops[Math.round(((index - 1) / 13) * (neutral.stops.length - 1))]!.color;
    const dark = theme.mode === 'dark';
    Object.assign(tokens, {
      '--td-bg-color-page': n(dark ? 13 : 2),
      '--td-bg-color-container': dark ? n(12) : '#ffffff',
      '--td-bg-color-container-hover': n(dark ? 11 : 1),
      '--td-bg-color-container-active': n(dark ? 10 : 3),
      '--td-bg-color-container-select': dark ? n(9) : '#ffffff',
      '--td-bg-color-secondarycontainer': n(dark ? 11 : 1),
      '--td-bg-color-secondarycontainer-hover': n(dark ? 10 : 2),
      '--td-bg-color-secondarycontainer-active': n(dark ? 9 : 4),
      '--td-bg-color-component': n(dark ? 11 : 3),
      '--td-bg-color-component-hover': n(dark ? 10 : 4),
      '--td-bg-color-component-active': n(dark ? 9 : 6),
      '--td-bg-color-component-disabled': n(dark ? 11 : 2),
      '--td-bg-color-specialcomponent': dark ? n(12) : '#ffffff',
      '--td-border-level-1-color': n(dark ? 11 : 3),
      '--td-component-stroke': n(dark ? 11 : 3),
      '--td-border-level-2-color': n(dark ? 10 : 4),
      '--td-component-border': n(dark ? 10 : 4),
    });
  }
  return tokens;
}
export function mappedThemes(result: ColorThemeResult) {
  return {
    light: result.themes.light ? toTDesignTheme(result.themes.light, result.scales.neutral) : {},
    dark: result.themes.dark ? toTDesignTheme(result.themes.dark, result.scales.neutral) : {},
  };
}

/** Generate CSS with semantic tokens referencing palette primitives. */
export function createTDesignCss(result: ColorThemeResult): string {
  const primitives: Record<string, string> = {
    '--color-white': '#ffffff',
    '--color-black': '#000000',
  };
  for (const [group, scale] of Object.entries(result.scales)) {
    for (const stop of scale.stops) primitives[`--color-${group}-${stop.label}`] = stop.color;
  }
  const sources = new Map(Object.entries(primitives).map(([name, color]) => [color, name]));
  const blocks: string[] = [];
  const block = (selector: string, tokens: Record<string, string>) =>
    `${selector} {\n${Object.entries(tokens)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join('\n')}\n}`;
  for (const mode of ['light', 'dark'] as const) {
    const theme = result.themes[mode];
    if (!theme) continue;
    const tokens = toTDesignTheme(theme, result.scales.neutral);
    for (const [name, color] of Object.entries(tokens)) {
      let source = sources.get(color);
      if (!source) {
        source = `--color-adjusted-${mode}-${name.replace(/^--td-/, '')}`;
        primitives[source] = color;
        sources.set(color, source);
      }
      tokens[name] = `var(${source})`;
    }
    blocks.push(
      block(
        mode === 'light' ? ':root, :root[theme-mode="light"]' : ':root[theme-mode="dark"]',
        tokens,
      ),
    );
  }
  return [block(':root', primitives), ...blocks].join('\n\n');
}

export { mappedThemes as createTDesignTokens };
