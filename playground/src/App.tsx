import {
  ArrowRight,
  BracketsCurly,
  Check,
  CheckCircle,
  Clipboard,
  Code,
  Copy,
  DownloadSimple,
  Info,
  Palette,
  SlidersHorizontal,
  Sparkle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import {
  chooseContrastingForeground,
  generateColorScale,
  generateColorTheme,
  generateNeutralScale,
  type ColorOutputFormat,
  type ColorScaleResult,
  type ColorStop,
  type ColorThemeResult,
  type ContrastPolicy,
  type DiagnosticMessage,
  type ScaleStrategy,
  type SemanticTheme,
  type ThemeMode,
} from 'color-scale-engine';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type View = 'scale' | 'theme' | 'tokens' | 'compare';
type UiMode = 'light' | 'dark';
type ExportFormat = 'css' | 'json' | 'typescript';

const PRESETS = ['#0052D9', '#E34D59', '#00A870', '#ED7B2F', '#8B5CF6', '#D54941'];
const STRATEGIES: Array<{ value: ScaleStrategy; label: string; hint: string }> = [
  { value: 'tonal', label: 'Tonal', hint: '重建均匀明度曲线' },
  { value: 'adaptive-anchor', label: 'Adaptive', hint: '自动寻找种子色位置' },
  { value: 'fixed-anchor', label: 'Fixed', hint: '固定种子色所在阶位' },
];
const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'scale', label: '色阶' },
  { value: 'theme', label: '主题' },
  { value: 'tokens', label: 'Tokens' },
  { value: 'compare', label: '策略对比' },
];

function flattenTheme(theme: SemanticTheme): Array<[string, string]> {
  return [
    ...Object.entries(theme.color.brand).map(
      ([key, value]) => [`brand.${key}`, String(value)] as [string, string],
    ),
    ...Object.entries(theme.color.background).map(
      ([key, value]) => [`background.${key}`, value] as [string, string],
    ),
    ...Object.entries(theme.color.text).map(
      ([key, value]) => [`text.${key}`, value] as [string, string],
    ),
    ...Object.entries(theme.color.border).map(
      ([key, value]) => [`border.${key}`, value] as [string, string],
    ),
  ];
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replaceAll('.', '-');
}

function makeExport(
  format: ExportFormat,
  brand: ColorScaleResult,
  neutral: ColorScaleResult,
  theme: SemanticTheme | undefined,
): string {
  const semantic = theme === undefined ? [] : flattenTheme(theme);

  if (format === 'json') {
    return JSON.stringify(
      {
        brand: Object.fromEntries(brand.stops.map((stop) => [stop.label, stop.color])),
        neutral: Object.fromEntries(neutral.stops.map((stop) => [stop.label, stop.color])),
        semantic: Object.fromEntries(semantic),
      },
      null,
      2,
    );
  }

  const lines = [
    ...brand.stops.map((stop) => `  --color-brand-${stop.label}: ${stop.color};`),
    ...neutral.stops.map((stop) => `  --color-neutral-${stop.label}: ${stop.color};`),
    ...semantic.map(([token, color]) => `  --color-${toKebabCase(token)}: ${color};`),
  ];

  if (format === 'css') return `:root {\n${lines.join('\n')}\n}`;

  return `export const colors = ${JSON.stringify(
    {
      brand: brand.colors,
      neutral: neutral.colors,
      semantic: Object.fromEntries(semantic),
    },
    null,
    2,
  )} as const;`;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {hint === undefined ? null : <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <Field label={label} hint={`${value}${suffix ?? ''}`}>
      <input
        className="range"
        style={{ '--progress': `${progress}%` } as CSSProperties}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </Field>
  );
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segment" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? 'active' : ''}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CopyButton({ value, label = '复制' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="icon-button" type="button" aria-label={`${label} ${value}`} onClick={copy}>
      {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
    </button>
  );
}

