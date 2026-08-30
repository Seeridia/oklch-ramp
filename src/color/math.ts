export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

export function round(value: number, precision = 6): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function sampleCurve(source: readonly number[], steps: number): number[] {
  if (source.length === steps) return [...source];

  return Array.from({ length: steps }, (_, index) => {
    const position = (index / (steps - 1)) * (source.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(source.length - 1, Math.ceil(position));
    const lower = source[lowerIndex];
    const upper = source[upperIndex];

    if (lower === undefined || upper === undefined) {
      throw new RangeError('Unable to sample an empty curve');
    }

    return lerp(lower, upper, position - lowerIndex);
  });
}
