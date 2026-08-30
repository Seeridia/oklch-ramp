import {
  DEFAULT_ANCHOR_INDEX,
  DEFAULT_STEPS,
  MAX_STEPS,
  MIN_STEPS,
} from '../constants/thresholds.js';
import { ColorScaleError } from '../diagnostics/error.js';
import type { ColorOutputFormat, ColorScaleOptions, ScaleStrategy } from '../types.js';

export interface ResolvedScaleOptions {
  steps: number;
  strategy: ScaleStrategy;
  anchorIndex: number;
  output: ColorOutputFormat;
  hueShift: number | readonly number[];
  lightnessCurve: readonly number[] | undefined;
  chromaCurve: readonly number[] | undefined;
}

function assertCurve(
  curve: readonly number[] | undefined,
  steps: number,
  name: string,
  predicate: (value: number, index: number, values: readonly number[]) => boolean,
): void {
  if (curve === undefined) return;
  if (curve.length !== steps || !curve.every(Number.isFinite)) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `${name} must contain exactly ${steps} finite values.`,
      { name, steps, value: curve },
    );
  }
  if (!curve.every(predicate)) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `${name} contains values outside its supported range or order.`,
      { name, value: curve },
    );
  }
}

export function resolveScaleOptions(options: ColorScaleOptions = {}): ResolvedScaleOptions {
  const steps = options.steps ?? DEFAULT_STEPS;
  if (!Number.isInteger(steps) || steps < MIN_STEPS || steps > MAX_STEPS) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `steps must be an integer between ${MIN_STEPS} and ${MAX_STEPS}.`,
      { steps },
    );
  }

  const strategy = options.strategy ?? 'tonal';
  if (!['fixed-anchor', 'adaptive-anchor', 'tonal'].includes(strategy)) {
    throw new ColorScaleError('INVALID_OPTIONS', `Unknown strategy: ${strategy}`, {
      strategy,
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
  const anchorIndex = options.anchorIndex ?? Math.min(DEFAULT_ANCHOR_INDEX, steps - 2);
  if (!Number.isInteger(anchorIndex) || anchorIndex < 0 || anchorIndex >= steps) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `anchorIndex must be a zero-based index between 0 and ${steps - 1}.`,
      { anchorIndex },
    );
  }
  if (strategy !== 'fixed-anchor' && options.anchorIndex !== undefined) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      'anchorIndex can only be used with the fixed-anchor strategy.',
      { strategy, anchorIndex },
    );
  }

  assertCurve(
    options.lightnessCurve,
    steps,
    'lightnessCurve',
    (value, index, values) =>
      value >= 0 && value <= 1 && (index === 0 || value < (values[index - 1] ?? 0)),
  );
  assertCurve(options.chromaCurve, steps, 'chromaCurve', (value) => value >= 0);

  const hueShift = options.hueShift ?? 0;
  if (
    (typeof hueShift === 'number' && !Number.isFinite(hueShift)) ||
    (Array.isArray(hueShift) && (hueShift.length !== steps || !hueShift.every(Number.isFinite)))
  ) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      `hueShift must be a finite number or an array of ${steps} finite numbers.`,
      { hueShift },
    );
  }

  return {
    steps,
    strategy,
    anchorIndex,
    output,
    hueShift,
    lightnessCurve: options.lightnessCurve,
    chromaCurve: options.chromaCurve,
  };
}
