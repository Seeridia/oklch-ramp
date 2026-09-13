import { ADJACENT_DIFFERENCE_WARNING } from '../constants/thresholds.js';
import { createDiagnostics, oklchDistance } from '../diagnostics/helpers.js';
import type {
  ColorOutputFormat,
  ColorScaleResult,
  ColorStop,
  DiagnosticMessage,
  NormalizedSeed,
  OklchValue,
  ScaleStrategy,
} from '../types.js';
import { formatColor } from '../color/format.js';
import { mapOklchToSrgb } from '../color/gamut.js';

export interface ScaleCandidate {
  oklch: OklchValue;
  source: 'seed' | 'generated';
}

interface BuildScaleInput {
  kind?: 'brand' | 'neutral';
  seed: NormalizedSeed;
  strategy: ScaleStrategy;
  anchorIndex: number | null;
  recommendedIndex: number;
  candidates: ScaleCandidate[];
  output: ColorOutputFormat;
  messages: DiagnosticMessage[];
}

function inspectStops(stops: readonly ColorStop[], kind: 'brand' | 'neutral'): DiagnosticMessage[] {
  const messages: DiagnosticMessage[] = [];
  const duplicateIndexes: number[] = [];
  const lowDifferenceIndexes: number[] = [];
  const pairs: { from: number; to: number; distance: number }[] = [];

  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1];
    const current = stops[index];
    if (previous === undefined || current === undefined) continue;

    if (previous.color === current.color) duplicateIndexes.push(index - 1, index);
    const distance = oklchDistance(previous.oklch, current.oklch);
    if (distance < ADJACENT_DIFFERENCE_WARNING) {
      lowDifferenceIndexes.push(index - 1, index);
      pairs.push({ from: index - 1, to: index, distance });
    }
  }

  if (duplicateIndexes.length > 0) {
    messages.push({
      code: 'DUPLICATE_STOPS',
      severity: 'warning',
      message: 'One or more adjacent stops become identical after output quantization.',
      stopIndexes: [...new Set(duplicateIndexes)],
      details: { scale: kind },
    });
  }
  if (lowDifferenceIndexes.length > 0) {
    messages.push({
      code: 'LOW_ADJACENT_DIFFERENCE',
      severity: kind === 'neutral' ? 'info' : 'warning',
      message: 'One or more adjacent stops have a small perceptual difference.',
      stopIndexes: [...new Set(lowDifferenceIndexes)],
      details: { scale: kind, metric: 'OKLab Euclidean distance', threshold: ADJACENT_DIFFERENCE_WARNING, pairs },
    });
  }

  return messages;
}

export function buildScaleResult(input: BuildScaleInput): ColorScaleResult {
  const gamutMappedIndexes: number[] = [];
  const stops = input.candidates.map<ColorStop>((candidate, index) => {
    const mapped = mapOklchToSrgb(candidate.oklch);
    if (mapped.mapped) gamutMappedIndexes.push(index);

    return {
      index,
      label: String(index + 1),
      color: formatColor(mapped.oklch, mapped.rgb, input.output),
      oklch: mapped.oklch,
      inGamut: true,
      source: mapped.mapped ? 'gamut-mapped' : candidate.source,
    };
  });

  const messages = [...input.messages];
  if (gamutMappedIndexes.length > 0) {
    messages.push({
      code: 'GAMUT_MAPPED',
      severity: 'info',
      message: 'Some stops required OKLCH chroma reduction to fit sRGB.',
      stopIndexes: gamutMappedIndexes,
    });
  }
  messages.push(...inspectStops(stops, input.kind ?? 'brand'));

  return {
    seed: input.seed,
    strategy: input.strategy,
    anchorIndex: input.anchorIndex,
    recommendedIndex: input.recommendedIndex,
    colors: stops.map((stop) => stop.color),
    stops,
    diagnostics: createDiagnostics(messages),
  };
}
