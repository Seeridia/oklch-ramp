export { chooseContrastingForeground, contrastRatio, relativeLuminance } from './color/contrast.js';
export { ColorScaleError } from './diagnostics/error.js';
export { generateColorScale } from './scale/generate.js';
export { generateNeutralScale } from './scale/neutral.js';
export { generateColorTheme } from './theme/generate.js';

export type {
  BrandSemanticColors,
  ColorInput,
  ColorOutputFormat,
  ColorScaleErrorCode,
  ColorScaleOptions,
  ColorScaleResult,
  ColorStop,
  ColorThemeOptions,
  ColorThemeResult,
  ContrastCheck,
  ContrastPolicy,
  ContrastTargets,
  DiagnosticCode,
  DiagnosticMessage,
  Diagnostics,
  NeutralScaleOptions,
  NormalizedSeed,
  OklchValue,
  ScaleStrategy,
  SemanticTheme,
  ThemeMode,
} from './types.js';
