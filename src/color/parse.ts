import { converter, formatHex, parse } from 'culori';
import type { Oklch, Rgb } from 'culori';

import { SEED_LOW_CHROMA_C, SEED_TOO_DARK_L, SEED_TOO_LIGHT_L } from '../constants/thresholds.js';
import { ColorScaleError } from '../diagnostics/error.js';
import type { ColorInput, DiagnosticMessage, NormalizedSeed, OklchValue } from '../types.js';
import { mapOklchToSrgb } from './gamut.js';

const toOklch = converter('oklch');

export interface ParsedColor {
  seed: NormalizedSeed;
  rgb: Rgb;
  messages: DiagnosticMessage[];
}

function toValue(color: Oklch): OklchValue {
  return {
    l: color.l,
    c: color.c,
    h: color.h ?? null,
  };
}

export function parseColorInput(input: ColorInput): ParsedColor {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new ColorScaleError(
      'INVALID_COLOR',
      'Color input must be a non-empty CSS color string.',
      { input },
    );
  }

  const parsed = parse(input.trim());
  if (parsed === undefined) {
    throw new ColorScaleError('INVALID_COLOR', `Unable to parse color: ${input}`, { input });
  }

  const rawOklch = toOklch(parsed);
  if (![rawOklch.l, rawOklch.c].every(Number.isFinite)) {
    throw new ColorScaleError('INVALID_COLOR', `Color contains non-finite channels: ${input}`, {
      input,
    });
  }

  const messages: DiagnosticMessage[] = [];
  const alpha = 'alpha' in parsed ? parsed.alpha : undefined;
  if (alpha !== undefined && alpha < 1) {
    messages.push({
      code: 'ALPHA_IGNORED',
      severity: 'warning',
      message: 'The input alpha channel was ignored; generated colors are opaque.',
      details: { alpha },
    });
  }

  const mapped = mapOklchToSrgb(toValue(rawOklch));
  if (mapped.mapped) {
    messages.push({
      code: 'SEED_OUT_OF_GAMUT',
      severity: 'warning',
      message: 'The seed color was mapped into the sRGB gamut.',
      details: {
        originalChroma: mapped.originalChroma,
        mappedChroma: mapped.oklch.c,
      },
    });
  }

  if (mapped.oklch.l >= SEED_TOO_LIGHT_L) {
    messages.push({
      code: 'SEED_TOO_LIGHT',
      severity: 'warning',
      message:
        'The seed is very light; tonal or adaptive-anchor usually produces a more useful scale.',
      details: { lightness: mapped.oklch.l },
    });
  }

  if (mapped.oklch.l <= SEED_TOO_DARK_L) {
    messages.push({
      code: 'SEED_TOO_DARK',
      severity: 'warning',
      message:
        'The seed is very dark; tonal or adaptive-anchor usually produces a more useful scale.',
      details: { lightness: mapped.oklch.l },
    });
  }

  if (mapped.oklch.c <= SEED_LOW_CHROMA_C) {
    messages.push({
      code: 'SEED_LOW_CHROMA',
      severity: 'warning',
      message: 'The seed has little chroma, so the brand scale will be close to neutral.',
      details: { chroma: mapped.oklch.c },
    });
  }

  return {
    seed: {
      input,
      normalized: formatHex(mapped.rgb),
      oklch: mapped.oklch,
    },
    rgb: mapped.rgb,
    messages,
  };
}
