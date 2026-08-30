import fc from 'fast-check';
import { describe, expect, it } from 'vite-plus/test';

import {
  contrastRatio,
  generateColorScale,
  generateColorTheme,
  generateNeutralScale,
} from '../../src/index.js';

const hexColor = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(
    ([red, green, blue]) =>
      `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`,
  );

describe('scale properties', () => {
  it('always produces deterministic, finite, descending tonal scales', () => {
    fc.assert(
      fc.property(hexColor, (seed) => {
        const first = generateColorScale(seed);
        const second = generateColorScale(seed);

        expect(first.colors).toEqual(second.colors);
        expect(first.colors).toHaveLength(10);
        expect(first.colors.every((color) => /^#[0-9a-f]{6}$/u.test(color))).toBe(true);
        expect(
          first.stops.every(
            (stop) =>
              Number.isFinite(stop.oklch.l) &&
              Number.isFinite(stop.oklch.c) &&
              stop.oklch.l >= 0 &&
              stop.oklch.l <= 1,
          ),
        ).toBe(true);

        for (let index = 1; index < first.stops.length; index += 1) {
          expect(first.stops[index]?.oklch.l).toBeLessThan(first.stops[index - 1]?.oklch.l ?? 0);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('preserves normalized sRGB seeds in both anchored strategies', () => {
    fc.assert(
      fc.property(hexColor, (seed) => {
        for (const strategy of ['fixed-anchor', 'adaptive-anchor'] as const) {
          const result = generateColorScale(seed, { strategy });
          expect(result.anchorIndex).not.toBeNull();
          expect(result.stops[result.anchorIndex ?? -1]?.color).toBe(result.seed.normalized);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('keeps tinted neutral chroma below its configured cap', () => {
    fc.assert(
      fc.property(hexColor, fc.integer({ min: 0, max: 80_000 }), (seed, rawCap) => {
        const cap = rawCap / 1_000_000;
        const result = generateNeutralScale(seed, { tintStrength: cap });
        expect(result.stops.every((stop) => stop.oklch.c <= cap + 1e-6)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('produces passing adjusted themes with ordered border emphasis', () => {
    fc.assert(
      fc.property(hexColor, (seed) => {
        const result = generateColorTheme(seed, { contrastPolicy: 'adjust' });
        expect(result.diagnostics.contrastChecks.every((check) => check.passes)).toBe(true);

        for (const theme of Object.values(result.themes)) {
          if (theme === undefined) continue;
          const background = theme.color.background.page;
          expect(contrastRatio(theme.color.border.strong, background)).toBeGreaterThan(
            contrastRatio(theme.color.border.default, background),
          );
          expect(
            new Set([theme.color.brand.default, theme.color.brand.hover, theme.color.brand.active])
              .size,
          ).toBe(3);
        }
      }),
      { numRuns: 100 },
    );
  });
});
