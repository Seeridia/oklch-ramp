import { chooseContrastingForeground, contrastRatio } from '../color/contrast.js';
import { formatAchromatic } from '../color/format.js';
import type {
  ColorOutputFormat,
  ColorScaleResult,
  ContrastCheck,
  SemanticTheme,
} from '../types.js';
import { nearestAccessibleColor } from './select.js';

export interface ResolvedContrastTargets {
  normalText: number;
  nonText: number;
}

function check(
  foregroundRole: string,
  foreground: string,
  backgroundRole: string,
  background: string,
  target: number,
): ContrastCheck {
  const ratio = contrastRatio(foreground, background);
  return {
    foregroundRole,
    backgroundRole,
    ratio,
    target,
    passes: ratio >= target,
  };
}

export function collectContrastChecks(
  theme: SemanticTheme,
  targets: ResolvedContrastTargets,
): ContrastCheck[] {
  const { brand, background, text, border } = theme.color;

  return [
    check('text.primary', text.primary, 'background.page', background.page, targets.normalText),
    check('text.secondary', text.secondary, 'background.page', background.page, targets.normalText),
    check(
      'text.placeholder',
      text.placeholder,
      'background.page',
      background.page,
      targets.normalText,
    ),
    check('text.link', text.link, 'background.page', background.page, targets.normalText),
    check('text.linkHover', text.linkHover, 'background.page', background.page, targets.normalText),
    check('brand.onBrand', brand.onBrand, 'brand.default', brand.default, targets.normalText),
    check('brand.default', brand.default, 'background.page', background.page, targets.nonText),
    check('border.default', border.default, 'background.page', background.page, targets.nonText),
    check('border.strong', border.strong, 'background.page', background.page, targets.nonText),
    check('border.focus', border.focus, 'background.page', background.page, targets.nonText),
  ];
}

export function adjustThemeContrast(
  theme: SemanticTheme,
  brandScale: ColorScaleResult,
  neutralScale: ColorScaleResult,
  targets: ResolvedContrastTargets,
  output: ColorOutputFormat,
): void {
  const { brand, background, text, border } = theme.color;
  const neutralCandidates = neutralScale.colors;
  const brandCandidates = brandScale.colors;

  text.primary = nearestAccessibleColor(
    text.primary,
    background.page,
    targets.normalText,
    neutralCandidates,
  );
  text.secondary = nearestAccessibleColor(
    text.secondary,
    background.page,
    targets.normalText,
    neutralCandidates,
  );
  text.placeholder = nearestAccessibleColor(
    text.placeholder,
    background.page,
    targets.normalText,
    neutralCandidates,
  );
  text.link = nearestAccessibleColor(
    text.link,
    background.page,
    targets.normalText,
    brandCandidates,
  );
  text.linkHover = nearestAccessibleColor(
    text.linkHover,
    background.page,
    targets.normalText,
    brandCandidates,
  );
  brand.default = nearestAccessibleColor(
    brand.default,
    background.page,
    targets.nonText,
    brandCandidates,
  );
  brand.onBrand = chooseContrastingForeground(
    brand.default,
    formatAchromatic(1, output),
    formatAchromatic(0, output),
  );
  border.default = nearestAccessibleColor(
    border.default,
    background.page,
    targets.nonText,
    neutralCandidates,
  );
  const defaultBorderRatio = contrastRatio(border.default, background.page);
  border.strong = nearestAccessibleColor(
    border.strong,
    background.page,
    Math.min(21, Math.max(targets.nonText, defaultBorderRatio + 0.5)),
    neutralCandidates,
  );
  border.focus = nearestAccessibleColor(
    border.focus,
    background.page,
    targets.nonText,
    brandCandidates,
  );
}
