import { useEffect, useState } from 'react';
import { converter, formatHex, interpolate } from 'culori';
import { generate as generateAntColors } from '@ant-design/colors';
import { Color as TDesignColor } from 'tvision-color';
import { Alert, Card, Select, Table, Tag, Tooltip } from 'tdesign-react';
import { SearchIcon } from 'tdesign-icons-react';
import { chooseContrastingForeground, type ColorThemeResult } from 'oklch-ramp';
import { TOKEN_MAP, toTDesignTheme } from '../adapters/tdesign';
import { STRATEGIES, type Generated, type Settings } from '../model';
import { CopyButton, copyText } from './Scales';
import { AccessibleInput, Field, SeedColorControl } from './Controls';
import { readUrlParam, updateUrlParams } from '../url-state';
export function Tokens({ theme }: { theme: ColorThemeResult }) {
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
    return '独立调整色';
  };
  const rows = Object.keys(values.light)
    .map((token) => {
      const entry = TOKEN_MAP.find(([, , key]) => key === token);
      return {
        label: entry?.[0] ?? 'TDesign 状态色',
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
          <h3>语义 Token 映射</h3>
          <p>基础色阶 → 语义变量 → 组件状态；展示全部适配变量及其来源。</p>
        </div>
        <Tag theme="primary" variant="light">
          {Object.keys(toTDesignTheme(theme.themes.light!, theme.scales.neutral)).length} 个主题变量
        </Tag>
      </div>
      <div className="table-toolbar">
        <AccessibleInput
          aria-label="搜索 Token"
          name="token-search"
          prefixIcon={<SearchIcon aria-hidden="true" />}
          placeholder="例如：--td-brand-color…"
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
          aria-label="Token 分组"
          value={group}
          onChange={(v) => {
            const value = typeof v === 'string' ? v : 'all';
            setGroup(value);
            updateUrlParams({ tokenGroup: value === 'all' ? null : value }, 'replace');
          }}
          options={[
            { label: '全部分组', value: 'all' },
            { label: '品牌', value: 'brand' },
            { label: '背景', value: 'background' },
            { label: '文字', value: 'text' },
            { label: '边框', value: 'border' },
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
              title: '用途 / 核心 Token',
              width: 155,
              cell: ({ row }) => (
                <div className="token-name">
                  {row.label}
                  <code>
                    {row.path.startsWith('border.') ? '中性色阶 · TDesign 层级' : row.path}
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
              title: mode === 'light' ? '浅色' : '深色',
              width: 142,
              cell: ({ row }: { row: (typeof rows)[number] }) => (
                <span className="token-value">
                  <i style={{ background: row[mode] }} />
                  <span>
                    <code>{row[mode]}</code>
                    <small className="token-source">{source(row[mode])}</small>
                  </span>
                  <CopyButton value={row[mode]} label={`复制 ${row.token} ${mode}`} />
                </span>
              ),
            })),
          ]}
        />
      </div>
      <div className="token-footnote">
        <Tag size="small" theme="success" variant="light">
          已映射
        </Tag>
        <span>上表展示直接语义映射。其他背景状态由适配器派生；成功、警告、错误色沿用官方值。</span>
      </div>
    </Card>
  );
}
export function Diagnostics({ result }: { result: Generated }) {
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
            ? `${checks.length - failed} / ${checks.length} 个颜色组合达到目标`
            : '当前为色阶模式'
        }
        message="以下检查针对通用引擎语义。TDesign 适配会重新分配背景与边框层级，这些结果不代表组件预览已全部通过对比度检查。"
      />
      <Card bordered={false}>
        <div className="section-heading">
          <div>
            <h3>对比度检查</h3>
            <p>
              普通文本目标 {result.settings.normalText}:1 · 非文本目标 {result.settings.nonText}:1
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
              mode: index < checks.length / 2 ? '浅色' : '深色',
            }))}
            columns={[
              { colKey: 'mode', title: '主题', width: 65 },
              { colKey: 'foregroundRole', title: '前景角色', width: 180 },
              { colKey: 'backgroundRole', title: '背景角色', width: 190 },
              {
                colKey: 'ratio',
                title: '实际对比度',
                width: 110,
                cell: ({ row }) => <code>{row.ratio.toFixed(2)}:1</code>,
              },
              { colKey: 'target', title: '目标', width: 70, cell: ({ row }) => `${row.target}:1` },
              {
                colKey: 'passes',
                title: '结果',
                width: 80,
                cell: ({ row }) => (
                  <Tag size="small" theme={row.passes ? 'success' : 'warning'} variant="light">
                    {row.passes ? '通过' : '未达标'}
                  </Tag>
                ),
              },
            ]}
          />
        </div>
      </Card>
      <Card bordered={false} title="生成诊断">
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
                title={
                  message.code === 'LOW_ADJACENT_DIFFERENCE' ? '相邻色阶差异较小' : message.code
                }
                message={
                  <div>
                    {message.code === 'LOW_ADJACENT_DIFFERENCE' ? (
                      <>
                        <p>
                          {message.details?.scale === 'neutral'
                            ? '中性色的细微差异可用于背景层次，此提示不代表生成失败。'
                            : '品牌色阶部分颜色较接近，可尝试减少阶数或调整锚点。'}
                        </p>
                        {Array.isArray(message.details?.pairs) &&
                          message.details.pairs.map(
                            (pair: { from: number; to: number; distance: number }) => (
                              <p key={`${pair.from}-${pair.to}`}>
                                {message.details?.scale === 'neutral' ? '中性色' : '品牌色'}第{' '}
                                {pair.from + 1}–{pair.to + 1} 阶： OKLab 色差{' '}
                                {pair.distance.toFixed(4)}（提示阈值{' '}
                                {String(message.details?.threshold)}）
                              </p>
                            ),
                          )}
                      </>
                    ) : (
                      message.message
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
            <p className="muted">当前配置没有产生额外诊断。</p>
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
  const toOklch = converter('oklch');
  return (
    <div
      className="comparison-ramp"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(28px, 1fr))` }}
    >
      {colors.map((color, index) => {
        const isAnchor = index === anchor;
        const isRecommended = index === recommended;
        const retained = formatHex(color) === formatHex(seed);
        const details = `${formatHex(color)} · OKLCH L ${toOklch(color)!.l.toFixed(3)} · ${retained ? '与输入色一致' : '与输入色不同'}${isAnchor ? ' · A 输入色锚点' : ''}${isRecommended ? ' · R 推荐主色' : ''}`;
        return (
          <Tooltip key={`${color}-${index}`} content={details} trigger={['hover', 'focus']}>
            <button
              type="button"
              style={{ background: color, color: chooseContrastingForeground(color) }}
              aria-label={`复制第 ${index + 1} 阶：${details}`}
              onClick={() => void copyText(color)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {(isAnchor || isRecommended) && <strong>{isAnchor ? 'A' : 'R'}</strong>}
            </button>
          </Tooltip>
        );
      })}
      {Array.from({ length: columns - colors.length }, (_, index) => (
        <span key={`empty-${index}`} className="comparison-empty" aria-label="无此阶颜色">
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
      description: '以感知明度和色度为核心生成，并对超出 sRGB 的颜色执行色域映射。',
      colors: result.scale.colors,
      anchor: result.scale.anchorIndex ?? undefined,
      recommended: result.scale.recommendedIndex,
      lightness: '感知均匀曲线',
      hue: '尽量保持稳定',
      endpoints: result.settings.endpoints === 'black-white' ? '纯白 / 纯黑' : '曲线端点',
      primary: true,
    },
    {
      id: 'tdesign',
      label: 'TDesign',
      space: 'HCT',
      description: '使用官方主题生成器依赖的 tvision-color，根据色相分段调整 Tone 曲线与色度。',
      colors: tdesign.colors,
      anchor: tdesign.colors.findIndex((color) => formatHex(color) === officialSeed),
      recommended: tdesign.primary,
      lightness: 'Tone 贝塞尔曲线',
      hue: 'HCT 色相控制',
      endpoints: '按色相设定范围',
      gamut: 'HCT 求解至 sRGB',
      source: 'https://www.npmjs.com/package/tvision-color',
      sourceLabel: 'tvision-color 1.6.0',
    },
    {
      id: 'ant-design',
      label: 'Ant Design',
      space: 'HSV',
      description:
        '使用官方 @ant-design/colors 浅色色板算法，固定生成 10 阶，输入主色位于第 6 阶。',
      colors: antColors,
      anchor: 5,
      lightness: 'HSV Value 步进',
      hue: '按方向偏移色相',
      endpoints: '5 阶浅色 / 4 阶深色',
      gamut: 'HSV 通道边界约束',
      source: 'https://github.com/ant-design/ant-design-colors',
      sourceLabel: '@ant-design/colors 8.0.1',
    },
    {
      id: 'hsl',
      label: 'HSL 插值',
      space: 'HSL',
      description: '分别插值色相、饱和度与亮度，计算直观，但数值亮度不等于视觉亮度。',
      colors: interpolatedScale(seed, 'hsl', steps),
      anchor: Math.min(6, steps - 2),
      lightness: 'HSL Lightness',
      hue: '固定 H 通道',
      endpoints: '白色 / 黑色',
    },
    {
      id: 'rgb',
      label: 'sRGB 插值',
      space: 'RGB',
      description: '直接对红、绿、蓝通道插值，实现简单，过渡中容易出现明度不均。',
      colors: interpolatedScale(seed, 'rgb', steps),
      anchor: Math.min(6, steps - 2),
      lightness: '通道线性变化',
      hue: '可能发生偏移',
      endpoints: '白色 / 黑色',
    },
    {
      id: 'lab',
      label: 'CIELAB 插值',
      space: 'Lab',
      description: '在笛卡尔感知空间中插值，亮度较平滑，但色相和色度控制不够直接。',
      colors: interpolatedScale(seed, 'lab', steps),
      anchor: Math.min(6, steps - 2),
      lightness: '感知明度插值',
      hue: '可能沿直线漂移',
      endpoints: '白色 / 黑色',
    },
  ];
  return (
    <div className="stack">
      <Alert
        theme="info"
        message="各方案使用同一输入主色，固定生成 10 阶。策略与锚点仅影响 OKRamp；按阶号对齐不代表相同感知明度。A 表示输入色锚点，R 表示推荐主色；重合时显示 A。悬停或聚焦查看颜色明度，点击复制。"
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
                <section className="comparison-strategy" aria-label="OKRamp 配置">
                  <Field label="生成策略">
                    <Select
                      aria-label="OKRamp 生成策略"
                      value={settings.strategy}
                      options={STRATEGIES.map(({ value, label }) => ({ value, label }))}
                      onChange={(value) =>
                        onChange({ ...settings, strategy: value as Settings['strategy'] })
                      }
                    />
                  </Field>
                  {settings.strategy === 'fixed-anchor' && (
                    <Field label="输入色锚点">
                      <Select
                        aria-label="OKRamp 输入色锚点"
                        value={settings.anchorIndex}
                        options={Array.from({ length: 10 }, (_, index) => ({
                          value: index,
                          label: `第 ${index + 1} 阶`,
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
                <span>浅色端</span>
                <span>{method.colors.length} 阶 · A 输入色 / R 推荐色</span>
                <span>深色端</span>
              </div>
            </div>
            <div className="comparison-facts">
              <div>
                <span>亮度方式</span>
                <strong>{method.lightness}</strong>
              </div>
              <div>
                <span>色相表现</span>
                <strong>{method.hue}</strong>
              </div>
              <div>
                <span>端点方式</span>
                <strong>{method.endpoints}</strong>
              </div>
              <div>
                <span>色域处理</span>
                <strong>
                  {method.gamut ?? (method.primary ? '映射至 sRGB' : 'HEX 输出裁剪至 sRGB')}
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
