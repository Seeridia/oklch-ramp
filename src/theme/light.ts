import { chooseContrastingForeground } from '../color/contrast.js';
import { formatAchromatic } from '../color/format.js';
import type { ColorOutputFormat, ColorScaleResult, SemanticTheme } from '../types.js';
import { stopAt } from './select.js';

export function createLightTheme(
  brand: ColorScaleResult,
  neutral: ColorScaleResult,
  output: ColorOutputFormat,
): SemanticTheme {
  const brandDefault = stopAt(brand, 0.67).color;
  const white = formatAchromatic(1, output);
  const black = formatAchromatic(0, output);

  return {
    mode: 'light',
    color: {
      brand: {
        default: brandDefault,
        hover: stopAt(brand, 0.78).color,
        active: stopAt(brand, 0.89).color,
        disabled: stopAt(brand, 0.22).color,
        subtle: stopAt(brand, 0).color,
        subtleHover: stopAt(brand, 0.11).color,
        text: stopAt(brand, 0.78).color,
        border: stopAt(brand, 0.44).color,
        focusRing: stopAt(brand, 0.67).color,
        onBrand: chooseContrastingForeground(brandDefault, white, black),
      },
      background: {
        page: stopAt(neutral, 0.1).color,
        container: stopAt(neutral, 0).color,
        elevated: white,
        disabled: stopAt(neutral, 0.25).color,
      },
      text: {
        primary: stopAt(neutral, 1).color,
        secondary: stopAt(neutral, 0.78).color,
        placeholder: stopAt(neutral, 0.62).color,
        disabled: stopAt(neutral, 0.48).color,
        inverse: stopAt(neutral, 0).color,
        link: stopAt(brand, 0.78).color,
        linkHover: stopAt(brand, 0.89).color,
      },
      border: {
        default: stopAt(neutral, 0.32).color,
        subtle: stopAt(neutral, 0.2).color,
        strong: stopAt(neutral, 0.46).color,
        focus: stopAt(brand, 0.67).color,
      },
    },
  };
}
