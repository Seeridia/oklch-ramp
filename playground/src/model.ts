import {
  generateColorScale,
  generateColorTheme,
  generateNeutralScale,
  type ScaleStrategy,
  type ContrastPolicy,
} from 'okramp';
import { converter, formatHex, formatRgb } from 'culori';

export type DisplayFormat = 'hex' | 'rgb' | 'oklch';
export interface Settings {
  endpoints: 'curve' | 'black-white';
  seed: string;
  strategy: ScaleStrategy;
  steps: number;
  anchorIndex: number;
  neutralSteps: 10 | 14;
  hueShift: number;
  tintStrength: number;
  contrastPolicy: ContrastPolicy;
  normalText: number;
  nonText: number;
}
export const DEFAULTS: Settings = {
  endpoints: 'curve',
  seed: '#0052D9',
  strategy: 'tonal',
  steps: 10,
  anchorIndex: 5,
  neutralSteps: 14,
  hueShift: 0,
  tintStrength: 0.025,
  contrastPolicy: 'adjust',
  normalText: 4.5,
  nonText: 3,
};
export const PRESETS = ['#0052D9', '#7C3AED', '#D54941', '#ED7B2F', '#00A870', '#0099B8'];
export const STRATEGIES = [
  { value: 'tonal', label: '均匀色阶', description: '重建均匀明度曲线，适合探索新主题。' },
  {
    value: 'adaptive-anchor',
    label: '保留主色 · 自动定位',
    description: '保留输入色，按明度自动选择阶位。',
  },
  {
    value: 'fixed-anchor',
    label: '保留主色 · 固定阶位',
    description: '将输入色固定在指定阶位，适合品牌规范。',
  },
] as const;
export function scaleOptions(settings: Settings) {
  return {
    endpoints: settings.endpoints,
    steps: settings.steps,
    strategy: settings.strategy,
    hueShift: settings.hueShift,
    ...(settings.strategy === 'fixed-anchor' ? { anchorIndex: settings.anchorIndex } : {}),
  };
}
export function generate(settings: Settings) {
  const scale = generateColorScale(settings.seed, scaleOptions(settings));
  const neutral = generateNeutralScale(settings.seed, {
    steps: settings.neutralSteps,
    tintStrength: settings.tintStrength,
  });
  // Raw scales may have 3–20 stops; theme generation deliberately uses at least 10.
  const theme =
    settings.steps < 10
      ? undefined
      : generateColorTheme(settings.seed, {
          mode: 'both',
          scale: scaleOptions(settings),
          neutral: { steps: settings.neutralSteps, tintStrength: settings.tintStrength },
          contrastPolicy: settings.contrastPolicy,
          contrast: { normalText: settings.normalText, nonText: settings.nonText },
        });
  return { scale, neutral, theme, settings: { ...settings } };
}
export type Generated = ReturnType<typeof generate>;
export function displayColor(color: string, format: DisplayFormat) {
  if (format === 'rgb') return formatRgb(color) ?? color;
  if (format === 'oklch') {
    const value = converter('oklch')(color);
    return value
      ? `oklch(${value.l.toFixed(4)} ${value.c.toFixed(4)} ${(value.h ?? 0).toFixed(2)})`
      : color;
  }
  return formatHex(color) ?? color;
}

export function generateComparison(settings: Settings) {
  const comparisonSettings = {
    ...DEFAULTS,
    seed: settings.seed,
    strategy: settings.strategy,
    anchorIndex: Math.max(0, Math.min(settings.anchorIndex, 9)),
    steps: 10,
  };
  return {
    settings: comparisonSettings,
    scale: generateColorScale(comparisonSettings.seed, scaleOptions(comparisonSettings)),
  };
}