function ScaleStrip({
  result,
  selectedIndex,
  onSelect,
  compact = false,
}: {
  result: ColorScaleResult;
  selectedIndex: number;
  onSelect: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? 'scale-strip compact' : 'scale-strip'}
      style={{ '--stop-count': result.stops.length } as CSSProperties}
    >
      {result.stops.map((stop) => {
        const selected = stop.index === selectedIndex;
        const anchor = stop.index === result.anchorIndex;
        const recommended = stop.index === result.recommendedIndex;

        return (
          <button
            className={`scale-stop${selected ? ' selected' : ''}`}
            key={stop.index}
            type="button"
            title={`${stop.label} · ${stop.color}`}
            aria-label={`第 ${stop.label} 阶，${stop.color}${anchor ? '，输入锚点' : ''}${recommended ? '，推荐主色' : ''}`}
            aria-pressed={selected}
            onClick={() => onSelect(stop.index)}
          >
            <span
              className="color-block"
              style={
                {
                  '--stop': stop.color,
                  '--on-stop': chooseContrastingForeground(stop.color),
                } as CSSProperties
              }
            >
              <span>{stop.label}</span>
              {anchor ? <span className="stop-marker">A</span> : null}
              {!anchor && recommended ? <span className="stop-marker">R</span> : null}
            </span>
            {compact ? null : (
              <span className="stop-meta">
                <code>{stop.color}</code>
                {anchor ? (
                  <small>输入色</small>
                ) : recommended ? (
                  <small>推荐</small>
                ) : (
                  <small>L {stop.oklch.l.toFixed(2)}</small>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StopInspector({ stop }: { stop: ColorStop }) {
  const rows = [
    ['Lightness', stop.oklch.l.toFixed(3)],
    ['Chroma', stop.oklch.c.toFixed(3)],
    ['Hue', stop.oklch.h === null ? '—' : `${stop.oklch.h.toFixed(1)}°`],
    ['Source', stop.source],
  ];

  return (
    <aside className="stop-inspector">
      <div className="inspector-color" style={{ background: stop.color }} />
      <div className="inspector-copy">
        <span className="eyebrow">Selected color</span>
        <div className="inspector-value">
          <strong>{stop.color}</strong>
          <CopyButton value={stop.color} />
        </div>
        <dl>
          {rows.map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

function Diagnostics({ messages }: { messages: DiagnosticMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="empty-diagnostics">
        <CheckCircle size={18} weight="fill" />
        当前配置没有产生警告。
      </div>
    );
  }

  return (
    <div className="diagnostic-list">
      {messages.map((message, index) => (
        <div className={`diagnostic ${message.severity}`} key={`${message.code}-${index}`}>
          {message.severity === 'info' ? (
            <Info size={18} />
          ) : (
            <WarningCircle size={18} weight="fill" />
          )}
          <div>
            <div className="diagnostic-title">
              <code>{message.code}</code>
              <span>{message.severity}</span>
            </div>
            <p>{message.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemePreview({ theme }: { theme: SemanticTheme }) {
  const { color } = theme;
  const styles = {
    '--preview-page': color.background.page,
    '--preview-container': color.background.container,
    '--preview-elevated': color.background.elevated,
    '--preview-text': color.text.primary,
    '--preview-muted': color.text.secondary,
    '--preview-border': color.border.default,
    '--preview-brand': color.brand.default,
    '--preview-brand-hover': color.brand.hover,
    '--preview-on-brand': color.brand.onBrand,
    '--preview-subtle': color.brand.subtle,
    '--preview-link': color.text.link,
  } as CSSProperties;

  return (
    <article className="theme-preview" style={styles}>
      <header className="preview-topbar">
        <div className="preview-brand">
          <Palette size={18} weight="fill" />
          Northstar
        </div>
        <div className="preview-user" aria-hidden="true">
          NS
        </div>
      </header>
      <div className="preview-body">
        <aside className="preview-nav">
          <span className="active">概览</span>
          <span>项目</span>
          <span>数据</span>
          <span>设置</span>
        </aside>
        <main className="preview-main">
          <div className="preview-heading">
            <div>
              <small>{theme.mode} theme</small>
              <h3>项目概览</h3>
            </div>
            <button type="button">创建项目</button>
          </div>
          <div className="metric-grid">
            <div>
              <small>活跃项目</small>
              <strong>24</strong>
              <span>较上周 +12%</span>
            </div>
            <div>
              <small>协作者</small>
              <strong>128</strong>
              <span>8 位新成员</span>
            </div>
            <div>
              <small>完成率</small>
              <strong>86%</strong>
              <span>表现良好</span>
            </div>
          </div>
          <div className="preview-table">
            <div className="preview-table-head">
              <strong>最近项目</strong>
              <a href="#tokens">
                查看全部 <ArrowRight size={13} />
              </a>
            </div>
            {['Design system', 'Mobile refresh', 'Growth dashboard'].map((item, index) => (
              <div className="preview-row" key={item}>
                <span className="project-dot" />
                <span>{item}</span>
                <small>{[72, 48, 91][index]}%</small>
                <span className="progress-track">
                  <span style={{ width: `${[72, 48, 91][index]}%` }} />
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </article>
  );
}

function TokenTable({ theme }: { theme: SemanticTheme }) {
  const groups = [
    ['Brand', Object.entries(theme.color.brand).map(([key, value]) => [`brand.${key}`, value])],
    [
      'Background',
      Object.entries(theme.color.background).map(([key, value]) => [`background.${key}`, value]),
    ],
    ['Text', Object.entries(theme.color.text).map(([key, value]) => [`text.${key}`, value])],
    ['Border', Object.entries(theme.color.border).map(([key, value]) => [`border.${key}`, value])],
  ] as Array<[string, Array<[string, string]>]>;

  return (
    <div className="token-table">
      {groups.map(([group, tokens]) => (
        <section className="token-group" key={group}>
          <h3>{group}</h3>
          {tokens.map(([name, value]) => (
            <div className="token-row" key={name}>
              <span className="token-chip" style={{ background: value }} />
              <code>{name}</code>
              <span>{value}</span>
              <CopyButton value={value} label={`复制 ${name}`} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function AppShellError({ error }: { error: Error }) {
  return (
    <div className="error-state" role="alert">
      <WarningCircle size={26} weight="fill" />
      <div>
        <strong>无法生成当前色阶</strong>
        <p>{error.message}</p>
      </div>
    </div>
  );
}

export function App() {
  const [seed, setSeed] = useState('#0052D9');
  const [strategy, setStrategy] = useState<ScaleStrategy>('tonal');
  const [steps, setSteps] = useState(10);
  const [anchorIndex, setAnchorIndex] = useState(5);
  const [output, setOutput] = useState<ColorOutputFormat>('hex');
  const [hueShift, setHueShift] = useState(0);
  const [neutralSteps, setNeutralSteps] = useState<10 | 14>(14);
  const [tintStrength, setTintStrength] = useState(0.025);
  const [themeMode, setThemeMode] = useState<ThemeMode>('both');
  const [contrastPolicy, setContrastPolicy] = useState<ContrastPolicy>('adjust');
  const [normalText, setNormalText] = useState(4.5);
  const [nonText, setNonText] = useState(3);
  const [view, setView] = useState<View>('scale');
  const [uiMode, setUiMode] = useState<UiMode>('light');
  const [selectedIndex, setSelectedIndex] = useState(6);
  const [tokenMode, setTokenMode] = useState<'light' | 'dark'>('light');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [exportOpen, setExportOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setAnchorIndex((current) => Math.min(current, steps - 1));
    setSelectedIndex((current) => Math.min(current, steps - 1));
  }, [steps]);

  const generated = useMemo<
    | {
        scale: ColorScaleResult;
        neutral: ColorScaleResult;
        theme: ColorThemeResult | undefined;
        themeError: Error | undefined;
      }
    | { error: Error }
  >(() => {
    try {
      const scale = generateColorScale(seed, {
        steps,
        strategy,
        output,
        hueShift,
        ...(strategy === 'fixed-anchor' ? { anchorIndex } : {}),
      });
      const neutral = generateNeutralScale(seed, {
        steps: neutralSteps,
        tintStrength,
        output,
      });
      let theme: ColorThemeResult | undefined;
      let themeError: Error | undefined;

      try {
        theme = generateColorTheme(seed, {
          mode: themeMode,
          scale: {
            steps: Math.max(10, steps),
            strategy,
            output,
            hueShift,
            ...(strategy === 'fixed-anchor' ? { anchorIndex } : {}),
          },
          neutral: { steps: neutralSteps, tintStrength, output },
          contrast: { normalText, nonText },
          contrastPolicy,
        });
      } catch (error) {
        themeError = error instanceof Error ? error : new Error(String(error));
      }

      return { scale, neutral, theme, themeError };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  }, [
    anchorIndex,
    contrastPolicy,
    hueShift,
    neutralSteps,
    nonText,
    normalText,
    output,
    seed,
    steps,
    strategy,
    themeMode,
    tintStrength,
  ]);

  const comparison = useMemo(() => {
    try {
      return STRATEGIES.map(({ value }) =>
        generateColorScale(seed, {
          steps,
          strategy: value,
          output,
          hueShift,
          ...(value === 'fixed-anchor' ? { anchorIndex } : {}),
        }),
      );
    } catch {
      return [];
    }
  }, [anchorIndex, hueShift, output, seed, steps]);

  if ('error' in generated) {
    return (
      <div className="app" data-ui-theme={uiMode}>
        <Topbar uiMode={uiMode} setUiMode={setUiMode} onOpenSettings={() => setSidebarOpen(true)} />
        <main className="error-page">
          <AppShellError error={generated.error} />
          <label className="seed-recovery">
            <span>输入有效的 CSS 颜色</span>
            <input value={seed} onChange={(event) => setSeed(event.currentTarget.value)} />
          </label>
        </main>
      </div>
    );
  }

  const { scale, neutral, theme, themeError } = generated;
  const selectedStop = scale.stops[selectedIndex] ?? scale.stops[scale.recommendedIndex];
  const activeTheme = theme?.themes[tokenMode] ?? theme?.themes.light ?? theme?.themes.dark;
  const warningCount = [
    ...scale.diagnostics.messages,
    ...(theme?.diagnostics.messages ?? []),
  ].filter((message) => message.severity !== 'info').length;
  const exportValue = makeExport(exportFormat, scale, neutral, activeTheme);

  async function downloadExport(): Promise<void> {
    const extension = exportFormat === 'typescript' ? 'ts' : exportFormat;
    const blob = new Blob([exportValue], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `color-tokens.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app" data-ui-theme={uiMode}>
      <Topbar uiMode={uiMode} setUiMode={setUiMode} onOpenSettings={() => setSidebarOpen(true)} />
      <div className="workspace">
        <aside className={`control-panel${sidebarOpen ? ' open' : ''}`}>
          <div className="panel-mobile-head">
            <strong>生成设置</strong>
            <button
              className="icon-button"
              type="button"
              aria-label="关闭设置"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="control-section seed-section">
            <div className="section-label">
              <span>Seed color</span>
              <small>支持所有 Culori 可解析格式</small>
            </div>
            <div className="seed-control">
              <label
                className="color-input"
                style={{ '--seed': scale.seed.normalized } as CSSProperties}
              >
                <input
                  type="color"
                  aria-label="选择种子色"
                  value={scale.seed.normalized}
                  onChange={(event) => setSeed(event.currentTarget.value)}
                />
              </label>
              <input
                className="text-input seed-text"
                aria-label="种子色"
                value={seed}
                spellCheck={false}
                onChange={(event) => setSeed(event.currentTarget.value)}
              />
            </div>
            <div className="preset-list" aria-label="颜色预设">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  style={{ '--preset': preset } as CSSProperties}
                  className={
                    scale.seed.normalized.toLowerCase() === preset.toLowerCase() ? 'active' : ''
                  }
                  aria-label={`使用 ${preset}`}
                  onClick={() => setSeed(preset)}
                />
              ))}
            </div>
          </div>

          <div className="control-section">
            <div className="section-label">
              <span>Scale</span>
              <SlidersHorizontal size={16} />
            </div>
            <Field label="生成策略" hint={STRATEGIES.find((item) => item.value === strategy)?.hint}>
              <div className="strategy-list">
                {STRATEGIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={strategy === item.value ? 'active' : ''}
                    onClick={() => setStrategy(item.value)}
                  >
                    <span>{item.label}</span>
                    {strategy === item.value ? <Check size={15} weight="bold" /> : null}
                  </button>
                ))}
              </div>
            </Field>
            <RangeField label="阶数" value={steps} min={3} max={20} step={1} onChange={setSteps} />
            {strategy === 'fixed-anchor' ? (
              <RangeField
                label="锚点阶位"
                value={anchorIndex + 1}
                min={1}
                max={steps}
                step={1}
                onChange={(value) => setAnchorIndex(value - 1)}
              />
            ) : null}
            <RangeField
              label="统一色相偏移"
              value={hueShift}
              min={-60}
              max={60}
              step={1}
              suffix="°"
              onChange={setHueShift}
            />
            <Field label="输出格式">
              <Segment
                label="输出格式"
                value={output}
                options={[
                  { value: 'hex', label: 'HEX' },
                  { value: 'rgb', label: 'RGB' },
                  { value: 'oklch', label: 'OKLCH' },
                ]}
                onChange={setOutput}
              />
            </Field>
          </div>

          <div className="control-section">
            <div className="section-label">
              <span>Neutral</span>
              <small>品牌关联中性色</small>
            </div>
            <Field label="中性色阶数">
              <Segment
                label="中性色阶数"
                value={String(neutralSteps) as '10' | '14'}
                options={[
                  { value: '10', label: '10 阶' },
                  { value: '14', label: '14 阶' },
                ]}
                onChange={(value) => setNeutralSteps(Number(value) as 10 | 14)}
              />
            </Field>
            <RangeField
              label="染色强度"
              value={tintStrength}
              min={0}
              max={0.08}
              step={0.005}
              onChange={setTintStrength}
            />
          </div>

          <div className="control-section">
            <div className="section-label">
              <span>Semantic theme</span>
              <Sparkle size={16} />
            </div>
            <Field label="生成模式">
              <Segment
                label="主题生成模式"
                value={themeMode}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'both', label: 'Both' },
                ]}
                onChange={setThemeMode}
              />
            </Field>
            <Field label="对比度策略">
              <select
                className="select-input"
                value={contrastPolicy}
                onChange={(event) => setContrastPolicy(event.currentTarget.value as ContrastPolicy)}
              >
                <option value="report">Report · 只报告</option>
                <option value="adjust">Adjust · 自动调整</option>
                <option value="strict">Strict · 不满足即报错</option>
              </select>
            </Field>
            <RangeField
              label="正文文字对比度"
              value={normalText}
              min={3}
              max={7}
              step={0.1}
              onChange={setNormalText}
            />
            <RangeField
              label="非文字对比度"
              value={nonText}
              min={3}
              max={4.5}
              step={0.1}
              onChange={setNonText}
            />
          </div>
        </aside>
        {sidebarOpen ? (
          <button
            className="sidebar-scrim"
            type="button"
            aria-label="关闭设置"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <main className="canvas">
          <section className="summary-card">
            <div className="summary-intro">
              <span className="eyebrow">Live palette</span>
              <h1>把一个颜色，变成可用的设计语言。</h1>
              <p>实时检查感知均匀度、输入锚点、明暗主题与语义 Token。</p>
            </div>
            <div className="summary-metrics">
              <div>
                <small>Seed</small>
                <strong>{scale.seed.normalized}</strong>
              </div>
              <div>
                <small>OKLCH</small>
                <strong>
                  {scale.seed.oklch.l.toFixed(2)} · {scale.seed.oklch.c.toFixed(2)} ·{' '}
                  {scale.seed.oklch.h?.toFixed(0) ?? '—'}°
                </strong>
              </div>
              <div>
                <small>Recommended</small>
                <strong>Step {scale.recommendedIndex + 1}</strong>
              </div>
              <div>
                <small>Diagnostics</small>
                <strong className={warningCount > 0 ? 'has-warning' : ''}>
                  {warningCount} warnings
                </strong>
              </div>
            </div>
          </section>

          <div className="view-bar">
            <nav aria-label="演示内容">
              {VIEWS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={view === item.value ? 'active' : ''}
                  aria-current={view === item.value ? 'page' : undefined}
                  onClick={() => setView(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <button className="export-trigger" type="button" onClick={() => setExportOpen(true)}>
              <BracketsCurly size={17} />
              导出 Tokens
            </button>
          </div>

          {view === 'scale' ? (
            <div className="view-stack">
              <section className="surface scale-surface">
                <div className="surface-heading">
                  <div>
                    <span className="eyebrow">Brand scale</span>
                    <h2>{STRATEGIES.find((item) => item.value === strategy)?.label} strategy</h2>
                  </div>
                  <span className="surface-badge">
                    {scale.anchorIndex === null
                      ? `推荐第 ${scale.recommendedIndex + 1} 阶`
                      : `锚点第 ${scale.anchorIndex + 1} 阶`}
                  </span>
                </div>
                <ScaleStrip
                  result={scale}
                  selectedIndex={selectedStop.index}
                  onSelect={setSelectedIndex}
                />
                <StopInspector stop={selectedStop} />
              </section>
              <section className="surface">
                <div className="surface-heading">
                  <div>
                    <span className="eyebrow">Tinted neutral</span>
                    <h2>品牌关联中性色</h2>
                  </div>
                  <span className="surface-badge">C ≤ {tintStrength.toFixed(3)}</span>
                </div>
                <ScaleStrip result={neutral} selectedIndex={-1} onSelect={() => undefined} />
              </section>
              <section className="surface diagnostics-surface">
                <div className="surface-heading">
                  <div>
                    <span className="eyebrow">Diagnostics</span>
                    <h2>生成质量检查</h2>
                  </div>
                </div>
                <Diagnostics messages={scale.diagnostics.messages} />
              </section>
            </div>
          ) : null}

          {view === 'theme' ? (
            <div className="view-stack">
              {steps < 10 ? (
                <div className="inline-note">
                  <Info size={18} />
                  主题映射至少需要 10 阶，预览已自动使用 10 阶品牌色。
                </div>
              ) : null}
              {themeError === undefined ? null : <AppShellError error={themeError} />}
              {theme?.themes.light === undefined ? null : (
                <section className="surface theme-surface">
                  <div className="surface-heading">
                    <div>
                      <span className="eyebrow">Light mode</span>
                      <h2>明亮主题预览</h2>
                    </div>
                    <span className="surface-badge">contrast · {contrastPolicy}</span>
                  </div>
                  <ThemePreview theme={theme.themes.light} />
                </section>
              )}
              {theme?.themes.dark === undefined ? null : (
                <section className="surface theme-surface">
                  <div className="surface-heading">
                    <div>
                      <span className="eyebrow">Dark mode</span>
                      <h2>深色主题预览</h2>
                    </div>
                    <span className="surface-badge">contrast · {contrastPolicy}</span>
                  </div>
                  <ThemePreview theme={theme.themes.dark} />
                </section>
              )}
              {theme === undefined ? null : (
                <section className="surface diagnostics-surface">
                  <div className="surface-heading">
                    <div>
                      <span className="eyebrow">Contrast</span>
                      <h2>主题诊断</h2>
                    </div>
                  </div>
                  <Diagnostics messages={theme.diagnostics.messages} />
                </section>
              )}
            </div>
          ) : null}

          {view === 'tokens' ? (
            <section className="surface" id="tokens">
              <div className="surface-heading token-heading">
                <div>
                  <span className="eyebrow">Semantic mapping</span>
                  <h2>语义 Token</h2>
                </div>
                <Segment
                  label="Token 主题"
                  value={tokenMode}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                  ]}
                  onChange={setTokenMode}
                />
              </div>
              {activeTheme === undefined ? (
                <div className="inline-note">
                  <Info size={18} />
                  当前只生成了另一种主题，请在左侧将生成模式切换为 Both。
                </div>
              ) : (
                <TokenTable theme={activeTheme} />
              )}
            </section>
          ) : null}

          {view === 'compare' ? (
            <div className="view-stack compare-stack">
              <section className="surface compare-intro">
                <div>
                  <span className="eyebrow">Strategy comparison</span>
                  <h2>同一输入，三种生成逻辑</h2>
                </div>
                <p>观察输入色是否被保留、落在哪一阶，以及完整明度曲线的差异。</p>
              </section>
              {comparison.map((result, index) => (
                <section className="surface comparison-card" key={result.strategy}>
                  <div className="comparison-info">
                    <span className="comparison-index">0{index + 1}</span>
                    <div>
                      <h3>{STRATEGIES[index]?.label}</h3>
                      <p>{STRATEGIES[index]?.hint}</p>
                    </div>
                    <span className="surface-badge">
                      {result.anchorIndex === null
                        ? `推荐 ${result.recommendedIndex + 1}`
                        : `锚点 ${result.anchorIndex + 1}`}
                    </span>
                  </div>
                  <ScaleStrip
                    result={result}
                    selectedIndex={-1}
                    onSelect={() => undefined}
                    compact
                  />
                </section>
              ))}
            </div>
          ) : null}
        </main>
      </div>

      {exportOpen ? (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setExportOpen(false)}
        >
          <section
            className="export-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">Ready to ship</span>
                <h2 id="export-title">导出设计 Token</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="关闭导出面板"
                onClick={() => setExportOpen(false)}
              >
                <X size={19} />
              </button>
            </header>
            <Segment
              label="导出格式"
              value={exportFormat}
              options={[
                { value: 'css', label: 'CSS' },
                { value: 'json', label: 'JSON' },
                { value: 'typescript', label: 'TypeScript' },
              ]}
              onChange={setExportFormat}
            />
            <pre>
              <code>{exportValue}</code>
            </pre>
            <footer>
              <button
                className="button secondary"
                type="button"
                onClick={() => navigator.clipboard.writeText(exportValue)}
              >
                <Clipboard size={17} />
                复制全部
              </button>
              <button className="button primary" type="button" onClick={downloadExport}>
                <DownloadSimple size={17} />
                下载文件
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Topbar({
  uiMode,
  setUiMode,
  onOpenSettings,
}: {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="topbar">
      <div className="product-lockup">
        <span className="product-icon">
          <Palette size={19} weight="fill" />
        </span>
        <div>
          <strong>Color Lab</strong>
          <small>by Color Scale Engine</small>
        </div>
      </div>
      <div className="topbar-meta">
        <span>
          <span className="status-dot" /> Engine ready
        </span>
        <span>
          <Code size={16} /> API 文档
        </span>
        <Segment
          label="界面主题"
          value={uiMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={setUiMode}
        />
        <button className="mobile-settings" type="button" onClick={onOpenSettings}>
          <SlidersHorizontal size={18} />
          设置
        </button>
      </div>
    </header>
  );
}
