import type { ColorThemeResult, SemanticTheme } from '@okramp/core';

export interface AntdThemeConfig {
  algorithm: false;
  token: Record<string, string>;
}

/** Explicit alias tokens for Ant Design 5/6 ConfigProvider. */
export function createAntdTheme(
  result: ColorThemeResult,
  mode: 'light' | 'dark' = 'light',
): AntdThemeConfig {
  const theme = result.themes[mode];
  if (!theme) throw new Error(`Theme mode ${mode} was not generated`);
  return { algorithm: false, token: createAntdTokens(theme) };
}

export function createAntdTokens(theme: SemanticTheme): Record<string, string> {
  const { brand: b, background: bg, text: t, border } = theme.color;
  return {
    colorPrimary: b.default,
    colorPrimaryHover: b.hover,
    colorPrimaryActive: b.active,
    colorPrimaryBg: b.subtle,
    colorPrimaryBgHover: b.subtleHover,
    colorPrimaryBorder: b.border,
    colorPrimaryBorderHover: b.hover,
    colorPrimaryText: b.text,
    colorPrimaryTextHover: b.hover,
    colorPrimaryTextActive: b.active,
    colorInfo: b.default,
    colorInfoBg: b.subtle,
    colorInfoBgHover: b.subtleHover,
    colorInfoBorder: b.border,
    colorInfoBorderHover: b.hover,
    colorInfoHover: b.hover,
    colorInfoActive: b.active,
    colorInfoText: b.text,
    colorInfoTextHover: b.hover,
    colorInfoTextActive: b.active,
    colorBgBase: bg.page,
    colorBgLayout: bg.page,
    colorBgContainer: bg.container,
    colorBgElevated: bg.elevated,
    colorBgContainerDisabled: bg.disabled,
    colorTextBase: t.primary,
    colorText: t.primary,
    colorTextSecondary: t.secondary,
    colorTextTertiary: t.placeholder,
    colorTextQuaternary: t.disabled,
    colorTextPlaceholder: t.placeholder,
    colorTextDisabled: t.disabled,
    colorTextHeading: t.primary,
    colorTextLabel: t.secondary,
    colorTextDescription: t.secondary,
    colorTextLightSolid: b.onBrand,
    colorLink: t.link,
    colorLinkHover: t.linkHover,
    colorLinkActive: b.active,
    colorBorder: border.default,
    colorBorderSecondary: border.subtle,
    colorSplit: border.subtle,
    colorFill: bg.disabled,
    colorFillSecondary: bg.elevated,
    colorFillTertiary: bg.page,
    colorFillQuaternary: bg.container,
    controlItemBgHover: bg.elevated,
    controlItemBgActive: b.subtle,
    controlItemBgActiveHover: b.subtleHover,
    controlOutline: b.focusRing,
  };
}
