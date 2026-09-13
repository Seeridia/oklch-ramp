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
import { useI18n } from '../i18n';

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
  const { t } = useI18n();
  const strategyText = {
    tonal: [
      t('均匀色阶', 'Tonal'),
      t(
        '重建均匀明度曲线，适合探索新主题。',
        'Rebuilds an even lightness curve for exploring new themes.',
      ),
    ],
    'adaptive-anchor': [
      t('保留主色 · 自动定位', 'Preserve seed · Auto'),
      t(
        '保留输入色，按明度自动选择阶位。',
        'Preserves the seed and selects its stop by lightness.',
      ),
    ],
    'fixed-anchor': [
      t('保留主色 · 固定阶位', 'Preserve seed · Fixed'),
      t(
        '将输入色固定在指定阶位，适合品牌规范。',
        'Places the seed at a selected stop for brand specifications.',
      ),
    ],
  } as const;
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
        <h3>
          {comparison ? t('对比设置', 'Comparison settings') : t('生成设置', 'Generation settings')}
        </h3>
        <Tag size="small" variant="light">
          {t('实时更新', 'Live update')}
        </Tag>
      </div>
      <SeedColorControl settings={settings} onChange={onChange} error={error} />
      <Divider />
      <Field label={comparison ? t('OKRamp 策略', 'OKRamp strategy') : t('生成策略', 'Strategy')}>
        <Select
          aria-label={t('生成策略', 'Generation strategy')}
          value={settings.strategy}
          options={STRATEGIES.map((s) => ({ value: s.value, label: strategyText[s.value][0] }))}
          onChange={(value) => update('strategy', value as Settings['strategy'])}
        />
        <p className="field-hint">{strategyText[settings.strategy][1]}</p>
      </Field>
      {!comparison && (
        <>
          <Field label={t('品牌色阶', 'Brand stops')} hint={t('3 – 20 阶', '3–20 stops')}>
            <InputNumber
              aria-label={t('品牌色阶数', 'Number of brand stops')}
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
                    anchorIndex: Math.min(
                      settings.anchorIndex,
                      value - (settings.endpoints === 'black-white' ? 2 : 1),
                    ),
                  });
              }}
            />
          </Field>
          {settings.steps < 10 && (
            <p className="field-hint">
              {t(
                '当前为色阶模式。生成主题需要至少 10 阶。',
                'Scale-only mode. Themes require at least 10 stops.',
              )}
            </p>
          )}
        </>
      )}
      {settings.strategy === 'fixed-anchor' && (
        <Field label={t('输入色锚点', 'Seed anchor')}>
          <Select
            aria-label={t('输入色锚点', 'Seed anchor')}
            value={settings.anchorIndex}
            options={Array.from({ length: settings.steps }, (_, index) => ({
              label: t('第 {index} 阶', 'Stop {index}', { index: index + 1 }),
              value: index,
              disabled:
                settings.endpoints === 'black-white' &&
                (index === 0 || index === settings.steps - 1),
            }))}
            onChange={(value) => update('anchorIndex', Number(value))}
          />
        </Field>
      )}
      {!comparison && (
        <>
          <Field label={t('中性色阶', 'Neutral stops')}>
            <Radio.Group
              aria-label={t('中性色阶', 'Neutral stops')}
              theme="button"
              variant="default-filled"
              value={settings.neutralSteps}
              onChange={(value) => update('neutralSteps', Number(value) as 10 | 14)}
              options={[
                { label: t('10 阶', '10 stops'), value: 10 },
                { label: t('14 阶', '14 stops'), value: 14 },
              ]}
            />
          </Field>
          <Field label={t('对比度策略', 'Contrast policy')}>
            <Select
              aria-label={t('对比度策略', 'Contrast policy')}
              value={settings.contrastPolicy}
              options={[
                { label: t('仅报告', 'Report only'), value: 'report' },
                { label: t('自动调整', 'Adjust'), value: 'adjust' },
                { label: t('严格校验', 'Strict'), value: 'strict' },
              ]}
              onChange={(value) => update('contrastPolicy', value as Settings['contrastPolicy'])}
            />
          </Field>
          <Collapse className="advanced-settings" borderless expandIconPlacement="right">
            <Collapse.Panel
              value="advanced"
              header={t('高级设置{count}', 'Advanced settings{count}', {
                count: advancedCount
                  ? t(' · {count} 项已调整', ' · {count} changed', { count: advancedCount })
                  : '',
              })}
            >
              <Field label={t('端点方式', 'Endpoints')}>
                <Select
                  aria-label={t('端点方式', 'Endpoints')}
                  value={settings.endpoints}
                  options={[
                    { label: t('曲线端点', 'Curve endpoints'), value: 'curve' },
                    { label: t('纯白 / 纯黑', 'White / black'), value: 'black-white' },
                  ]}
                  onChange={(value) =>
                    onChange({
                      ...settings,
                      endpoints: value as Settings['endpoints'],
                      anchorIndex:
                        value === 'black-white'
                          ? Math.max(1, Math.min(settings.anchorIndex, settings.steps - 2))
                          : settings.anchorIndex,
                    })
                  }
                />
              </Field>
              <Field label={t('色相偏移', 'Hue shift')} hint="°">
                <div className="advanced-slider-row">
                  <Slider
                    aria-label={t('色相偏移', 'Hue shift')}
                    value={settings.hueShift}
                    min={-60}
                    max={60}
                    onChange={(value) => update('hueShift', Number(value))}
                  />
                  <InputNumber
                    aria-label={t('色相偏移', 'Hue shift')}
                    value={settings.hueShift}
                    min={-60}
                    max={60}
                    onChange={(value) => {
                      if (typeof value === 'number') update('hueShift', value);
                    }}
                  />
                </div>
              </Field>
              <Field label={t('中性色染色', 'Neutral tint')}>
                <div className="advanced-slider-row">
                  <Slider
                    aria-label={t('中性色染色', 'Neutral tint')}
                    value={settings.tintStrength}
                    min={0}
                    max={0.08}
                    step={0.001}
                    onChange={(value) => update('tintStrength', Number(value))}
                  />
                  <InputNumber
                    aria-label={t('中性色染色', 'Neutral tint')}
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
                <Field label={t('普通文本目标', 'Body text target')} hint={t('对比度', 'Contrast')}>
                  <InputNumber
                    aria-label={t('普通文本对比度目标', 'Body text contrast target')}
                    value={settings.normalText}
                    min={1}
                    max={21}
                    step={0.5}
                    onChange={(value) => {
                      if (typeof value === 'number') update('normalText', value);
                    }}
                  />
                </Field>
                <Field label={t('非文本目标', 'Non-text target')} hint={t('对比度', 'Contrast')}>
                  <InputNumber
                    aria-label={t('非文本对比度目标', 'Non-text contrast target')}
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
    </div>
  );
}

export function SeedColorControl({
  settings,
  onChange,
  error,
  inputId = 'seed-color',
  inline = false,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  error: string;
  inputId?: string;
  inline?: boolean;
}) {
  const { t } = useI18n();
  const update = (_key: 'seed', value: string) => onChange({ ...settings, seed: value });
  return (
    <div className={inline ? 'seed-toolbar' : undefined}>
      <Field
        label={t('主色', 'Seed color')}
        hint={inline ? undefined : 'Seed color'}
        htmlFor={inputId}
      >
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
            aria-label={t('主色值', 'Seed color value')}
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
          {inline && <span className="seed-presets-label">{t('预设颜色', 'Presets')}</span>}
          {PRESETS.map((color) => (
            <button
              type="button"
              key={color}
              aria-label={t('使用 {color}', 'Use {color}', { color })}
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
