import type { DiagnosticMessage, Diagnostics, OklchValue } from '../types.js';

export function createDiagnostics(messages: DiagnosticMessage[] = []): Diagnostics {
  return {
    valid: !messages.some((message) => message.severity === 'error'),
    messages,
    contrastChecks: [],
  };
}

export function mergeMessages(...groups: readonly DiagnosticMessage[][]): DiagnosticMessage[] {
  const seen = new Set<string>();
  const result: DiagnosticMessage[] = [];

  for (const message of groups.flat()) {
    const key = JSON.stringify(message);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(message);
    }
  }

  return result;
}

export function oklchDistance(a: OklchValue, b: OklchValue): number {
  const ah = ((a.h ?? 0) * Math.PI) / 180;
  const bh = ((b.h ?? 0) * Math.PI) / 180;
  const aa = a.c * Math.cos(ah);
  const ab = a.c * Math.sin(ah);
  const ba = b.c * Math.cos(bh);
  const bb = b.c * Math.sin(bh);

  return Math.hypot(a.l - b.l, aa - ba, ab - bb);
}
