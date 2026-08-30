import type { OklchValue } from '../types.js';
import type { ScaleCandidate } from './build.js';
import { hueAt } from './curves.js';
import type { ResolvedScaleOptions } from './options.js';

export function generateTonalCandidates(
  seed: OklchValue,
  options: ResolvedScaleOptions,
  lightnessCurve: readonly number[],
  chromaCurve: readonly number[],
): ScaleCandidate[] {
  const baseChroma = Math.min(seed.c, 0.32);

  return lightnessCurve.map((lightness, index) => ({
    oklch: {
      l: lightness,
      c: baseChroma * (chromaCurve[index] ?? 1),
      h: hueAt(seed, index, options.hueShift),
    },
    source: 'generated',
  }));
}
