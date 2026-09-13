import { useEffect, useState } from 'react';
import { converter, formatHex, interpolate } from 'culori';
import { generate as generateAntColors } from '@ant-design/colors';
import { Color as TDesignColor } from 'tvision-color';
import { Alert, Card, Select, Table, Tag, Tooltip } from 'tdesign-react';
import { SearchIcon } from 'tdesign-icons-react';
import { chooseContrastingForeground, type ColorThemeResult } from 'okramp';
import { TOKEN_MAP, toTDesignTheme } from '../adapters/tdesign';
import { STRATEGIES, type Generated, type Settings } from '../model';
import { CopyButton, copyText } from './Scales';
import { AccessibleInput, Field, SeedColorControl } from './Controls';
import { readUrlParam, updateUrlParams } from '../url-state';
import { useI18n } from '../i18n';

type Translate = ReturnType<typeof useI18n>['t'];

function diagnosticTitle(code: string, t: Translate) {
  const titles: Record<string, string> = {
    ALPHA_IGNORED: t('已忽略透明度', 'Alpha ignored'),
    SEED_OUT_OF_GAMUT: t('输入色超出色域', 'Seed outside gamut'),
    SEED_TOO_LIGHT: t('输入色过浅', 'Seed is very light'),
    SEED_TOO_DARK: t('输入色过深', 'Seed is very dark'),
    SEED_LOW_CHROMA: t('输入色彩度较低', 'Seed has low chroma'),
    DUPLICATE_STOPS: t('相邻色阶重复', 'Duplicate adjacent stops'),
    LOW_ADJACENT_DIFFERENCE: t('相邻色阶差异较小', 'Small difference between adjacent stops'),
    GAMUT_MAPPED: t('已执行色域映射', 'Gamut mapping applied'),
    ANCHOR_MOVED: t('输入色锚点已移动', 'Seed anchor moved'),
    CONTRAST_TARGET_UNMET: t('对比度目标未达到', 'Contrast target not met'),
  };
  return titles[code] ?? code;
}

function diagnosticMessage(
  message: { code: string; message: string; details?: Record<string, unknown> },
  t: Translate,
) {
  const actualAnchorIndex = Number(message.details?.actualAnchorIndex);
  const failedChecks = Array.isArray(message.details?.checks) ? message.details.checks.length : 0;
  const messages: Record<string, string> = {
    ALPHA_IGNORED: t(
      '输入色的透明通道已忽略；生成结果均为不透明颜色。',
      'The input alpha channel was ignored; generated colors are opaque.',
    ),
    SEED_OUT_OF_GAMUT: t(
      '输入色已映射到 sRGB 色域内。',
      'The seed color was mapped into the sRGB gamut.',
    ),
    SEED_TOO_LIGHT: t(
      '输入色非常浅；均匀色阶或自动锚点通常能生成更实用的结果。',
      'The seed is very light; tonal or adaptive-anchor usually produces a more useful scale.',
    ),
    SEED_TOO_DARK: t(
      '输入色非常深；均匀色阶或自动锚点通常能生成更实用的结果。',
      'The seed is very dark; tonal or adaptive-anchor usually produces a more useful scale.',
    ),
    SEED_LOW_CHROMA: t(
      '输入色彩度很低，因此品牌色阶会接近中性色。',
      'The seed has little chroma, so the brand scale will be close to neutral.',
    ),
    DUPLICATE_STOPS: t(
      '输出量化后，部分相邻色阶变成了相同颜色。',
      'One or more adjacent stops become identical after output quantization.',
    ),
    GAMUT_MAPPED: t(
      '部分色阶通过降低 OKLCH 彩度映射到了 sRGB。',
      'Some stops required OKLCH chroma reduction to fit sRGB.',
    ),
    ANCHOR_MOVED: Number.isFinite(actualAnchorIndex)
      ? t(
          '为匹配输入色明度，已将输入色放在第 {stop} 阶。',
          'The seed was placed at stop {stop} to match its lightness.',
          { stop: actualAnchorIndex + 1 },
        )
      : message.message,
    CONTRAST_TARGET_UNMET: failedChecks
      ? t(
          '有 {count} 个主题对比度检查未达到目标。',
          '{count} theme contrast checks did not meet their target.',
          { count: failedChecks },
        )
      : message.message,
  };
  return messages[message.code] ?? message.message;
}

