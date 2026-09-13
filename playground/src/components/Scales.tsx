import { useEffect, useRef, useState } from 'react';
import { Button, Card, Radio, Tag, Tooltip, MessagePlugin } from 'tdesign-react';
import { CopyIcon, InfoCircleIcon, CheckIcon } from 'tdesign-icons-react';
import { chooseContrastingForeground, type ColorScaleResult, type ColorStop } from 'oklch-ramp';
import { displayColor, type DisplayFormat, type Generated } from '../model';
export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    await MessagePlugin.success('已复制到剪贴板');
  } catch {
    await MessagePlugin.error('复制失败，请在导出面板中手动选择并复制');
  }
}
export function CopyButton({ value, label = '复制颜色值' }: { value: string; label?: string }) {
  return (
    <Tooltip content={label}>
      <Button
        aria-label={label}
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
          aria-label={`第 ${stop.label} 阶 ${stop.color}`}
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
                  ? '输入色'
                  : result.recommendedIndex === stop.index
                    ? '推荐主色'
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
  return (
    <Card className="inspector-card" bordered={false}>
      <div className="inspector-heading">
        <div>
          <span className="eyebrow">COLOR INSPECTOR</span>
          <h3>
            色彩详情{' '}
            <span>
              {kind} · 第 {stop.label} 阶
            </span>
          </h3>
        </div>
        <Tag variant="light" theme={stop.source === 'seed' ? 'primary' : 'default'}>
          {stop.source === 'seed'
            ? '输入色'
            : stop.source === 'gamut-mapped'
              ? '色域映射'
              : '算法生成'}
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
                label={`复制 ${format.toUpperCase()}`}
              />
            </div>
          ))}
        </div>
        <div className="color-metrics">
          <div>
            <span>明度 L</span>
            <strong>{stop.oklch.l.toFixed(3)}</strong>
          </div>
          <div>
            <span>彩度 C</span>
            <strong>{stop.oklch.c.toFixed(3)}</strong>
          </div>
          <div>
            <span>色相 H</span>
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
                品牌色阶{' '}
                <Tag size="small" variant="light">
                  {result.scale.stops.length} 阶
                </Tag>
              </h3>
              <p>从浅到深，构建有层次的品牌表达</p>
            </div>
            <Radio.Group
              aria-label="颜色显示格式"
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
          <p className="scale-scroll-hint brand-scale-hint">左右滑动查看更多色阶</p>
          <p className="scale-density-note">紧凑显示 · 点击色块在详情中查看完整颜色值</p>
          <div className="palette-legend">
            <span>
              <i>A</i> 输入色锚点
            </span>
            <span>
              <i>R</i> 推荐主色
            </span>
            <span className="legend-note">
              <InfoCircleIcon aria-hidden="true" /> 点击色块查看详情
            </span>
          </div>
        </Card>
        <Card bordered={false} className="palette-card neutral-card">
          <div className="section-heading">
            <div>
              <h3>
                品牌关联中性色{' '}
                <Tag size="small" variant="light">
                  {result.neutral.stops.length} 阶
                </Tag>
              </h3>
              <p>轻微融入品牌色相，用于背景、文字与边框</p>
            </div>
            <CopyButton
              value={result.neutral.colors.map((color) => displayColor(color, format)).join(', ')}
              label="复制中性色阶"
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
          <p className="scale-scroll-hint neutral-scale-hint">左右滑动查看更多色阶</p>
          <div className="neutral-labels">
            <span>浅色背景</span>
            <span>边框与辅助元素</span>
            <span>深色文字</span>
          </div>
        </Card>
      </div>
      {stop && <Inspector stop={stop} kind={selected.kind === 'brand' ? '品牌色' : '中性色'} />}
    </div>
  );
}
