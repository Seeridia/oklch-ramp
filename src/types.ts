export type ColorInput = string;

export type ColorOutputFormat = 'hex' | 'rgb' | 'oklch';

export type ScaleStrategy = 'fixed-anchor' | 'adaptive-anchor' | 'tonal';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export type DiagnosticCode =
  | 'ALPHA_IGNORED'
  | 'SEED_TOO_LIGHT'
  | 'SEED_TOO_DARK'
  | 'SEED_LOW_CHROMA'
  | 'SEED_OUT_OF_GAMUT'
  | 'GAMUT_MAPPED'
  | 'DUPLICATE_STOPS'
  | 'LOW_ADJACENT_DIFFERENCE'
  | 'CONTRAST_TARGET_UNMET'
  | 'ANCHOR_MOVED';

export type ColorScaleErrorCode = 'INVALID_COLOR' | 'INVALID_OPTIONS' | 'CONTRAST_TARGET_UNMET';

export interface OklchValue {
  l: number;
  c: number;
  h: number | null;
}

export interface DiagnosticMessage {
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  message: string;
  stopIndexes?: number[];
  details?: Record<string, unknown>;
}

export interface ContrastCheck {
  foregroundRole: string;
  backgroundRole: string;
  ratio: number;
  target: number;
  passes: boolean;
}

export interface Diagnostics {
  valid: boolean;
  messages: DiagnosticMessage[];
  contrastChecks: ContrastCheck[];
}

export interface ColorScaleOptions {
  /** Number of stops. The stable v1 preset is 10; 3–20 are accepted. */
  steps?: number;
  /** Defaults to tonal. */
  strategy?: ScaleStrategy;
  /** Zero-based and only valid for fixed-anchor. Defaults to index 5. */
  anchorIndex?: number;
  /** Defaults to hex. */
  output?: ColorOutputFormat;
  /** The v1 implementation keeps L/H and reduces OKLCH chroma. */
  gamutMapping?: 'chroma-reduction';
  /** Add the same hue shift to all stops, or provide one value per stop. */
  hueShift?: number | readonly number[];
  /** Strictly descending OKLCH lightness values, one per stop. */
  lightnessCurve?: readonly number[];
  /** Non-negative seed-chroma multipliers, one per stop. */
  chromaCurve?: readonly number[];
}

export interface ColorStop {
  index: number;
  label: string;
  color: string;
  oklch: OklchValue;
  inGamut: boolean;
  source: 'seed' | 'generated' | 'gamut-mapped';
}

export interface NormalizedSeed {
  input: string;
  normalized: string;
  oklch: OklchValue;
}

export interface ColorScaleResult {
  seed: NormalizedSeed;
  strategy: ScaleStrategy;
  /** Exact seed position for anchored strategies; null for tonal. */
  anchorIndex: number | null;
  /** The most representative usable brand stop. */
  recommendedIndex: number;
  colors: string[];
  stops: ColorStop[];
  diagnostics: Diagnostics;
}

export interface NeutralScaleOptions {
  steps?: 10 | 14;
  /** Maximum neutral OKLCH chroma. Defaults to 0.025; maximum 0.08. */
  tintStrength?: number;
  hue?: 'seed' | number;
  lightnessCurve?: readonly number[];
  output?: ColorOutputFormat;
  gamutMapping?: 'chroma-reduction';
}

export type ThemeMode = 'light' | 'dark' | 'both';

export type ContrastPolicy = 'report' | 'adjust' | 'strict';

export interface ContrastTargets {
  normalText?: number;
  nonText?: number;
}

export interface ColorThemeOptions {
  mode?: ThemeMode;
  scale?: ColorScaleOptions;
  neutral?: NeutralScaleOptions;
  contrast?: ContrastTargets;
  contrastPolicy?: ContrastPolicy;
}

export interface BrandSemanticColors {
  default: string;
  hover: string;
  active: string;
  disabled: string;
  subtle: string;
  subtleHover: string;
  text: string;
  border: string;
  focusRing: string;
  onBrand: string;
}

export interface SemanticTheme {
  mode: 'light' | 'dark';
  color: {
    brand: BrandSemanticColors;
    background: {
      page: string;
      container: string;
      elevated: string;
      disabled: string;
    };
    text: {
      primary: string;
      secondary: string;
      placeholder: string;
      disabled: string;
      inverse: string;
      link: string;
      linkHover: string;
    };
    border: {
      default: string;
      subtle: string;
      strong: string;
      focus: string;
    };
  };
}

export interface ColorThemeResult {
  seed: NormalizedSeed;
  scales: {
    brand: ColorScaleResult;
    neutral: ColorScaleResult;
  };
  themes: {
    light?: SemanticTheme;
    dark?: SemanticTheme;
  };
  diagnostics: Diagnostics;
}
