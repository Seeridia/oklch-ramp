import { converter, parse } from 'culori';
import type { Rgb } from 'culori';

import { ColorScaleError } from '../diagnostics/error.js';

const toRgb = converter('rgb');

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function parseRgb(input: string | Rgb, role: string): Rgb {
  const color = typeof input === 'string' ? parse(input) : input;
  if (color === undefined) {
    throw new ColorScaleError(
      'INVALID_COLOR',
      `Unable to parse ${role} color: ${typeof input === 'string' ? input : '<rgb color>'}`,
    );
  }

  return toRgb(color);
}

function luminanceFromRgb(rgb: Rgb): number {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

export function relativeLuminance(input: string | Rgb): number {
  const rgb = parseRgb(input, 'luminance');
  if ((rgb.alpha ?? 1) < 1) {
    throw new ColorScaleError(
      'INVALID_COLOR',
      'Relative luminance requires an opaque color. Composite translucent colors first.',
      { alpha: rgb.alpha },
    );
  }

  return luminanceFromRgb(rgb);
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundRgb = parseRgb(foreground, 'foreground');
  const backgroundRgb = parseRgb(background, 'background');
  const backgroundAlpha = backgroundRgb.alpha ?? 1;
  if (backgroundAlpha < 1) {
    throw new ColorScaleError(
      'INVALID_COLOR',
      'Contrast calculation requires an opaque background color.',
      { alpha: backgroundAlpha },
    );
  }

  const foregroundAlpha = foregroundRgb.alpha ?? 1;
  const compositedForeground: Rgb = {
    mode: 'rgb',
    r: foregroundRgb.r * foregroundAlpha + backgroundRgb.r * (1 - foregroundAlpha),
    g: foregroundRgb.g * foregroundAlpha + backgroundRgb.g * (1 - foregroundAlpha),
    b: foregroundRgb.b * foregroundAlpha + backgroundRgb.b * (1 - foregroundAlpha),
  };
  const first = luminanceFromRgb(compositedForeground);
  const second = luminanceFromRgb(backgroundRgb);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function chooseContrastingForeground(
  background: string,
  light = '#ffffff',
  dark = '#000000',
): string {
  return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark;
}
