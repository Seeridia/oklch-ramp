import { useState } from 'react';
import { formatHex } from 'culori';
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'tdesign-react';
import { SearchIcon, ArrowRightIcon } from 'tdesign-icons-react';
import { generateColorScale, type ColorThemeResult, type ScaleStrategy } from 'oklch-ramp';
import { TOKEN_MAP, toTDesignTheme } from '../adapters/tdesign';
import { STRATEGIES, scaleOptions, type Generated, type Settings } from '../model';
import { CopyButton, ScaleStrip } from './Scales';
export function Tokens({ theme }: { theme: ColorThemeResult }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
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
        <Input
          aria-label="搜索 Token"
          prefixIcon={<SearchIcon />}
          placeholder="搜索变量、用途或语义名称"
          value={query}
          onChange={setQuery}
          clearable
        />
        <Select
          aria-label="Token 分组"
          value={group}
          onChange={(v) => setGroup(typeof v === 'string' ? v : 'all')}
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
      all.findIndex((other) => other.code === item.code && other.message === item.message) ===
      index,
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
                title={message.code}
                message={
                  <div>
                    {message.message}
                    {message.details && (
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
export function Comparison({
  result,
  onApply,
}: {
  result: Generated;
  onApply: (strategy: ScaleStrategy) => void;
}) {
  const settings: Settings = result.settings;
  return (
    <div className="stack">
      <Alert
        theme="info"
        message="三种策略使用相同主色和公共参数。点击色块可复制颜色，选择适合的策略后应用到工作台。"
      />
      <div className="comparison-grid">
        {STRATEGIES.map((strategy) => {
          const scale = generateColorScale(settings.seed, {
            ...scaleOptions({ ...settings, strategy: strategy.value }),
            strategy: strategy.value,
          });
          return (
            <Card key={strategy.value} bordered={false}>
              <div className="comparison-title">
                <span className="eyebrow">{strategy.value.toUpperCase()}</span>
                <h3>{strategy.label}</h3>
                <p>{strategy.description}</p>
              </div>
              <ScaleStrip result={scale} compact />
              <div className="comparison-facts">
                <div>
                  <span>输入色保留</span>
                  <strong>{scale.anchorIndex === null ? '不保证' : '已保留'}</strong>
                </div>
                <div>
                  <span>锚点位置</span>
                  <strong>
                    {scale.anchorIndex === null ? '自动重建' : `第 ${scale.anchorIndex + 1} 阶`}
                  </strong>
                </div>
                <div>
                  <span>生成诊断</span>
                  <strong>{scale.diagnostics.messages.length} 项</strong>
                </div>
              </div>
              <div
                className="compare-button-sample"
                style={
                  {
                    '--td-brand-color': scale.colors[scale.recommendedIndex],
                  } as React.CSSProperties
                }
              >
                <Button theme="primary" onClick={() => onApply(strategy.value)}>
                  预览此主色
                </Button>
                <Tag variant="light">{scale.colors[scale.recommendedIndex]}</Tag>
              </div>
              <Button
                block
                theme="primary"
                variant={settings.strategy === strategy.value ? 'base' : 'outline'}
                suffix={<ArrowRightIcon />}
                onClick={() => onApply(strategy.value)}
              >
                {settings.strategy === strategy.value ? '当前策略 · 返回工作台' : '应用到工作台'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
export function Guide() {
  return (
    <div className="guide-layout">
      <Card bordered={false}>
        <span className="eyebrow">GETTING STARTED</span>
        <h2>从一个主色，到完整主题</h2>
        <p className="guide-intro">探索颜色、验证组件表现，再把主题带回你的项目。</p>
        <div className="guide-steps">
          {[
            ['输入主色', '输入 HEX、RGB 或 OKLCH 颜色，或使用拾色器和预设。'],
            ['选择策略', '均匀色阶适合探索；需要保留品牌原色时，选择自动或固定锚点。'],
            ['验证表现', '在组件预览中体验明暗主题，再检查 Token 与对比度诊断。'],
            ['导出并接入', '选择 TDesign 目标并导出 CSS，在组件库样式之后加载。'],
          ].map(([title, text], index) => (
            <div key={title}>
              <span>{index + 1}</span>
              <section>
                <h3>{title}</h3>
                <p>{text}</p>
              </section>
            </div>
          ))}
        </div>
      </Card>
      <Card bordered={false} title="TDesign 接入">
        <p>加载顺序</p>
        <pre className="code-block">{`import 'tdesign-react/dist/tdesign.css';\nimport './color-theme.css';`}</pre>
        <p>切换到深色主题</p>
        <pre className="code-block">{`document.documentElement.setAttribute(\n  'theme-mode', 'dark'\n);`}</pre>
        <Alert
          theme="info"
          message="核心颜色引擎保持框架无关。当前 TDesign 适配器属于演示应用，覆盖品牌、背景、文字与边框语义；状态色沿用官方默认值。"
        />
      </Card>
      <Card bordered={false} title="核心 API">
        <pre className="code-block">{`generateColorScale('#0052D9', {\n  strategy: 'tonal',\n  steps: 10,\n});\n\ngenerateColorTheme('#0052D9', {\n  mode: 'both',\n  contrastPolicy: 'adjust',\n});`}</pre>
        <Space>
          <Button href="https://github.com/Seeridia/oklch-ramp" target="_blank" variant="outline">
            项目文档
          </Button>
          <Button
            href="https://tdesign.tencent.com/react/overview"
            target="_blank"
            theme="primary"
            variant="text"
          >
            TDesign React 文档
          </Button>
        </Space>
      </Card>
      <Card bordered={false} title="使用提示">
        <ul className="guide-tips">
          <li>推荐主色与输入色锚点可能不同；A 表示输入色，R 表示算法推荐色。</li>
          <li>3–9 阶仅生成色阶；主题与 TDesign 导出需要至少 10 阶。</li>
          <li>深色主题采用独立语义映射，不是将浅色色阶倒序。</li>
          <li>严格校验失败时保留上次有效结果，并暂停导出。</li>
          <li>方案保存在当前浏览器，清除站点数据后无法恢复。</li>
        </ul>
      </Card>
    </div>
  );
}
