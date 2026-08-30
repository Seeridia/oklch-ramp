import { chooseContrastingForeground } from '../color/contrast.js';
import { formatAchromatic } from '../color/format.js';
import type { ColorOutputFormat, ColorScaleResult, SemanticTheme } from '../types.js';
import { stopAt } from './select.js';

export function createDarkTheme(
  brand: ColorScaleResult,
  neutral: ColorScaleResult,
  output: ColorOutputFormat,
): SemanticTheme {
  const brandDefault = stopAt(brand, 0.44).color;
  const white = formatAchromatic(1, output);
  const black = formatAchromatic(0, output);

  return {
    mode: 'dark',
    color: {
      brand: {
        default: brandDefault,
        hover: stopAt(brand, 0.33).color,
        active: stopAt(brand, 0.56).color,
        disabled: stopAt(brand, 0.78).color,
        subtle: stopAt(brand, 1).color,
        subtleHover: stopAt(brand, 0.89).color,
        text: stopAt(brand, 0.33).color,
        border: stopAt(brand, 0.67).color,
        focusRing: stopAt(brand, 0.44).color,
        onBrand: chooseContrastingForeground(brandDefault, white, black),
      },
      background: {
        page: stopAt(neutral, 1).color,
        container: stopAt(neutral, 0.92).color,
        elevated: stopAt(neutral, 0.82).color,
        disabled: stopAt(neutral, 0.72).color,
      },
      text: {
        primary: stopAt(neutral, 0).color,
        secondary: stopAt(neutral, 0.18).color,
        placeholder: stopAt(neutral, 0.32).color,
        disabled: stopAt(neutral, 0.46).color,
        inverse: stopAt(neutral, 1).color,
        link: stopAt(brand, 0.33).color,
        linkHover: stopAt(brand, 0.22).color,
      },
      border: {
        default: stopAt(neutral, 0.66).color,
        subtle: stopAt(neutral, 0.76).color,
        strong: stopAt(neutral, 0.52).color,
        focus: stopAt(brand, 0.44).color,
      },
    },
  };
}
