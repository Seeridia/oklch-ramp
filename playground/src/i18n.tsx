import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'zh-CN' | 'en-US';

interface I18nContextValue {
  locale: Locale;
  isZh: boolean;
  setLocale: (locale: Locale) => void;
  t: (zh: string, en: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(message: string, values?: Record<string, string | number>) {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

function initialLocale(): Locale {
  try {
    return localStorage.getItem('okramp-locale') === 'en-US' ? 'en-US' : 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

export function currentLocale(): Locale {
  return initialLocale();
}

export function localizeEngineError(message: string, locale: Locale): string {
  if (locale === 'en-US' || !message) return message;
  if (message === 'Color input must be a non-empty CSS color string.')
    return '颜色值不能为空，请输入有效的 CSS 颜色。';
  if (message.startsWith('Unable to parse color:'))
    return `无法解析颜色：${message.slice('Unable to parse color:'.length).trim()}`;
  if (message.startsWith('Color contains non-finite channels:'))
    return `颜色包含无效通道值：${message.slice('Color contains non-finite channels:'.length).trim()}`;
  if (message.startsWith('steps must be an integer between'))
    return message.replace('steps must be an integer between', '色阶数必须是以下范围内的整数：');
  if (
    message ===
    'Semantic themes require at least 10 brand scale steps so interactive roles remain distinct.'
  )
    return '语义主题至少需要 10 阶品牌色，以区分不同交互角色。';
  if (message === 'black-white endpoints require an interior fixed anchor.')
    return '使用纯白／纯黑端点时，固定锚点必须位于色阶内部。';
  if (message === 'Neutral steps must be either 10 or 14.') return '中性色阶数只能为 10 或 14。';
  if (message.startsWith('anchorIndex must be a zero-based index between'))
    return message.replace(
      'anchorIndex must be a zero-based index between',
      '锚点索引必须是以下范围内从 0 开始的整数：',
    );
  if (message === 'anchorIndex can only be used with the fixed-anchor strategy.')
    return '只有固定锚点策略可以设置 anchorIndex。';
  if (message === 'Contrast targets must be finite ratios between 1 and 21.')
    return '对比度目标必须是 1 到 21 之间的有限数值。';
  if (message === 'The generated theme does not satisfy all configured contrast targets.')
    return '生成的主题未能满足全部对比度目标。';
  return message;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        locale === 'zh-CN'
          ? 'OKRamp 交互式工作台：生成、比较并导出由 OKLCH 驱动的感知均匀色阶与语义主题。'
          : 'OKRamp interactive workspace for generating, comparing, and exporting perceptually uniform OKLCH color scales and semantic themes.',
      );
    try {
      localStorage.setItem('okramp-locale', locale);
    } catch {
      // Persistence is optional.
    }
  }, [locale]);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isZh: locale === 'zh-CN',
      setLocale,
      t: (zh, en, values) => interpolate(locale === 'zh-CN' ? zh : en, values),
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
