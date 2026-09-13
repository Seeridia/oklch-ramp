import { useId, useState } from 'react';
import { Radio, Select, Slider, Tag } from 'tdesign-react';
import { generateColorScale, generateNeutralScale, type ScaleStrategy } from '@okramp/core';
import { useI18n } from '../i18n';
import { Field } from './Controls';
import { ScaleStrip } from './Scales';

function CurveChart({
  series,
  max = 1,
}: {
  series: Array<{ label: string; values: number[] }>;
  max?: number;
}) {
  const { t } = useI18n();
  const id = useId();
  const x = (index: number, count: number) => 44 + (index * 512) / (count - 1);
  const y = (value: number) => 178 - (value / max) * 144;
  return (
    <figure className="principle-chart">
      <svg viewBox="0 0 580 214" role="img" aria-labelledby={id}>
        <title id={id}>{series.map((s) => s.label).join(' / ')}</title>
        {[0, 0.5, 1].map((fraction) => (
          <g key={fraction}>
            <line
              x1="44"
              x2="556"
              y1={y(fraction * max)}
              y2={y(fraction * max)}
              className="principle-grid-line"
            />
            <text x="36" y={y(fraction * max) + 4} textAnchor="end">
              {(fraction * max).toFixed(2)}
            </text>
          </g>
        ))}
        {series.map((s, seriesIndex) => (
          <g key={s.label} className={`principle-series principle-series-${seriesIndex}`}>
            <polyline
              points={s.values
                .map((value, index) => `${x(index, s.values.length)},${y(value)}`)
                .join(' ')}
              fill="none"
              strokeWidth="2.5"
              strokeDasharray={seriesIndex ? '6 4' : undefined}
            />
            {s.values.map((value, index) => (
              <circle key={index} cx={x(index, s.values.length)} cy={y(value)} r="3">
                <title>
                  {s.label} · {index + 1}: {value.toFixed(4)}
                </title>
              </circle>
            ))}
          </g>
        ))}
        <text x="44" y="204">
          {t('第 1 阶 · 浅端', 'Stop 1 · Light')}
        </text>
        <text x="556" y="204" textAnchor="end">
          {t('深端', 'Dark end')}
        </text>
      </svg>
      <figcaption>
        {series.map((s, index) => (
          <span key={s.label}>
            <i className={`principle-legend-${index}`} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function StrategyDemo() {
  const { t } = useI18n();
  const [seed, setSeed] = useState('#0052D9');
  const [strategy, setStrategy] = useState<ScaleStrategy>('tonal');
  const [endpoints, setEndpoints] = useState<'curve' | 'black-white'>('curve');
  const [anchor, setAnchor] = useState(5);
  const result = generateColorScale(seed, {
    strategy,
    endpoints,
    ...(strategy === 'fixed-anchor' ? { anchorIndex: anchor } : {}),
  });
  const baseline = generateColorScale(seed, { strategy: 'tonal', endpoints });
  return (
    <div className="principle-demo">
      <h3>{t('实验：移动主色，观察曲线', 'Experiment: move the seed and watch the curve')}</h3>
      <div className="principle-controls">
        <Field label={t('输入颜色', 'Seed color')}>
          <Select
            aria-label={t('原理演示输入颜色', 'Experiment seed color')}
            value={seed}
            onChange={(v) => {
              if (typeof v === 'string') setSeed(v);
            }}
            options={[
              { value: '#0052D9', label: t('品牌蓝', 'Brand blue') },
              { value: '#dce9ff', label: t('极浅蓝', 'Pale blue') },
              { value: '#001b54', label: t('深蓝', 'Deep blue') },
              { value: '#ED7B2F', label: t('橙色', 'Orange') },
            ]}
          />
        </Field>
        <Field label={t('生成策略', 'Strategy')}>
          <Select
            aria-label={t('原理演示策略', 'Experiment strategy')}
            value={strategy}
            onChange={(v) => setStrategy(v as ScaleStrategy)}
            options={['tonal', 'adaptive-anchor', 'fixed-anchor'].map((value) => ({
              value,
              label: value,
            }))}
          />
        </Field>
        <Field label={t('端点', 'Endpoints')}>
          <Select
            aria-label={t('原理演示端点', 'Experiment endpoints')}
            value={endpoints}
            onChange={(v) => setEndpoints(v as typeof endpoints)}
            options={[
              { value: 'curve', label: t('曲线端点', 'Curve') },
              { value: 'black-white', label: t('纯白 / 纯黑', 'White / black') },
            ]}
          />
        </Field>
      </div>
      {strategy === 'fixed-anchor' && (
        <Field label={t('固定在第 {stop} 阶', 'Pin to stop {stop}', { stop: anchor + 1 })}>
          <Slider
            aria-label={t('演示锚点位置', 'Experiment anchor position')}
            value={anchor}
            min={1}
            max={8}
            step={1}
            onChange={(v) => setAnchor(Number(v))}
          />
        </Field>
      )}
      <ScaleStrip result={result} compact />
      <CurveChart
        series={[
          {
            label: t('当前策略 · 实际 L', 'Current strategy · Actual L'),
            values: result.stops.map((s) => s.oklch.l),
          },
          {
            label: t('tonal 基准 · L', 'Tonal reference · L'),
            values: baseline.stops.map((s) => s.oklch.l),
          },
        ]}
      />
      <p aria-live="polite">
        {result.anchorIndex === null
          ? t(
              '输入色未固定。R 标记与输入色最接近的推荐阶位：第 {stop} 阶。',
              'The seed is not pinned. R marks the closest recommended stop: {stop}.',
              { stop: result.recommendedIndex + 1 },
            )
          : t(
              'A 标记规范化输入色所在位置：第 {stop} 阶。两侧曲线围绕该位置重建。',
              'A marks the normalized seed at stop {stop}. Both sides are rebuilt around it.',
              { stop: result.anchorIndex + 1 },
            )}
      </p>
      <p className="field-hint">
        {t(
          '试试“极浅蓝 + 固定锚点”，再切换自动锚点。实线与虚线重合表示明度曲线一致；所有色阶均由实际引擎生成。',
          'Try Pale blue + fixed-anchor, then switch to adaptive-anchor. Overlapping lines mean matching lightness curves. All ramps come from the actual engine.',
        )}
      </p>
    </div>
  );
}

export function GamutDemo() {
  const { t } = useI18n();
  const [hue, setHue] = useState(260);
  const [chroma, setChroma] = useState(0.3);
  const result = generateColorScale(`oklch(0.65 ${chroma} ${hue})`);
  const normalized = result.seed;
  const mapped = result.diagnostics.messages.some((m) => m.code === 'SEED_OUT_OF_GAMUT');
  return (
    <div className="principle-demo">
      <h3>
        {t(
          '实验：固定明度，寻找可显示的彩度',
          'Experiment: find displayable chroma at fixed lightness',
        )}
      </h3>
      <div className="principle-controls">
        <Field label={t('色相 H · {hue}°', 'Hue H · {hue}°', { hue })}>
          <Slider
            aria-label={t('色域演示色相', 'Gamut demo hue')}
            min={0}
            max={360}
            value={hue}
            onChange={(v) => setHue(Number(v))}
          />
        </Field>
        <Field
          label={t('目标彩度 C · {value}', 'Target chroma C · {value}', {
            value: chroma.toFixed(3),
          })}
        >
          <Slider
            aria-label={t('色域演示彩度', 'Gamut demo chroma')}
            min={0}
            max={0.4}
            step={0.005}
            value={chroma}
            onChange={(v) => setChroma(Number(v))}
          />
        </Field>
      </div>
      <div className="principle-gamut-result">
        <div
          className="principle-gamut-swatch"
          style={{ background: normalized.normalized }}
          role="img"
          aria-label={t('映射结果 {color}', 'Mapped color {color}', {
            color: normalized.normalized,
          })}
        />
        <div aria-live="polite">
          <Tag theme={mapped ? 'warning' : 'success'} variant="light">
            {mapped
              ? t('已降低彩度', 'Chroma reduced')
              : t('目标位于 sRGB 内', 'Target is within sRGB')}
          </Tag>
          <p>
            <code>
              C {chroma.toFixed(4)} → {normalized.oklch.c.toFixed(4)}
            </code>
          </p>
          <p>
            <code>
              L 0.6500 → {normalized.oklch.l.toFixed(4)} · {normalized.normalized}
            </code>
          </p>
        </div>
      </div>
      <p className="field-hint">
        {t(
          '色块仅显示引擎映射后的 sRGB 结果。超色域目标用数值表示，避免把浏览器自行映射的颜色误当成原始颜色。切换色相可观察同一明度下不同的彩度上限。',
          'The swatch shows only the engine-mapped sRGB result. Out-of-gamut targets are represented numerically, avoiding confusion with browser gamut mapping. Change hue to explore different chroma limits at the same lightness.',
        )}
      </p>
    </div>
  );
}

export function NeutralDemo() {
  const { t } = useI18n();
  const [tint, setTint] = useState(0.025);
  const [steps, setSteps] = useState<10 | 14>(14);
  const neutral = generateNeutralScale('#0052D9', { steps, tintStrength: tint });
  const gray = generateNeutralScale('#0052D9', { steps, tintStrength: 0 });
  return (
    <div className="principle-demo">
      <h3>{t('实验：从纯灰到品牌关联中性色', 'Experiment: from gray to brand-tinted neutrals')}</h3>
      <div className="principle-controls">
        <Field
          label={t('染色强度 · {value}', 'Tint strength · {value}', { value: tint.toFixed(3) })}
        >
          <Slider
            aria-label={t('中性色演示染色强度', 'Neutral demo tint strength')}
            min={0}
            max={0.08}
            step={0.001}
            value={tint}
            onChange={(v) => setTint(Number(v))}
          />
        </Field>
        <Field label={t('中性色阶数', 'Neutral stops')}>
          <Radio.Group
            aria-label={t('中性色演示阶数', 'Neutral demo stops')}
            theme="button"
            value={steps}
            onChange={(v) => setSteps(Number(v) as 10 | 14)}
            options={[10, 14].map((value) => ({ value, label: String(value) }))}
          />
        </Field>
      </div>
      <p>{t('纯灰基准', 'Untinted reference')}</p>
      <ScaleStrip result={gray} compact />
      <p>{t('品牌蓝 #0052D9 · 当前染色', 'Brand blue #0052D9 · Current tint')}</p>
      <ScaleStrip result={neutral} compact />
      <CurveChart
        max={0.08}
        series={[
          {
            label: t('各阶实际彩度 C', 'Actual chroma C per stop'),
            values: neutral.stops.map((s) => s.oklch.c),
          },
        ]}
      />
      <p className="field-hint">
        {t(
          '将强度降至 0 会回到纯灰；提高后可能出现平台，因为彩度还受种子彩度 × 0.18 限制。明度曲线独立于染色强度。',
          'At zero, the scale becomes gray. Increasing tint can reach a plateau because seed chroma × 0.18 also caps it. The lightness curve is independent of tint strength.',
        )}
      </p>
    </div>
  );
}
