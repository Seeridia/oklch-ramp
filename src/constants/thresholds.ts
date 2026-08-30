export const MIN_STEPS = 3;
export const MAX_STEPS = 20;
export const DEFAULT_STEPS = 10;
export const DEFAULT_ANCHOR_INDEX = 5;

export const SEED_TOO_LIGHT_L = 0.88;
export const SEED_TOO_DARK_L = 0.28;
export const SEED_LOW_CHROMA_C = 0.025;
export const FALLBACK_HUE = 250;

export const DEFAULT_NEUTRAL_TINT = 0.025;
export const MAX_NEUTRAL_TINT = 0.08;

export const GAMUT_EPSILON = 1e-7;
export const GAMUT_ITERATIONS = 28;
export const ADJACENT_DIFFERENCE_WARNING = 0.025;

export const DEFAULT_CONTRAST = {
  normalText: 4.5,
  nonText: 3,
} as const;
