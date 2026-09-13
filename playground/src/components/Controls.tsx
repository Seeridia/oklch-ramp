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
import type { InputProps, InputRef } from 'tdesign-react';
import type { Settings } from '../model';
import { PRESETS, STRATEGIES } from '../model';
import { useEffect, useRef, type ReactNode } from 'react';

export function AccessibleInput({
  inputId,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  ...props
}: InputProps & { inputId?: string; 'aria-label'?: string; 'aria-describedby'?: string }) {
  const ref = useRef<InputRef>(null);
  useEffect(() => {
    const input = ref.current?.inputElement;
    if (!input) return;
    if (inputId) input.id = inputId;
    if (ariaLabel) input.setAttribute('aria-label', ariaLabel);
    if (describedBy) input.setAttribute('aria-describedby', describedBy);
  }, [ariaLabel, describedBy, inputId]);
  return <Input ref={ref} {...props} />;
}
export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <div className="field-label">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
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
  comparison = false,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  error: string;
  comparison?: boolean;
}) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });
  const advancedCount = [
    settings.endpoints === 'black-white',
    settings.hueShift !== 0,
    settings.tintStrength !== 0.025,
    settings.normalText !== 4.5,
    settings.nonText !== 3,
  ].filter(Boolean).length;
  return (
    <div className="controls-content">
      <div className="panel-title">
        <h3>{comparison ? '对比设置' : '生成设置'}</h3>
        <Tag size="small" variant="light">
          实时更新
        </Tag>
      </div>
      <SeedColorControl settings={settings} onChange={onChange} error={error} />
      <Divider />
      <Field label={comparison ? "OKRamp 策略" : "生成策略"}>
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
      {!comparison && (
        <>
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
                anchorIndex: Math.min(settings.anchorIndex, value - (settings.endpoints === 'black-white' ? 2 : 1)),
              });
          }}
        />
      </Field>
      {settings.steps < 10 && (
        <p className="field-hint">当前为色阶模式。生成主题需要至少 10 阶。</p>
      )}
        </>
      )}
      {settings.strategy === 'fixed-anchor' && (
        <Field label="输入色锚点">
          <Select
            aria-label="输入色锚点"
            value={settings.anchorIndex}
            options={Array.from({ length: settings.steps }, (_, index) => ({
              label: `第 ${index + 1} 阶`,
              value: index,
              disabled: settings.endpoints === 'black-white' && (index === 0 || index === settings.steps - 1),
            }))}
            onChange={(value) => update('anchorIndex', Number(value))}
          />
        </Field>
      )}
      {!comparison && (
        <>
      <Field label="中性色阶">
        <Radio.Group
          aria-label="中性色阶"
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
      <Collapse className="advanced-settings" borderless expandIconPlacement="right">
        <Collapse.Panel
          value="advanced"
          header={`高级设置${advancedCount ? ` · ${advancedCount} 项已调整` : ''}`}
        >
          <Field label="端点方式">
            <Select
              aria-label="端点方式"
              value={settings.endpoints}
              options={[
                { label: '曲线端点', value: 'curve' },
                { label: '纯白 / 纯黑', value: 'black-white' },
              ]}
              onChange={(value) => onChange({
                ...settings,
                endpoints: value as Settings['endpoints'],
                anchorIndex: value === 'black-white'
                  ? Math.max(1, Math.min(settings.anchorIndex, settings.steps - 2))
                  : settings.anchorIndex,
              })}
            />
          </Field>
          <Field label="色相偏移" hint="°">
            <div className="advanced-slider-row">
            <Slider
              aria-label="色相偏移"
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
            </div>
          </Field>
          <Field label="中性色染色">
            <div className="advanced-slider-row">
            <Slider
              aria-label="中性色染色"
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
            </div>
          </Field>
          <div className="advanced-contrast-group">
          <Field label="普通文本目标" hint="对比度">
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
          <Field label="非文本目标" hint="对比度">
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
          </div>
        </Collapse.Panel>
      </Collapse>
        </>
      )}
      <div className="panel-note">
        {comparison ? (
          <>各方案固定 10 阶；策略与锚点仅影响 OKRamp。</>
        ) : (
          <>基于 OKLCH 感知色彩空间<br />输出颜色均映射至 sRGB 色域</>
        )}
      </div>
    </div>
  );
}

export function SeedColorControl({ settings, onChange, error, inputId = 'seed-color', inline = false }: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  error: string;
  inputId?: string;
  inline?: boolean;
}) {
  const update = (_key: 'seed', value: string) => onChange({ ...settings, seed: value });
  return (
    <div className={inline ? 'seed-toolbar' : undefined}>
      <Field label="主色" hint={inline ? undefined : 'Seed color'} htmlFor={inputId}>
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
          <AccessibleInput
            inputId={inputId}
            name={inputId}
            aria-label="主色值"
            value={settings.seed}
            onChange={(value) => update('seed', value)}
            status={error ? 'error' : undefined}
            placeholder="#0052D9"
            autocomplete="off"
            spellCheck={false}
          />
        </div>
        {error && (
          <p className="field-error" role="status" aria-live="polite">
            {error}
          </p>
        )}
        <div className="presets">
          {inline && <span className="seed-presets-label">预设颜色</span>}
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
    </div>
  );
}
