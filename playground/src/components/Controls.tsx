import {
  ColorPicker,
  Input,
  Select,
  InputNumber,
  Radio,
  Slider,
  Collapse,
  Divider,
  Tag,
} from 'tdesign-react';
import type { Settings } from '../model';
import { PRESETS, STRATEGIES } from '../model';
import type { ReactNode } from 'react';
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}
export function Controls({
  settings,
  onChange,
  error,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  error: string;
}) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });
  const advancedCount = [
    settings.hueShift !== 0,
    settings.tintStrength !== 0.025,
    settings.normalText !== 4.5,
    settings.nonText !== 3,
  ].filter(Boolean).length;
  return (
    <div className="controls-content">
      <div className="panel-title">
        <h3>生成设置</h3>
        <Tag size="small" variant="light">
          实时更新
        </Tag>
      </div>
      <Field label="主色" hint="Seed color">
        <div className="seed-input">
          <div className="picker-control">
            <ColorPicker
              value={settings.seed}
              onChange={(value) => update('seed', value)}
              enableAlpha={false}
              colorModes={['monochrome']}
              inputProps={{ readonly: true, showInput: false }}
              format="HEX"
              showPrimaryColorPreview={false}
            />
          </div>
          <Input
            aria-label="主色值"
            value={settings.seed}
            onChange={(value) => update('seed', value)}
            status={error ? 'error' : undefined}
            placeholder="#0052D9"
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="presets">
          {PRESETS.map((color) => (
            <button
              type="button"
              key={color}
              aria-label={`使用 ${color}`}
              aria-pressed={settings.seed.toLowerCase() === color.toLowerCase()}
              title={color}
              style={{ background: color }}
              onClick={() => update('seed', color)}
            />
          ))}
        </div>
      </Field>
      <Divider />
      <Field label="生成策略">
        <Select
          aria-label="生成策略"
          value={settings.strategy}
          options={STRATEGIES.map((s) => ({ value: s.value, label: s.label }))}
          onChange={(value) => update('strategy', value as Settings['strategy'])}
        />
        <p className="field-hint">
          {STRATEGIES.find((s) => s.value === settings.strategy)?.description}
        </p>
      </Field>
      <Field label="品牌色阶" hint="3 – 20 阶">
        <InputNumber
          aria-label="品牌色阶数"
          value={settings.steps}
          min={3}
          max={20}
          decimalPlaces={0}
          theme="row"
          onChange={(value) => {
            if (typeof value === 'number')
              onChange({
                ...settings,
                steps: value,
                anchorIndex: Math.min(settings.anchorIndex, value - 1),
              });
          }}
        />
      </Field>
      {settings.steps < 10 && (
        <p className="field-hint">当前为色阶模式。生成主题需要至少 10 阶。</p>
      )}
      {settings.strategy === 'fixed-anchor' && (
        <Field label="输入色锚点">
          <Select
            aria-label="输入色锚点"
            value={settings.anchorIndex}
            options={Array.from({ length: settings.steps }, (_, index) => ({
              label: `第 ${index + 1} 阶`,
              value: index,
            }))}
            onChange={(value) => update('anchorIndex', Number(value))}
          />
        </Field>
      )}
      <Field label="中性色阶">
        <Radio.Group
          theme="button"
          variant="default-filled"
          value={settings.neutralSteps}
          onChange={(value) => update('neutralSteps', Number(value) as 10 | 14)}
          options={[
            { label: '10 阶', value: 10 },
            { label: '14 阶', value: 14 },
          ]}
        />
      </Field>
      <Field label="对比度策略">
        <Select
          aria-label="对比度策略"
          value={settings.contrastPolicy}
          options={[
            { label: '仅报告', value: 'report' },
            { label: '自动调整', value: 'adjust' },
            { label: '严格校验', value: 'strict' },
          ]}
          onChange={(value) => update('contrastPolicy', value as Settings['contrastPolicy'])}
        />
      </Field>
      <Collapse borderless expandIconPlacement="right">
        <Collapse.Panel
          value="advanced"
          header={`高级设置${advancedCount ? ` · ${advancedCount} 项已调整` : ''}`}
        >
          <Field label="色相偏移" hint={`${settings.hueShift}°`}>
            <Slider
              value={settings.hueShift}
              min={-60}
              max={60}
              onChange={(value) => update('hueShift', Number(value))}
            />
            <InputNumber
              aria-label="色相偏移"
              value={settings.hueShift}
              min={-60}
              max={60}
              onChange={(value) => {
                if (typeof value === 'number') update('hueShift', value);
              }}
            />
          </Field>
          <Field label="中性色染色" hint={settings.tintStrength.toFixed(3)}>
            <Slider
              value={settings.tintStrength}
              min={0}
              max={0.08}
              step={0.001}
              onChange={(value) => update('tintStrength', Number(value))}
            />
            <InputNumber
              aria-label="中性色染色"
              value={settings.tintStrength}
              min={0}
              max={0.08}
              step={0.001}
              decimalPlaces={3}
              onChange={(value) => {
                if (typeof value === 'number') update('tintStrength', value);
              }}
            />
          </Field>
          <Field label="普通文本目标">
            <InputNumber
              aria-label="普通文本对比度目标"
              value={settings.normalText}
              min={1}
              max={21}
              step={0.5}
              onChange={(value) => {
                if (typeof value === 'number') update('normalText', value);
              }}
            />
          </Field>
          <Field label="非文本目标">
            <InputNumber
              aria-label="非文本对比度目标"
              value={settings.nonText}
              min={1}
              max={21}
              step={0.5}
              onChange={(value) => {
                if (typeof value === 'number') update('nonText', value);
              }}
            />
          </Field>
        </Collapse.Panel>
      </Collapse>
      <div className="panel-note">
        基于 OKLCH 感知色彩空间
        <br />
        输出颜色均映射至 sRGB 色域
      </div>
    </div>
  );
}
