import { converter, parse } from 'culori';

import { contrastRatio } from '../color/contrast.js';
import { oklchDistance } from '../diagnostics/helpers.js';
import type { ColorScaleResult, ColorStop, OklchValue } from '../types.js';

const toOklch = converter('oklch');

export function closestByLightness(scale: ColorScaleResult, lightness: number): ColorStop {
  let best = scale.stops[0];
  if (best === undefined) throw new RangeError('Scale has no color stops');

  for (const stop of scale.stops.slice(1)) {
    if (Math.abs(stop.oklch.l - lightness) < Math.abs(best.oklch.l - lightness)) {
      best = stop;
    }
  }
  return best;
}

export function stopAt(scale: ColorScaleResult, normalizedPosition: number): ColorStop {
  const index = Math.round(Math.min(1, Math.max(0, normalizedPosition)) * (scale.stops.length - 1));
  const stop = scale.stops[index];
  if (stop === undefined) throw new RangeError('Scale has no color stops');
  return stop;
}

function toOklchValue(color: string): OklchValue | undefined {
  const parsed = parse(color);
  if (parsed === undefined) return undefined;
  const converted = toOklch(parsed);
  return {
    l: converted.l,
    c: converted.c,
    h: converted.h ?? null,
  };
}

export function nearestAccessibleColor(
  original: string,
  background: string,
  target: number,
  candidates: readonly string[],
): string {
  const originalOklch = toOklchValue(original);
  const passing = candidates.filter((candidate) => contrastRatio(candidate, background) >= target);
  if (passing.length === 0 || originalOklch === undefined) return original;

  let best = passing[0];
  if (best === undefined) return original;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of passing) {
    const candidateOklch = toOklchValue(candidate);
    if (candidateOklch === undefined) continue;
    const distance = oklchDistance(originalOklch, candidateOklch);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}
