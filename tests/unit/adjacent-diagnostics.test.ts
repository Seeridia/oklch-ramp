import { expect, it } from 'vite-plus/test';
import { generateColorScale, generateNeutralScale, generateColorTheme } from '../../src/index.js';

it('reports default neutral spacing as information with measured pairs', () => {
  const result = generateNeutralScale('#0052d9');
  const message = result.diagnostics.messages.find(
    (item) => item.code === 'LOW_ADJACENT_DIFFERENCE',
  );
  expect(message?.severity).toBe('info');
  expect(message?.details).toMatchObject({ scale: 'neutral', threshold: 0.025 });
  expect(message?.details?.pairs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ from: 0, to: 1, distance: expect.any(Number) }),
    ]),
  );
  expect(result.diagnostics.valid).toBe(true);
});

it('keeps warnings for closely spaced brand colors', () => {
  const result = generateColorScale('#777777', { steps: 3, lightnessCurve: [0.8, 0.79, 0.4] });
  const message = result.diagnostics.messages.find(
    (item) => item.code === 'LOW_ADJACENT_DIFFERENCE',
  );
  expect(message?.severity).toBe('warning');
  expect(message?.details?.scale).toBe('brand');
});

it('keeps duplicate neutral output as a warning', () => {
  const result = generateNeutralScale('#777777', {
    steps: 10,
    lightnessCurve: Array.from({ length: 10 }, (_, index) => 0.8 - index * 0.000001),
  });
  expect(result.diagnostics.messages).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_STOPS', severity: 'warning' }),
    ]),
  );
});

it('preserves both scale sources when merging theme diagnostics', () => {
  const result = generateColorTheme('#777777', {
    scale: { lightnessCurve: [0.985, 0.965, 0.935, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3] },
  });
  const messages = result.diagnostics.messages.filter(
    (item) => item.code === 'LOW_ADJACENT_DIFFERENCE',
  );
  expect(messages.map((item) => item.details?.scale).sort()).toEqual(['brand', 'neutral']);
});
