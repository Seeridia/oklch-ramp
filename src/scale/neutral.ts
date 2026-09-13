import {
  DEFAULT_NEUTRAL_CHROMA_10,
  DEFAULT_NEUTRAL_CHROMA_14,
  DEFAULT_NEUTRAL_LIGHTNESS_10,
  DEFAULT_NEUTRAL_LIGHTNESS_14,
} from '../constants/curves.js';
import { DEFAULT_NEUTRAL_TINT, FALLBACK_HUE, MAX_NEUTRAL_TINT } from '../constants/thresholds.js';
import { ColorScaleError } from '../diagnostics/error.js';
import type { ColorInput, ColorScaleResult, NeutralScaleOptions } from '../types.js';
import { normalizeHue } from '../color/math.js';
import { parseColorInput } from '../color/parse.js';
import { buildScaleResult, type ScaleCandidate } from './build.js';

export function generateNeutralScale(
  input: ColorInput,
  options: NeutralScaleOptions = {},
): ColorScaleResult {
  const steps = options.steps ?? 14;
  if (steps !== 10 && steps !== 14) {
    throw new ColorScaleError('INVALID_OPTIONS', 'Neutral steps must be either 10 or 14.', {
      steps,
    });
  }
  const output = options.output ?? 'hex';
  if (!['hex', 'rgb', 'oklch'].includes(output)) {
    throw new ColorScaleError('INVALID_OPTIONS', `Unknown output format: ${output}`, {
      output,
    });
  }
  const gamutMapping = options.gamutMapping as string | undefined;
  if (gamutMapping !== undefined && gamutMapping !== 'chroma-reduction') {
    throw new ColorScaleError('INVALID_OPTIONS', `Unknown gamut mapping method: ${gamutMapping}`, {
      gamutMapping,
    });
  }
  const tintStrength = options.tintStrength ?? DEFAULT_NEUTRAL_TINT;
  if (!Number.isFinite(tintStrength) || tintStrength < 0 || tintStrength > MAX_NEUTRAL_TINT) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `tintStrength must be between 0 and ${MAX_NEUTRAL_TINT}.`,
      { tintStrength },
    );
  }

  if (options.hue !== undefined && options.hue !== 'seed' && !Number.isFinite(options.hue)) {
    throw new ColorScaleError('INVALID_OPTIONS', 'Neutral hue must be "seed" or a finite angle.', {
      hue: options.hue,
    });
  }

  const defaultLightness =
    steps === 10 ? DEFAULT_NEUTRAL_LIGHTNESS_10 : DEFAULT_NEUTRAL_LIGHTNESS_14;
  const chromaShape = steps === 10 ? DEFAULT_NEUTRAL_CHROMA_10 : DEFAULT_NEUTRAL_CHROMA_14;
  const lightness = options.lightnessCurve ?? defaultLightness;
  if (
    lightness.length !== steps ||
    !lightness.every(
      (value, index) =>
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 1 &&
        (index === 0 || value < (lightness[index - 1] ?? 0)),
    )
  ) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `lightnessCurve must contain ${steps} strictly descending values between 0 and 1.`,
    );
  }

  const parsed = parseColorInput(input);
  const explicitHue =
    options.hue === undefined || options.hue === 'seed' ? parsed.seed.oklch.h : options.hue;
  const hue = normalizeHue(explicitHue ?? FALLBACK_HUE);
  const brandRelatedChroma = Math.min(tintStrength, parsed.seed.oklch.c * 0.18);
  const candidates: ScaleCandidate[] = lightness.map((value, index) => ({
    oklch: {
      l: value,
      c: brandRelatedChroma * (chromaShape[index] ?? 1),
      h: brandRelatedChroma === 0 ? null : hue,
    },
    source: 'generated',
  }));

  return buildScaleResult({
    kind: 'neutral',
    seed: parsed.seed,
    strategy: 'tonal',
    anchorIndex: null,
    recommendedIndex: Math.floor((steps - 1) / 2),
    candidates,
    output,
    messages: parsed.messages,
  });
}