export function Tokens({ theme }: { theme: ColorThemeResult }) {
  const { t } = useI18n();
  const tokenLabels: Record<string, string> = {
    品牌主色: 'Brand default',
    品牌悬停: 'Brand hover',
    品牌按下: 'Brand active',
    品牌禁用: 'Brand disabled',
    品牌浅色背景: 'Brand subtle',
    品牌浅色悬停: 'Brand subtle hover',
    品牌文字: 'Brand text',
    品牌焦点浅底: 'Brand focus',
    品牌上的文字: 'Text on brand',
    页面背景: 'Page background',
    容器背景: 'Container background',
    容器悬停背景: 'Container hover',
    禁用背景: 'Disabled background',
    一级文字: 'Primary text',
    二级文字: 'Secondary text',
    占位文字: 'Placeholder text',
    禁用文字: 'Disabled text',
    默认边框: 'Default border',
    弱边框: 'Subtle border',
    强边框: 'Strong border',
  };
  const localizedTokenLabel = (label: string) => tokenLabels[label] ?? label;
  const [query, setQuery] = useState(() => readUrlParam('tokenQuery', ''));
  const [group, setGroup] = useState(() => readUrlParam('tokenGroup', 'all'));
  useEffect(() => {
    const syncFromUrl = () => {
      setQuery(readUrlParam('tokenQuery', ''));
      setGroup(readUrlParam('tokenGroup', 'all'));
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);
  const values = {
    light: toTDesignTheme(theme.themes.light!, theme.scales.neutral),
    dark: toTDesignTheme(theme.themes.dark!, theme.scales.neutral),
  };
  const source = (value: string) => {
    for (const [group, scale] of [
      ['brand', theme.scales.brand],
      ['neutral', theme.scales.neutral],
    ] as const) {
      const stop = scale.stops.find((s) => formatHex(s.color) === formatHex(value));
      if (stop) return `var(--color-${group}-${stop.label})`;
    }
    if (formatHex(value) === '#ffffff') return 'var(--color-white)';
    if (formatHex(value) === '#000000') return 'var(--color-black)';
    return t('独立调整色', 'Independently adjusted');
  };
  const rows = Object.keys(values.light)
    .map((token) => {
      const entry = TOKEN_MAP.find(([, , key]) => key === token);
      return {
        label: entry?.[0]
          ? t(entry[0], localizedTokenLabel(entry[0]))
          : t('TDesign 状态色', 'TDesign state color'),
        path:
          entry?.[1] ??
          (token.includes('bg-color')
            ? 'background'
            : token.includes('text-color')
              ? 'text'
              : 'border'),
        token,
        light: values.light[token]!,
        dark: values.dark[token]!,
      };
    })
    .filter(
      (row) =>
        `${row.label} ${row.path} ${row.token}`.toLowerCase().includes(query.toLowerCase()) &&
        (group === 'all' || row.path.startsWith(group)),
    );
  return (
    <Card bordered={false}>
      <div className="section-heading">
        <div>
          <h3>{t('语义 Token 映射', 'Semantic token mapping')}</h3>
          <p>
            {t(
              '基础色阶 → 语义变量 → 组件状态；展示全部适配变量及其来源。',
              'Base scales → semantic variables → component states, with every mapped variable and its source.',
            )}
          </p>
        </div>
        <Tag theme="primary" variant="light">
          {t('{count} 个主题变量', '{count} theme variables', {
            count: Object.keys(toTDesignTheme(theme.themes.light!, theme.scales.neutral)).length,
          })}
        </Tag>
      </div>
      <div className="table-toolbar">
        <AccessibleInput
          aria-label={t('搜索 Token', 'Search tokens')}
          name="token-search"
          prefixIcon={<SearchIcon aria-hidden="true" />}
          placeholder={t('例如：--td-brand-color…', 'e.g. --td-brand-color…')}
          value={query}
          onChange={(value) => {
            setQuery(value);
            updateUrlParams({ tokenQuery: value || null }, 'replace');
          }}
          autocomplete="off"
          spellCheck={false}
          clearable
        />
        <Select
          aria-label={t('Token 分组', 'Token group')}
          value={group}
          onChange={(v) => {
            const value = typeof v === 'string' ? v : 'all';
            setGroup(value);
            updateUrlParams({ tokenGroup: value === 'all' ? null : value }, 'replace');
          }}
          options={[
            { label: t('全部分组', 'All groups'), value: 'all' },
            { label: t('品牌', 'Brand'), value: 'brand' },
            { label: t('背景', 'Background'), value: 'background' },
            { label: t('文字', 'Text'), value: 'text' },
            { label: t('边框', 'Border'), value: 'border' },
          ]}
        />
      </div>
      <div className="table-scroll">
        <Table
          rowKey="token"
          data={rows}
          size="medium"
          columns={[
            {
              colKey: 'label',
              title: t('用途 / 核心 Token', 'Purpose / core token'),
              width: 155,
              cell: ({ row }) => (
                <div className="token-name">
                  {row.label}
                  <code>
                    {row.path.startsWith('border.')
                      ? t('中性色阶 · TDesign 层级', 'Neutral scale · TDesign level')
                      : row.path}
                  </code>
                </div>
              ),
            },
            {
              colKey: 'token',
              title: 'TDesign Token',
              width: 245,
              cell: ({ row }) => <code>{row.token}</code>,
            },
            ...(['light', 'dark'] as const).map((mode) => ({
              colKey: mode,
              title: mode === 'light' ? t('浅色', 'Light') : t('深色', 'Dark'),
              width: 142,
              cell: ({ row }: { row: (typeof rows)[number] }) => (
                <span className="token-value">
                  <i style={{ background: row[mode] }} />
                  <span>
                    <code>{row[mode]}</code>
                    <small className="token-source">{source(row[mode])}</small>
                  </span>
                  <CopyButton
                    value={row[mode]}
                    label={t('复制 {token} {mode}', 'Copy {token} {mode}', {
                      token: row.token,
                      mode,
                    })}
                  />
                </span>
              ),
            })),
          ]}
        />
      </div>
      <div className="token-footnote">
        <Tag size="small" theme="success" variant="light">
          {t('已映射', 'Mapped')}
        </Tag>
        <span>
          {t(
            '上表展示直接语义映射。其他背景状态由适配器派生；成功、警告、错误色沿用官方值。',
            'The table shows direct semantic mappings. Other surface states are derived by the adapter; status colors retain official defaults.',
          )}
        </span>
      </div>
    </Card>
  );
}
export function Diagnostics({ result }: { result: Generated }) {
  const { t } = useI18n();
  const messages = [
    ...result.scale.diagnostics.messages,
    ...result.neutral.diagnostics.messages,
    ...(result.theme?.diagnostics.messages ?? []),
  ].filter(
    (item, index, all) =>
      all.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)) === index,
  );
  const checks = result.theme?.diagnostics.contrastChecks ?? [];
  const failed = checks.filter((check) => !check.passes).length;
  return (
    <div className="stack">
      <Alert
        theme={failed ? 'warning' : 'success'}
        title={
          checks.length
            ? t(
                '{passed} / {total} 个颜色组合达到目标',
                '{passed} / {total} color pairs meet the target',
                { passed: checks.length - failed, total: checks.length },
              )
            : t('当前为色阶模式', 'Scale-only mode')
        }
        message={t(
          '以下检查针对通用引擎语义。TDesign 适配会重新分配背景与边框层级，这些结果不代表组件预览已全部通过对比度检查。',
          'These checks cover the generic engine semantics. The TDesign adapter remaps surface and border levels, so this is not a complete accessibility audit of the preview.',
        )}
      />
      <Card bordered={false}>
        <div className="section-heading">
          <div>
            <h3>{t('对比度检查', 'Contrast checks')}</h3>
            <p>
              {t('普通文本目标', 'Body text')} {result.settings.normalText}:1 ·{' '}
              {t('非文本目标', 'Non-text')} {result.settings.nonText}:1
            </p>
          </div>
        </div>
        <div className="table-scroll">
          <Table
            rowKey="id"
            data={checks.map((check, index) => ({
              ...check,
              id: index,
              // The core appends light checks first, then dark checks; this app always generates both.
              mode: index < checks.length / 2 ? t('浅色', 'Light') : t('深色', 'Dark'),
            }))}
            columns={[
              { colKey: 'mode', title: t('主题', 'Theme'), width: 65 },
              { colKey: 'foregroundRole', title: t('前景角色', 'Foreground role'), width: 180 },
              { colKey: 'backgroundRole', title: t('背景角色', 'Background role'), width: 190 },
              {
                colKey: 'ratio',
                title: t('实际对比度', 'Actual contrast'),
                width: 110,
                cell: ({ row }) => <code>{row.ratio.toFixed(2)}:1</code>,
              },
              {
                colKey: 'target',
                title: t('目标', 'Target'),
                width: 70,
                cell: ({ row }) => `${row.target}:1`,
              },
              {
                colKey: 'passes',
                title: t('结果', 'Result'),
                width: 80,
                cell: ({ row }) => (
                  <Tag size="small" theme={row.passes ? 'success' : 'warning'} variant="light">
                    {row.passes ? t('通过', 'Pass') : t('未达标', 'Fail')}
                  </Tag>
                ),
              },
            ]}
          />
        </div>
      </Card>
      <Card bordered={false} title={t('生成诊断', 'Generation diagnostics')}>
        <div className="diagnostic-list">
          {messages.length ? (
            messages.map((message, index) => (
              <Alert
                key={`${message.code}-${index}`}
                theme={
                  message.severity === 'error'
                    ? 'error'
                    : message.severity === 'warning'
                      ? 'warning'
                      : 'info'
                }
                title={diagnosticTitle(message.code, t)}
                message={
                  <div>
                    {message.code === 'LOW_ADJACENT_DIFFERENCE' ? (
                      <>
                        <p>
                          {message.details?.scale === 'neutral'
                            ? t(
                                '中性色的细微差异可用于背景层次，此提示不代表生成失败。',
                                'Subtle neutral differences can support surface hierarchy. This does not mean generation failed.',
                              )
                            : t(
                                '品牌色阶部分颜色较接近，可尝试减少阶数或调整锚点。',
                                'Some brand stops are close. Try fewer stops or a different anchor.',
                              )}
                        </p>
                        {Array.isArray(message.details?.pairs) &&
                          message.details.pairs.map(
                            (pair: { from: number; to: number; distance: number }) => (
                              <p key={`${pair.from}-${pair.to}`}>
                                {t(
                                  '{kind}第 {from}–{to} 阶：OKLab 色差 {distance}（提示阈值 {threshold}）',
                                  '{kind} stops {from}–{to}: OKLab distance {distance} (notice threshold {threshold})',
                                  {
                                    kind:
                                      message.details?.scale === 'neutral'
                                        ? t('中性色', 'Neutral')
                                        : t('品牌色', 'Brand'),
                                    from: pair.from + 1,
                                    to: pair.to + 1,
                                    distance: pair.distance.toFixed(4),
                                    threshold: String(message.details?.threshold),
                                  },
                                )}
                              </p>
                            ),
                          )}
                      </>
                    ) : (
                      diagnosticMessage(message, t)
                    )}
                    {message.details && message.code !== 'LOW_ADJACENT_DIFFERENCE' && (
                      <pre className="diagnostic-details">
                        {JSON.stringify(message.details, null, 2)}
                      </pre>
                    )}
                  </div>
                }
              />
            ))
          ) : (
            <p className="muted">
              {t(
                '当前配置没有产生额外诊断。',
                'The current settings produced no additional diagnostics.',
              )}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
function interpolatedScale(seed: string, mode: 'hsl' | 'rgb' | 'lab', steps: number) {
  const anchor = Math.min(6, steps - 2);
  const light = interpolate(['#ffffff', seed], mode);
  const dark = interpolate([seed, '#000000'], mode);
  return Array.from({ length: steps }, (_, index) => {
    const color =
      index <= anchor
        ? light(anchor === 0 ? 1 : index / anchor)
        : dark((index - anchor) / Math.max(1, steps - 1 - anchor));
    return formatHex(color) ?? seed;
  });
}

function ComparisonRamp({
  colors,
  anchor,
  recommended,
  columns,
  seed,
}: {
  colors: string[];
  anchor?: number;
  recommended?: number;
  columns: number;
  seed: string;
}) {
  const { t } = useI18n();
  const toOklch = converter('oklch');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  return (
    <div
      className="comparison-ramp"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(28px, 1fr))` }}
    >
      {colors.map((color, index) => {
        const isAnchor = index === anchor;
        const isRecommended = index === recommended;
        const retained = formatHex(color) === formatHex(seed);
        const details = `${formatHex(color)} · OKLCH L ${toOklch(color)!.l.toFixed(3)} · ${retained ? t('与输入色一致', 'Matches seed') : t('与输入色不同', 'Differs from seed')}${isAnchor ? ` · ${t('A 输入色锚点', 'A seed anchor')}` : ''}${isRecommended ? ` · ${t('R 推荐主色', 'R recommended color')}` : ''}`;
        return (
          <Tooltip
            key={`${color}-${index}`}
            content={details}
            trigger="hover"
            visible={focusedIndex === index ? true : undefined}
          >
            <button
              type="button"
              style={{ background: color, color: chooseContrastingForeground(color) }}
              aria-label={t('复制第 {index} 阶：{details}', 'Copy stop {index}: {details}', {
                index: index + 1,
                details,
              })}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              onClick={() => void copyText(color)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {(isAnchor || isRecommended) && <strong>{isAnchor ? 'A' : 'R'}</strong>}
            </button>
          </Tooltip>
        );
      })}
      {Array.from({ length: columns - colors.length }, (_, index) => (
        <span
          key={`empty-${index}`}
          className="comparison-empty"
          aria-label={t('无此阶颜色', 'No color at this stop')}
        >
          —
        </span>
      ))}
    </div>
  );
}

export function Comparison({
  result,
  settings,
  onChange,
  error,
}: {
  result: Pick<Generated, 'scale' | 'settings'>;
  settings: Settings;
  onChange: (settings: Settings) => void;
  error: string;
}) {
  const { t } = useI18n();
  const steps = result.scale.colors.length;
  const seed = result.settings.seed;
  // Official generators accept sRGB input; normalize OKLCH and other CSS formats first.
  const officialSeed = formatHex(seed)!;
  const tdesign = TDesignColor.getColorGradations({ colors: [officialSeed], step: steps })[0]!;
  const antColors = generateAntColors(officialSeed);
  const columns = Math.max(steps, antColors.length);
  const methods = [
    {
      id: 'okramp',
      label: 'OKRamp',
      space: 'OKLCH',
      description: t(
        '以感知明度和色度为核心生成，并对超出 sRGB 的颜色执行色域映射。',
        'Generates with perceptual lightness and chroma, mapping out-of-gamut colors into sRGB.',
      ),
      colors: result.scale.colors,
      anchor: result.scale.anchorIndex ?? undefined,
      recommended: result.scale.recommendedIndex,
      lightness: t('感知均匀曲线', 'Perceptual curve'),
      hue: t('尽量保持稳定', 'Kept stable where possible'),
      endpoints:
        result.settings.endpoints === 'black-white'
          ? t('纯白 / 纯黑', 'White / black')
          : t('曲线端点', 'Curve endpoints'),
      primary: true,
    },
    {
      id: 'tdesign',
      label: 'TDesign',
      space: 'HCT',
      description: t(
        '使用官方主题生成器依赖的 tvision-color，根据色相分段调整 Tone 曲线与色度。',
        'Uses tvision-color, the official theme generator dependency, with hue-aware tone and chroma curves.',
      ),
      colors: tdesign.colors,
      anchor: tdesign.colors.findIndex((color) => formatHex(color) === officialSeed),
      recommended: tdesign.primary,
      lightness: t('Tone 贝塞尔曲线', 'Tone Bézier curve'),
      hue: t('HCT 色相控制', 'HCT hue control'),
      endpoints: t('按色相设定范围', 'Hue-dependent range'),
      gamut: t('HCT 求解至 sRGB', 'HCT solved to sRGB'),
      source: 'https://www.npmjs.com/package/tvision-color',
      sourceLabel: 'tvision-color 1.6.0',
    },
    {
      id: 'ant-design',
      label: 'Ant Design',
      space: 'HSV',
      description: t(
        '使用官方 @ant-design/colors 浅色色板算法，固定生成 10 阶，输入主色位于第 6 阶。',
        'Uses the official @ant-design/colors light palette algorithm: 10 fixed stops with the seed at stop 6.',
      ),
      colors: antColors,
      anchor: 5,
      lightness: t('HSV Value 步进', 'HSV value steps'),
      hue: t('按方向偏移色相', 'Directional hue shifts'),
      endpoints: t('5 阶浅色 / 4 阶深色', '5 lighter / 4 darker'),
      gamut: t('HSV 通道边界约束', 'HSV channel bounds'),
      source: 'https://github.com/ant-design/ant-design-colors',
      sourceLabel: '@ant-design/colors 8.0.1',
    },
    {
      id: 'hsl',
      label: t('HSL 插值', 'HSL interpolation'),
      space: 'HSL',
      description: t(
        '分别插值色相、饱和度与亮度，计算直观，但数值亮度不等于视觉亮度。',
        'Interpolates hue, saturation, and lightness directly; numeric lightness does not equal perceived lightness.',
      ),
      colors: interpolatedScale(seed, 'hsl', steps),
      anchor: Math.min(6, steps - 2),
      lightness: 'HSL Lightness',
      hue: t('固定 H 通道', 'Fixed H channel'),
      endpoints: t('白色 / 黑色', 'White / black'),
    },
    {
      id: 'rgb',
      label: t('sRGB 插值', 'sRGB interpolation'),
      space: 'RGB',
      description: t(
        '直接对红、绿、蓝通道插值，实现简单，过渡中容易出现明度不均。',
        'Interpolates red, green, and blue channels directly; transitions often have uneven perceived lightness.',
      ),
      colors: interpolatedScale(seed, 'rgb', steps),
      anchor: Math.min(6, steps - 2),
      lightness: t('通道线性变化', 'Linear channel changes'),
      hue: t('可能发生偏移', 'May shift'),
      endpoints: t('白色 / 黑色', 'White / black'),
    },
    {
      id: 'lab',
      label: t('CIELAB 插值', 'CIELAB interpolation'),
      space: 'Lab',
      description: t(
        '在笛卡尔感知空间中插值，亮度较平滑，但色相和色度控制不够直接。',
        'Interpolates in a Cartesian perceptual space; lightness is smoother but hue and chroma are less direct.',
      ),
      colors: interpolatedScale(seed, 'lab', steps),
      anchor: Math.min(6, steps - 2),
      lightness: t('感知明度插值', 'Perceptual lightness'),
      hue: t('可能沿直线漂移', 'May drift along the path'),
      endpoints: t('白色 / 黑色', 'White / black'),
    },
  ];
  return (
    <div className="stack">
      <Alert
        theme="info"
        message={t(
          '各方案使用同一输入主色，固定生成 10 阶。策略与锚点仅影响 OKRamp；按阶号对齐不代表相同感知明度。A 表示输入色锚点，R 表示推荐主色；重合时显示 A。悬停或聚焦查看颜色明度，点击复制。',
          'All methods use the same seed and 10 stops. Strategy and anchor affect OKRamp only. Matching stop numbers do not imply equal perceived lightness. A marks the seed anchor and R the recommended color; A wins when they overlap. Hover or focus for details, and click to copy.',
        )}
      />
      <Card bordered={false} className="comparison-controls">
        <SeedColorControl
          settings={settings}
          onChange={onChange}
          error={error}
          inputId="comparison-seed"
          inline
        />
      </Card>
      <div className="comparison-grid">
        {methods.map((method) => (
          <Card key={method.id} bordered={false} className="comparison-card">
            <div className="comparison-title">
              <div>
                <h3>{method.label}</h3>
                <Tag size="small" theme={method.primary ? 'primary' : 'default'} variant="light">
                  {method.space}
                </Tag>
              </div>
              <p>{method.description}</p>
              {method.primary && (
                <section
                  className="comparison-strategy"
                  aria-label={t('OKRamp 配置', 'OKRamp settings')}
                >
                  <Field label={t('生成策略', 'Strategy')}>
                    <Select
                      aria-label={t('OKRamp 生成策略', 'OKRamp strategy')}
                      value={settings.strategy}
                      options={STRATEGIES.map(({ value }) => ({
                        value,
                        label:
                          value === 'tonal'
                            ? t('均匀色阶', 'Tonal')
                            : value === 'adaptive-anchor'
                              ? t('保留主色 · 自动定位', 'Preserve seed · Auto')
                              : t('保留主色 · 固定阶位', 'Preserve seed · Fixed'),
                      }))}
                      onChange={(value) =>
                        onChange({ ...settings, strategy: value as Settings['strategy'] })
                      }
                    />
                  </Field>
                  {settings.strategy === 'fixed-anchor' && (
                    <Field label={t('输入色锚点', 'Seed anchor')}>
                      <Select
                        aria-label={t('OKRamp 输入色锚点', 'OKRamp seed anchor')}
                        value={settings.anchorIndex}
                        options={Array.from({ length: 10 }, (_, index) => ({
                          value: index,
                          label: t('第 {index} 阶', 'Stop {index}', { index: index + 1 }),
                        }))}
                        onChange={(value) => onChange({ ...settings, anchorIndex: Number(value) })}
                      />
                    </Field>
                  )}
                </section>
              )}
              {method.source && (
                <a
                  className="comparison-source"
                  href={method.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  {method.sourceLabel}
                </a>
              )}
            </div>
            <div className="comparison-content">
              <ComparisonRamp
                colors={method.colors}
                anchor={method.anchor}
                recommended={method.recommended}
                columns={columns}
                seed={seed}
              />
              <div className="comparison-scale-labels">
                <span>{t('浅色端', 'Light end')}</span>
                <span>
                  {t('{count} 阶 · A 输入色 / R 推荐色', '{count} stops · A seed / R recommended', {
                    count: method.colors.length,
                  })}
                </span>
                <span>{t('深色端', 'Dark end')}</span>
              </div>
            </div>
            <div className="comparison-facts">
              <div>
                <span>{t('亮度方式', 'Lightness')}</span>
                <strong>{method.lightness}</strong>
              </div>
              <div>
                <span>{t('色相表现', 'Hue')}</span>
                <strong>{method.hue}</strong>
              </div>
              <div>
                <span>{t('端点方式', 'Endpoints')}</span>
                <strong>{method.endpoints}</strong>
              </div>
              <div>
                <span>{t('色域处理', 'Gamut')}</span>
                <strong>
                  {method.gamut ??
                    (method.primary
                      ? t('映射至 sRGB', 'Mapped to sRGB')
                      : t('HEX 输出裁剪至 sRGB', 'HEX output clamped to sRGB'))}
                </strong>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
export { Guide } from './Guide';
