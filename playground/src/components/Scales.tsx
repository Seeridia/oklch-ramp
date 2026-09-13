import { useState } from 'react';
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
        icon={<CopyIcon />}
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
  return (
    <div
      className={`scale-strip ${compact ? 'compact' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${result.stops.length}, minmax(${compact ? 32 : 80}px, 1fr))`,
      }}
    >
      {result.stops.map((stop) => (
        <button
          type="button"
          className={`scale-stop ${selected === stop.index ? 'selected' : ''}`}
          key={stop.index}
          aria-label={`第 ${stop.label} 阶 ${stop.color}`}
          aria-pressed={selected === stop.index}
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
            {selected === stop.index && <CheckIcon className="selected-check" />}
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
  const [selected, setSelected] = useState({ kind: 'brand', index: 6 });
  const selectedScale = selected.kind === 'brand' ? result.scale : result.neutral;
  const stop = selectedScale.stops[Math.min(selected.index, selectedScale.stops.length - 1)];
  return (
    <div className="stack">
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
        <ScaleStrip
          result={result.scale}
          selected={selected.kind === 'brand' ? selected.index : undefined}
          onSelect={(index) => setSelected({ kind: 'brand', index })}
          format={format}
        />
        <div className="palette-legend">
          <span>
            <i>A</i> 输入色锚点
          </span>
          <span>
            <i>R</i> 推荐主色
          </span>
          <span className="legend-note">
            <InfoCircleIcon /> 点击色块查看详情
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
        <ScaleStrip
          result={result.neutral}
          selected={selected.kind === 'neutral' ? selected.index : undefined}
          onSelect={(index) => setSelected({ kind: 'neutral', index })}
          format={format}
          compact
        />
        <div className="neutral-labels">
          <span>浅色背景</span>
          <span>边框与辅助元素</span>
          <span>深色文字</span>
        </div>
      </Card>
      {stop && <Inspector stop={stop} kind={selected.kind === 'brand' ? '品牌色' : '中性色'} />}
    </div>
  );
}
