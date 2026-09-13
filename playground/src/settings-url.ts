import { DEFAULTS, type Settings } from './model';
import { readUrlParam, updateUrlParams } from './url-state';

const comparisonKeys: Array<keyof Settings> = ['seed', 'strategy', 'anchorIndex'];
const keys = Object.keys(DEFAULTS) as Array<keyof Settings>;
const ranges: Partial<Record<keyof Settings, [number, number, boolean]>> = {
  steps: [3, 20, true], anchorIndex: [0, 19, true], neutralSteps: [10, 14, true],
  hueShift: [-60, 60, false], tintStrength: [0, 0.08, false],
  normalText: [1, 21, false], nonText: [1, 21, false],
};
const choices: Partial<Record<keyof Settings, string[]>> = {
  strategy: ['tonal', 'adaptive-anchor', 'fixed-anchor'],
  endpoints: ['curve', 'black-white'], contrastPolicy: ['report', 'adjust', 'strict'],
};

export function readSettings(scope: 'workspace' | 'compare'): Settings {
  const result = { ...DEFAULTS };
  for (const key of scope === 'compare' ? comparisonKeys : keys) {
    const raw = readUrlParam(`${scope}.${key}`, '');
    if (!raw) continue;
    if (key === 'seed') { result.seed = raw; continue; }
    const range = ranges[key];
    if (range) {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < range[0] || value > range[1] || (range[2] && !Number.isInteger(value))) continue;
      if (key === 'neutralSteps' && value !== 10 && value !== 14) continue;
      Object.assign(result, { [key]: value });
    } else if (choices[key]?.includes(raw)) {
      Object.assign(result, { [key]: raw });
    }
  }
  const inset = result.endpoints === 'black-white' ? 1 : 0;
  result.anchorIndex = Math.max(inset, Math.min(result.anchorIndex, result.steps - 1 - inset));
  return result;
}

export function writeSettings(scope: 'workspace' | 'compare', settings: Settings) {
  updateUrlParams(Object.fromEntries(
    (scope === 'compare' ? comparisonKeys : keys).map((key) => [
      `${scope}.${key}`, settings[key] === DEFAULTS[key] ? null : settings[key],
    ]),
  ), 'replace');
}
