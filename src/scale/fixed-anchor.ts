import type { OklchValue } from '../types.js';
import type { ScaleCandidate } from './build.js';
import { anchoredLightness, hueAt } from './curves.js';
import type { ResolvedScaleOptions } from './options.js';

export function generateFixedAnchorCandidates(
  seed: OklchValue,
  options: ResolvedScaleOptions,
  lightnessCurve: readonly number[],
  chromaCurve: readonly number[],
  anchorIndex = options.anchorIndex,
): ScaleCandidate[] {
  const lightness = anchoredLightness(lightnessCurve, anchorIndex, seed.l);
  const anchorChromaFactor = Math.max(chromaCurve[anchorIndex] ?? 1, 0.001);

  return lightness.map((value, index) => {
    if (index === anchorIndex) {
      return { oklch: seed, source: 'seed' };
    }

    return {
      oklch: {
        l: value,
        c: seed.c * ((chromaCurve[index] ?? 1) / anchorChromaFactor),
        h: hueAt(seed, index, options.hueShift),
      },
      source: 'generated',
    };
  });
}
