import { createAntdTheme } from '@okramp/antd';
import { createShadcnTokens, createShadcnCss } from '@okramp/shadcn';
import type { Generated, DisplayFormat } from './model';
import { displayColor } from './model';
import { toTDesignTheme } from './adapters/tdesign';
export type ExportFormat = 'css' | 'json' | 'typescript';
export type ExportTarget = 'generic' | 'tdesign' | 'antd' | 'shadcn';
export type ExportMode = 'light' | 'dark' | 'both';
export interface ExportOptions {
  format: ExportFormat;
  target: ExportTarget;
  mode: ExportMode;
  colorFormat: DisplayFormat;
  sections: string[];
}
export function createExport(result: Generated, options: ExportOptions) {
  const fmt = (value: string) => displayColor(value, options.colorFormat);
  const selectedModes = options.mode === 'both' ? (['light', 'dark'] as const) : [options.mode];
  if (options.target === 'antd' || options.target === 'shadcn') {
    if (!result.theme) return '';
    const theme = {
      ...result.theme,
      themes: Object.fromEntries(
        selectedModes.flatMap((mode) => {
          const value = result.theme?.themes[mode];
          return value ? [[mode, value]] : [];
        }),
      ),
    };
    if (options.target === 'shadcn' && options.format === 'css') return createShadcnCss(theme);
    const configs = Object.fromEntries(
      selectedModes.map((mode) => [
        mode,
        options.target === 'antd'
          ? createAntdTheme(theme, mode)
          : createShadcnTokens(theme.themes[mode]!),
      ]),
    );
    const json = JSON.stringify(configs, null, 2);
    return options.format === 'json' ? json : `export const themes = ${json};\n`;
  }
  const data: Record<string, Record<string, string>> = {};
  if (options.sections.includes('brand'))
    data.brand = Object.fromEntries(
      result.scale.stops.map((s) => [`--color-brand-${s.label}`, fmt(s.color)]),
    );
  if (options.sections.includes('neutral'))
    data.neutral = Object.fromEntries(
      result.neutral.stops.map((s) => [`--color-neutral-${s.label}`, fmt(s.color)]),
    );
  if (options.sections.includes('semantic') && result.theme) {
    for (const mode of selectedModes) {
      const theme = result.theme.themes[mode];
      if (!theme) continue;
      const values =
        options.target === 'tdesign'
          ? toTDesignTheme(theme, result.theme.scales.neutral)
          : Object.fromEntries(
              Object.entries(theme.color).flatMap(([group, values]) =>
                Object.entries(values).map(([key, value]) => [
                  `--color-${group}-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
                  value,
                ]),
              ),
            );
      data[mode] = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, fmt(value)]),
      );
    }
  }
  // Preserve the dependency graph: base palettes -> semantic references.
  // Adjusted colors get explicit, named primitives instead of a nearest-color guess.
  if (options.target === 'tdesign' && options.sections.includes('semantic') && result.theme) {
    data.brand = Object.fromEntries(
      result.theme.scales.brand.stops.map((s) => [`--color-brand-${s.label}`, fmt(s.color)]),
    );
    data.neutral = Object.fromEntries(
      result.theme.scales.neutral.stops.map((s) => [`--color-neutral-${s.label}`, fmt(s.color)]),
    );
    data.base = { '--color-white': fmt('#ffffff'), '--color-black': fmt('#000000') };
    const primitiveByColor = new Map(
      Object.entries({ ...data.base, ...data.neutral, ...data.brand }).map(([key, value]) => [
        value,
        key,
      ]),
    );
    for (const mode of selectedModes) {
      if (!data[mode]) continue;
      for (const [token, value] of Object.entries(data[mode])) {
        let primitive = primitiveByColor.get(value);
        if (!primitive) {
          primitive = `--color-adjusted-${mode}-${token.replace(/^--td-/, '')}`;
          data.base[primitive] = value;
          primitiveByColor.set(value, primitive);
        }
        data[mode][token] = `var(${primitive})`;
      }
    }
  }
  if (options.format !== 'css') {
    const json = JSON.stringify(
      { seed: result.settings.seed, settings: result.settings, tokens: data },
      null,
      2,
    );
    return options.format === 'json' ? json : `export const colorTheme = ${json} as const;\n`;
  }
  const block = (selector: string, values: Record<string, string>) =>
    `${selector} {\n${Object.entries(values)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')}\n}`;
  const blocks = [];
  if (data.brand || data.neutral || data.base)
    blocks.push(block(':root', { ...data.brand, ...data.neutral, ...data.base }));
  if (data.light)
    blocks.push(
      block(options.mode === 'light' ? ':root' : ':root, :root[theme-mode="light"]', data.light),
    );
  if (data.dark) blocks.push(block(':root[theme-mode="dark"]', data.dark));
  return `/* OKRamp · ${result.settings.seed}\n * Load after tdesign-react/dist/tdesign.css.\n * Dark mode: set theme-mode="dark" on document.documentElement.\n * Success, warning and error colors retain TDesign defaults.\n */\n\n${blocks.join('\n\n')}\n`;
}
