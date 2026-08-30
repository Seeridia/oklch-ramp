import { DEFAULT_ANCHOR_INDEX } from '../constants/thresholds.js';
import { oklchDistance } from '../diagnostics/helpers.js';
import type {
  ColorInput,
  ColorScaleOptions,
  ColorScaleResult,
  DiagnosticMessage,
} from '../types.js';
import { parseColorInput } from '../color/parse.js';
import { generateAdaptiveAnchorCandidates } from './adaptive-anchor.js';
import { buildScaleResult, type ScaleCandidate } from './build.js';
import { resolveBrandCurves } from './curves.js';
import { generateFixedAnchorCandidates } from './fixed-anchor.js';
import { resolveScaleOptions } from './options.js';
import { generateTonalCandidates } from './tonal.js';

function closestStopToSeed(
  candidates: readonly ScaleCandidate[],
  seed: ColorScaleResult['seed']['oklch'],
): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    const distance = oklchDistance(candidate.oklch, seed);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function generateColorScale(
  input: ColorInput,
  options: ColorScaleOptions = {},
): ColorScaleResult {
  const resolved = resolveScaleOptions(options);
  const parsed = parseColorInput(input);
  const curves = resolveBrandCurves(resolved);
  const messages: DiagnosticMessage[] = [...parsed.messages];

  if (resolved.strategy === 'fixed-anchor') {
    const candidates = generateFixedAnchorCandidates(
      parsed.seed.oklch,
      resolved,
      curves.lightness,
      curves.chroma,
    );
    return buildScaleResult({
      seed: parsed.seed,
      strategy: resolved.strategy,
      anchorIndex: resolved.anchorIndex,
      recommendedIndex: resolved.anchorIndex,
      candidates,
      output: resolved.output,
      messages,
    });
  }

  if (resolved.strategy === 'adaptive-anchor') {
    const adaptive = generateAdaptiveAnchorCandidates(
      parsed.seed.oklch,
      resolved,
      curves.lightness,
      curves.chroma,
    );
    const defaultAnchor = Math.min(DEFAULT_ANCHOR_INDEX, resolved.steps - 2);
    if (adaptive.anchorIndex !== defaultAnchor) {
      messages.push({
        code: 'ANCHOR_MOVED',
        severity: 'info',
        message: `The seed was placed at stop ${adaptive.anchorIndex + 1} to match its lightness.`,
        details: {
          defaultAnchorIndex: defaultAnchor,
          actualAnchorIndex: adaptive.anchorIndex,
        },
      });
    }
    return buildScaleResult({
      seed: parsed.seed,
      strategy: resolved.strategy,
      anchorIndex: adaptive.anchorIndex,
      recommendedIndex: adaptive.anchorIndex,
      candidates: adaptive.candidates,
      output: resolved.output,
      messages,
    });
  }

  const candidates = generateTonalCandidates(
    parsed.seed.oklch,
    resolved,
    curves.lightness,
    curves.chroma,
  );
  return buildScaleResult({
    seed: parsed.seed,
    strategy: resolved.strategy,
    anchorIndex: null,
    recommendedIndex: closestStopToSeed(candidates, parsed.seed.oklch),
    candidates,
    output: resolved.output,
    messages,
  });
}
