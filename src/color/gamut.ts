import { converter } from 'culori';
import type { Oklch, Rgb } from 'culori';

import { GAMUT_EPSILON, GAMUT_ITERATIONS } from '../constants/thresholds.js';
import type { OklchValue } from '../types.js';
import { clamp } from './math.js';

const toRgb = converter('rgb');
const toOklch = converter('oklch');

export interface GamutMappedColor {
  oklch: OklchValue;
  rgb: Rgb;
  mapped: boolean;
  originalChroma: number;
}

function asCuloriOklch(color: OklchValue): Oklch {
  const result: Oklch = {
    mode: 'oklch',
    l: color.l,
    c: color.c,
  };

  if (color.h !== null) result.h = color.h;
  return result;
}

function hasFiniteChannels(rgb: Rgb): boolean {
  return [rgb.r, rgb.g, rgb.b].every(Number.isFinite);
}

export function isRgbInGamut(rgb: Rgb): boolean {
  return (
    hasFiniteChannels(rgb) &&
    rgb.r >= -GAMUT_EPSILON &&
    rgb.r <= 1 + GAMUT_EPSILON &&
    rgb.g >= -GAMUT_EPSILON &&
    rgb.g <= 1 + GAMUT_EPSILON &&
    rgb.b >= -GAMUT_EPSILON &&
    rgb.b <= 1 + GAMUT_EPSILON
  );
}

export function mapOklchToSrgb(color: OklchValue): GamutMappedColor {
  const normalized: OklchValue = {
    l: clamp(color.l),
    c: Math.max(0, color.c),
    h: color.h,
  };
  const direct = toRgb(asCuloriOklch(normalized));

  if (isRgbInGamut(direct)) {
    return {
      oklch: normalized,
      rgb: direct,
      mapped: normalized.l !== color.l || normalized.c !== color.c,
      originalChroma: color.c,
    };
  }

  let lower = 0;
  let upper = normalized.c;
  let best = toRgb(asCuloriOklch({ ...normalized, c: 0 }));

  for (let iteration = 0; iteration < GAMUT_ITERATIONS; iteration += 1) {
    const candidateChroma = (lower + upper) / 2;
    const candidate = toRgb(asCuloriOklch({ ...normalized, c: candidateChroma }));

    if (isRgbInGamut(candidate)) {
      lower = candidateChroma;
      best = candidate;
    } else {
      upper = candidateChroma;
    }
  }

  const rgb: Rgb = {
    mode: 'rgb',
    r: clamp(best.r),
    g: clamp(best.g),
    b: clamp(best.b),
  };
  const converted = toOklch(rgb);

  return {
    oklch: {
      l: converted.l,
      c: converted.c,
      h: converted.h ?? normalized.h,
    },
    rgb,
    mapped: true,
    originalChroma: color.c,
  };
}
