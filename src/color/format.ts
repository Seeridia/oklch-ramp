import { formatHex } from 'culori';
import type { Rgb } from 'culori';

import type { ColorOutputFormat, OklchValue } from '../types.js';
import { clamp, round } from './math.js';

export function formatColor(oklch: OklchValue, rgb: Rgb, output: ColorOutputFormat): string {
  if (output === 'hex') return formatHex(rgb);

  if (output === 'rgb') {
    const red = Math.round(clamp(rgb.r) * 255);
    const green = Math.round(clamp(rgb.g) * 255);
    const blue = Math.round(clamp(rgb.b) * 255);
    return `rgb(${red} ${green} ${blue})`;
  }

  const hue = oklch.h === null ? 'none' : String(round(oklch.h, 3));
  return `oklch(${round(oklch.l * 100, 3)}% ${round(oklch.c, 5)} ${hue})`;
}

export function formatAchromatic(lightness: 0 | 1, output: ColorOutputFormat): string {
  return formatColor(
    { l: lightness, c: 0, h: null },
    { mode: 'rgb', r: lightness, g: lightness, b: lightness },
    output,
  );
}
