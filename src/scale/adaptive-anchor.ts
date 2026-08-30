import type { OklchValue } from '../types.js';
import type { ScaleCandidate } from './build.js';
import { generateFixedAnchorCandidates } from './fixed-anchor.js';
import type { ResolvedScaleOptions } from './options.js';

export function chooseAdaptiveAnchor(
  seedLightness: number,
  lightnessCurve: readonly number[],
): number {
  const lastIndex = lightnessCurve.length - 1;
  const candidates = Array.from({ length: Math.max(1, lastIndex - 1) }, (_, index) =>
    Math.min(lastIndex, index + 1),
  );

  let bestIndex = candidates[0] ?? 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const index of candidates) {
    const target = lightnessCurve[index] ?? seedLightness;
    const leftSpacing = index === 0 ? 1 : (1 - seedLightness) / index;
    const rightCount = lastIndex - index;
    const rightSpacing = rightCount === 0 ? 1 : seedLightness / rightCount;
    const spacingPenalty =
      Math.max(0, 0.025 - leftSpacing) * 3 + Math.max(0, 0.025 - rightSpacing) * 3;
    const edgePenalty = index === 1 || index === lastIndex - 1 ? 0.005 : 0;
    const score = Math.abs(seedLightness - target) + spacingPenalty + edgePenalty;

    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
}

export function generateAdaptiveAnchorCandidates(
  seed: OklchValue,
  options: ResolvedScaleOptions,
  lightnessCurve: readonly number[],
  chromaCurve: readonly number[],
): { anchorIndex: number; candidates: ScaleCandidate[] } {
  const anchorIndex = chooseAdaptiveAnchor(seed.l, lightnessCurve);
  return {
    anchorIndex,
    candidates: generateFixedAnchorCandidates(
      seed,
      options,
      lightnessCurve,
      chromaCurve,
      anchorIndex,
    ),
  };
}
