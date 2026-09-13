import { useEffect, useRef, useState } from 'react';
import { Button, Card, Radio, Tag, Tooltip, MessagePlugin } from 'tdesign-react';
import { CopyIcon, InfoCircleIcon, CheckIcon } from 'tdesign-icons-react';
import { chooseContrastingForeground, type ColorScaleResult, type ColorStop } from 'okramp';
import { displayColor, type DisplayFormat, type Generated } from '../model';
import { currentLocale, useI18n } from '../i18n';
export async function copyText(value: string) {
  const isZh = currentLocale() === 'zh-CN';
  try {
    await navigator.clipboard.writeText(value);
    await MessagePlugin.success(isZh ? '已复制到剪贴板' : 'Copied to clipboard');
  } catch {
    await MessagePlugin.error(
      isZh
        ? '复制失败，请在导出面板中手动选择并复制'
        : 'Copy failed. Select and copy the value manually.',
    );
  }
}
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t } = useI18n();
  const accessibleLabel = label ?? t('复制颜色值', 'Copy color value');
  return (
    <Tooltip content={accessibleLabel}>
      <Button
        aria-label={accessibleLabel}
        variant="text"
        shape="square"
        size="small"
        icon={<CopyIcon aria-hidden="true" />}
        onClick={() => void copyText(value)}
      />
    </Tooltip>
  );
}
export function ScaleStrip({
  result,
  selected,
  onSelect,
  compact = false,
  format = 'hex',
}: {
  result: ColorScaleResult;
  selected?: number;
  onSelect?: (index: number) => void;
  compact?: boolean;
  format?: DisplayFormat;
}) {
  const { t } = useI18n();
  const stripRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const activeIndex =
    selected === undefined ? undefined : Math.min(selected, result.stops.length - 1);
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const revealSelection = () => {
      setOverflowing(strip.scrollWidth > strip.clientWidth + 1);
      if (activeIndex === undefined) return;
      const button = strip.children[activeIndex] as HTMLElement | undefined;
      if (!button) return;
      const bounds = strip.getBoundingClientRect();
      const selectedBounds = button.getBoundingClientRect();
      if (selectedBounds.left < bounds.left) strip.scrollLeft += selectedBounds.left - bounds.left;
      else if (selectedBounds.right > bounds.right)
        strip.scrollLeft += selectedBounds.right - bounds.right;
    };
    const observer = new ResizeObserver(revealSelection);
    observer.observe(strip);
    revealSelection();
    return () => observer.disconnect();
  }, [activeIndex, result.stops.length, compact, format]);
  return (
    <div
      ref={stripRef}
      className={`scale-strip ${compact ? 'compact' : ''}`}
      data-overflow={overflowing}
      style={{
        gridTemplateColumns: `repeat(${result.stops.length}, minmax(${compact ? '32px' : 'var(--scale-stop-min, 80px)'}, 1fr))`,
      }}
    >
      {result.stops.map((stop) => (
        <button
          type="button"
          className={`scale-stop ${activeIndex === stop.index ? 'selected' : ''}`}
          key={stop.index}
          aria-label={t('第 {label} 阶 {color}', 'Stop {label}: {color}', {
            label: stop.label,
            color: stop.color,
          })}
          aria-pressed={activeIndex === stop.index}
          onClick={() =>
            onSelect ? onSelect(stop.index) : void copyText(displayColor(stop.color, format))
          }
          title={displayColor(stop.color, format)}
        >
          <span
            className="color-block"
            style={{ background: stop.color, color: chooseContrastingForeground(stop.color) }}
          >
            <span>{stop.label.padStart(2, '0')}</span>
            {result.anchorIndex === stop.index ? (
              <span className="stop-marker">A</span>
            ) : result.recommendedIndex === stop.index ? (
              <span className="stop-marker">R</span>
            ) : null}
            {activeIndex === stop.index && (
              <CheckIcon className="selected-check" aria-hidden="true" />
            )}
          </span>
          {!compact && (
            <span className="stop-meta">
              <code>{displayColor(stop.color, format)}</code>
              <small>
                {result.anchorIndex === stop.index
                  ? t('输入色', 'Seed color')
                  : result.recommendedIndex === stop.index
                    ? t('推荐主色', 'Recommended color')
                    : `L ${stop.oklch.l.toFixed(2)}`}
              </small>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
function Inspector({ stop, kind }: { stop: ColorStop; kind: string }) {
  const { t } = useI18n();
  return (
    <Card className="inspector-card" bordered={false}>
      <div className="inspector-heading">
        <div>
          <span className="eyebrow">{t('颜色检查器', 'COLOR INSPECTOR')}</span>
          <h3>
            {t('色彩详情', 'Color details')}{' '}
            <span>
              {kind} · {t('第 {label} 阶', 'Stop {label}', { label: stop.label })}
            </span>
          </h3>
        </div>
        <Tag variant="light" theme={stop.source === 'seed' ? 'primary' : 'default'}>
          {stop.source === 'seed'
            ? t('输入色', 'Seed color')
            : stop.source === 'gamut-mapped'
              ? t('色域映射', 'Gamut mapped')
              : t('算法生成', 'Generated')}
        </Tag>
      </div>
      <div className="inspector-body">
        <div
          className="inspector-swatch"
          style={{ background: stop.color, color: chooseContrastingForeground(stop.color) }}
        >
          <span>Aa</span>
          <code>{stop.color}</code>
        </div>
        <div className="color-formats">
          {(['hex', 'rgb', 'oklch'] as const).map((format) => (
            <div className="format-row" key={format}>
              <span>{format.toUpperCase()}</span>
              <code>{displayColor(stop.color, format)}</code>
              <CopyButton
                value={displayColor(stop.color, format)}
                label={t('复制 {format}', 'Copy {format}', { format: format.toUpperCase() })}
              />
            </div>
          ))}
        </div>
        <div className="color-metrics">
          <div>
            <span>{t('明度 L', 'Lightness L')}</span>
            <strong>{stop.oklch.l.toFixed(3)}</strong>
          </div>
          <div>
            <span>{t('彩度 C', 'Chroma C')}</span>
            <strong>{stop.oklch.c.toFixed(3)}</strong>
          </div>
          <div>
            <span>{t('色相 H', 'Hue H')}</span>
            <strong>{stop.oklch.h === null ? '—' : `${stop.oklch.h.toFixed(1)}°`}</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}
export function Scales({
  result,
  format,
  onFormat,
}: {
  result: Generated;
  format: DisplayFormat;
  onFormat: (format: DisplayFormat) => void;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState({ kind: 'brand', index: result.scale.recommendedIndex });
  const selectedScale = selected.kind === 'brand' ? result.scale : result.neutral;
  const stop = selectedScale.stops[Math.min(selected.index, selectedScale.stops.length - 1)];
  return (
    <div className="stack scales-layout">
      <div className="scales-main">
        <Card bordered={false} className="palette-card">
          <div className="section-heading">
            <div>
              <h3>
                {t('品牌色阶', 'Brand scale')}{' '}
                <Tag size="small" variant="light">
                  {t('{count} 阶', '{count} stops', { count: result.scale.stops.length })}
                </Tag>
              </h3>
              <p>
                {t(
                  '从浅到深，构建有层次的品牌表达',
                  'Build a layered brand expression from light to dark',
                )}
              </p>
            </div>
            <Radio.Group
              aria-label={t('颜色显示格式', 'Color display format')}
              theme="button"
              size="small"
              variant="default-filled"
              value={format}
              onChange={(value) => onFormat(value as DisplayFormat)}
              options={[
                { value: 'hex', label: 'HEX' },
                { value: 'rgb', label: 'RGB' },
                { value: 'oklch', label: 'OKLCH' },
              ]}
            />
          </div>
          <div className="scale-scroll-shell brand-scale-scroll">
            <ScaleStrip
              result={result.scale}
              selected={selected.kind === 'brand' ? selected.index : undefined}
              onSelect={(index) => setSelected({ kind: 'brand', index })}
              format={format}
            />
          </div>
          <p className="scale-scroll-hint brand-scale-hint">
            {t('左右滑动查看更多色阶', 'Scroll horizontally to see more stops')}
          </p>
          <p className="scale-density-note">
            {t(
              '紧凑显示 · 点击色块在详情中查看完整颜色值',
              'Compact view · Select a swatch to inspect its full value',
            )}
          </p>
          <div className="palette-legend">
            <span>
              <i>A</i> {t('输入色锚点', 'Seed anchor')}
            </span>
            <span>
              <i>R</i> {t('推荐主色', 'Recommended color')}
            </span>
            <span className="legend-note">
              <InfoCircleIcon aria-hidden="true" />{' '}
              {t('点击色块查看详情', 'Select a swatch for details')}
            </span>
          </div>
        </Card>
        <Card bordered={false} className="palette-card neutral-card">
          <div className="section-heading">
            <div>
              <h3>
                {t('品牌关联中性色', 'Brand-tinted neutrals')}{' '}
                <Tag size="small" variant="light">
                  {t('{count} 阶', '{count} stops', { count: result.neutral.stops.length })}
                </Tag>
              </h3>
              <p>
                {t(
                  '轻微融入品牌色相，用于背景、文字与边框',
                  'Subtly tinted neutrals for surfaces, text, and borders',
                )}
              </p>
            </div>
            <CopyButton
              value={result.neutral.colors.map((color) => displayColor(color, format)).join(', ')}
              label={t('复制中性色阶', 'Copy neutral scale')}
            />
          </div>
          <div className="scale-scroll-shell neutral-scale-scroll">
            <ScaleStrip
              result={result.neutral}
              selected={selected.kind === 'neutral' ? selected.index : undefined}
              onSelect={(index) => setSelected({ kind: 'neutral', index })}
              format={format}
              compact
            />
          </div>
          <p className="scale-scroll-hint neutral-scale-hint">
            {t('左右滑动查看更多色阶', 'Scroll horizontally to see more stops')}
          </p>
          <div className="neutral-labels">
            <span>{t('浅色背景', 'Light surfaces')}</span>
            <span>{t('边框与辅助元素', 'Borders and supporting UI')}</span>
            <span>{t('深色文字', 'Dark text')}</span>
          </div>
        </Card>
      </div>
      {stop && (
        <Inspector
          stop={stop}
          kind={selected.kind === 'brand' ? t('品牌色', 'Brand') : t('中性色', 'Neutral')}
        />
      )}
    </div>
  );
}
