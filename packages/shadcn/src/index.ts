import type { ColorThemeResult, SemanticTheme } from '@okramp/core';

/** Modern shadcn/ui full-color variables; not legacy HSL channel tuples. */
export function createShadcnTokens(theme: SemanticTheme): Record<string, string> {
  const { brand: b, background: bg, text: t, border } = theme.color;
  return {
    '--background': bg.page,
    '--foreground': t.primary,
    '--card': bg.container,
    '--card-foreground': t.primary,
    '--popover': bg.elevated,
    '--popover-foreground': t.primary,
    '--primary': b.default,
    '--primary-foreground': b.onBrand,
    '--secondary': bg.elevated,
    '--secondary-foreground': t.primary,
    '--muted': bg.disabled,
    '--muted-foreground': t.secondary,
    '--accent': b.subtle,
    '--accent-foreground': b.text,
    '--border': border.default,
    '--input': border.strong,
    '--ring': b.focusRing,
    '--sidebar': bg.container,
    '--sidebar-foreground': t.primary,
    '--sidebar-primary': b.default,
    '--sidebar-primary-foreground': b.onBrand,
    '--sidebar-accent': b.subtle,
    '--sidebar-accent-foreground': b.text,
    '--sidebar-border': border.subtle,
    '--sidebar-ring': b.focusRing,
  };
}

export function createShadcnCss(result: ColorThemeResult): string {
  const primitives: Record<string, string> = {
    '--okramp-white': '#ffffff',
    '--okramp-black': '#000000',
  };
  for (const [group, scale] of Object.entries(result.scales)) {
    for (const stop of scale.stops) primitives[`--okramp-${group}-${stop.label}`] = stop.color;
  }
  const byColor = new Map(Object.entries(primitives).map(([key, value]) => [value, key]));
  const block = (selector: string, tokens: Record<string, string>) =>
    `${selector} {\n${Object.entries(tokens)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')}\n}`;
  const blocks: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const theme = result.themes[mode];
    if (!theme) continue;
    const tokens = createShadcnTokens(theme);
    for (const [key, value] of Object.entries(tokens)) {
      let primitive = byColor.get(value);
      if (!primitive) {
        primitive = `--okramp-${mode}${key.slice(1)}`;
        primitives[primitive] = value;
        byColor.set(value, primitive);
      }
      tokens[key] = `var(${primitive})`;
    }
    blocks.push(block(mode === 'light' ? ':root' : '.dark', tokens));
  }
  return [block(':root', primitives), ...blocks].join('\n\n');
}
