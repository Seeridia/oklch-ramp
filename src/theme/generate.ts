import { DEFAULT_CONTRAST } from '../constants/thresholds.js';
import { ColorScaleError } from '../diagnostics/error.js';
import { createDiagnostics, mergeMessages } from '../diagnostics/helpers.js';
import { generateColorScale } from '../scale/generate.js';
import { generateNeutralScale } from '../scale/neutral.js';
import type {
  ColorInput,
  ColorOutputFormat,
  ColorScaleOptions,
  ColorThemeOptions,
  ColorThemeResult,
  DiagnosticMessage,
  NeutralScaleOptions,
  SemanticTheme,
} from '../types.js';
import {
  adjustThemeContrast,
  collectContrastChecks,
  type ResolvedContrastTargets,
} from './contrast.js';
import { createDarkTheme } from './dark.js';
import { createLightTheme } from './light.js';

function resolveTargets(options: ColorThemeOptions): ResolvedContrastTargets {
  const targets = {
    normalText: options.contrast?.normalText ?? DEFAULT_CONTRAST.normalText,
    nonText: options.contrast?.nonText ?? DEFAULT_CONTRAST.nonText,
  };
  if (
    !Object.values(targets).every(
      (target) => Number.isFinite(target) && target >= 1 && target <= 21,
    )
  ) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      'Contrast targets must be finite ratios between 1 and 21.',
      { targets },
    );
  }
  return targets;
}

function processTheme(
  theme: SemanticTheme,
  result: Pick<ColorThemeResult, 'scales'>,
  targets: ResolvedContrastTargets,
  policy: NonNullable<ColorThemeOptions['contrastPolicy']>,
  output: ColorOutputFormat,
): { theme: SemanticTheme; messages: DiagnosticMessage[] } {
  if (policy === 'adjust') {
    adjustThemeContrast(theme, result.scales.brand, result.scales.neutral, targets, output);
  }

  const checks = collectContrastChecks(theme, targets);
  const failures = checks.filter((item) => !item.passes);
  const messages: DiagnosticMessage[] =
    failures.length === 0
      ? []
      : [
          {
            code: 'CONTRAST_TARGET_UNMET',
            severity: policy === 'strict' ? 'error' : 'warning',
            message: `${failures.length} ${theme.mode} theme contrast check(s) did not meet their target.`,
            details: { checks: failures },
          },
        ];

  return { theme, messages };
}

export function generateColorTheme(
  input: ColorInput,
  options: ColorThemeOptions = {},
): ColorThemeResult {
  const mode = options.mode ?? 'both';
  const policy = options.contrastPolicy ?? 'report';
  if (!['light', 'dark', 'both'].includes(mode)) {
    throw new ColorScaleError('INVALID_OPTIONS', `Unknown theme mode: ${mode}`, {
      mode,
    });
  }
  if (!['report', 'adjust', 'strict'].includes(policy)) {
    throw new ColorScaleError('INVALID_OPTIONS', `Unknown contrast policy: ${policy}`, { policy });
  }
  const requestedSteps = options.scale?.steps ?? 10;
  if (requestedSteps < 10) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      'Semantic themes require at least 10 brand scale steps so interactive roles remain distinct.',
      { steps: requestedSteps },
    );
  }
  const scaleOutput = options.scale?.output;
  const neutralOutput = options.neutral?.output;
  if (scaleOutput !== undefined && neutralOutput !== undefined && scaleOutput !== neutralOutput) {
    throw new ColorScaleError(
      'INVALID_OPTIONS',
      'Brand and neutral output formats must match when generating a semantic theme.',
      { scaleOutput, neutralOutput },
    );
  }
  const output: ColorOutputFormat = scaleOutput ?? neutralOutput ?? 'hex';
  const targets = resolveTargets(options);
  const scaleOptions: ColorScaleOptions = { ...options.scale, output };
  const neutralOptions: NeutralScaleOptions = { ...options.neutral, output };
  const brand = generateColorScale(input, scaleOptions);
  const neutral = generateNeutralScale(input, neutralOptions);
  const themes: ColorThemeResult['themes'] = {};
  const themeMessages: DiagnosticMessage[] = [];
  const contrastChecks = [];
  const partialResult = { scales: { brand, neutral } };

  if (mode === 'light' || mode === 'both') {
    const processed = processTheme(
      createLightTheme(brand, neutral, output),
      partialResult,
      targets,
      policy,
      output,
    );
    themes.light = processed.theme;
    themeMessages.push(...processed.messages);
    contrastChecks.push(...collectContrastChecks(processed.theme, targets));
  }

  if (mode === 'dark' || mode === 'both') {
    const processed = processTheme(
      createDarkTheme(brand, neutral, output),
      partialResult,
      targets,
      policy,
      output,
    );
    themes.dark = processed.theme;
    themeMessages.push(...processed.messages);
    contrastChecks.push(...collectContrastChecks(processed.theme, targets));
  }

  const messages = mergeMessages(
    brand.diagnostics.messages,
    neutral.diagnostics.messages,
    themeMessages,
  );
  const diagnostics = createDiagnostics(messages);
  diagnostics.contrastChecks = contrastChecks;

  if (policy === 'strict' && contrastChecks.some((item) => !item.passes)) {
    throw new ColorScaleError(
      'CONTRAST_TARGET_UNMET',
      'The generated theme does not satisfy all configured contrast targets.',
      { checks: contrastChecks.filter((item) => !item.passes) },
    );
  }

  return {
    seed: brand.seed,
    scales: { brand, neutral },
    themes,
    diagnostics,
  };
}
