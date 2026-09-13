import { DEFAULT_BRAND_CHROMA, DEFAULT_BRAND_LIGHTNESS } from '../constants/curves.js';
import { FALLBACK_HUE } from '../constants/thresholds.js';
import type { OklchValue } from '../types.js';
import { clamp, lerp, normalizeHue, sampleCurve } from '../color/math.js';
import type { ResolvedScaleOptions } from './options.js';

export function resolveBrandCurves(options: ResolvedScaleOptions): {
  lightness: number[];
  chroma: number[];
} {
  const curves = {
    lightness:
      options.lightnessCurve === undefined
        ? sampleCurve(DEFAULT_BRAND_LIGHTNESS, options.steps)
        : [...options.lightnessCurve],
    chroma:
      options.chromaCurve === undefined
        ? sampleCurve(DEFAULT_BRAND_CHROMA, options.steps)
        : [...options.chromaCurve],
  };
  if (options.endpoints === 'black-white') {
    const first = curves.lightness[0]!;
    const last = curves.lightness.at(-1)!;
    curves.lightness = curves.lightness.map((value) => (value - last) / (first - last));
    curves.chroma[0] = 0;
    curves.chroma[curves.chroma.length - 1] = 0;
  }
  return curves;
}

export function hueAt(
  seed: OklchValue,
  index: number,
  hueShift: number | readonly number[],
  preserveSeed = false,
): number | null {
  if (seed.c === 0 && seed.h === null) return null;
  if (preserveSeed) return seed.h;

  const shift = typeof hueShift === 'number' ? hueShift : (hueShift[index] ?? 0);
  return normalizeHue((seed.h ?? FALLBACK_HUE) + shift);
}

export function anchoredLightness(
  targets: readonly number[],
  anchorIndex: number,
  seedLightness: number,
): number[] {
  const firstTarget = targets[0] ?? 1;
  const anchorTarget = targets[anchorIndex] ?? seedLightness;
  const lastTarget = targets.at(-1) ?? 0;
  const lightEndpoint = clamp(Math.max(firstTarget, seedLightness + 0.015));
  const darkEndpoint = clamp(Math.min(lastTarget, seedLightness - 0.015));

  return targets.map((target, index) => {
    if (index === anchorIndex) return seedLightness;

    if (index < anchorIndex) {
      const denominator = firstTarget - anchorTarget;
      const amount = denominator > 0 ? (firstTarget - target) / denominator : index / anchorIndex;
      return lerp(lightEndpoint, seedLightness, clamp(amount));
    }

    const denominator = anchorTarget - lastTarget;
    const amount =
      denominator > 0
        ? (anchorTarget - target) / denominator
        : (index - anchorIndex) / (targets.length - 1 - anchorIndex);
    return lerp(seedLightness, darkEndpoint, clamp(amount));
  });
}
