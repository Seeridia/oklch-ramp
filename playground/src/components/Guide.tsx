import { useEffect, useMemo, useState, type MouseEvent, type ReactElement } from 'react';
import { Alert, Button, Tag } from 'tdesign-react';
import { readUrlParam, updateUrlParams, urlWithParams } from '../url-state';
import { CopyButton, ScaleStrip } from './Scales';
import { generateColorScale } from 'oklch-ramp';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);

type GuideId = 'start' | 'scales' | 'themes' | 'tdesign' | 'api' | 'diagnostics';

const DOCUMENTS: Array<{
  id: GuideId;
  label: string;
  title: string;
  description: string;
  sections: Array<{ id: string; label: string }>;
}> = [
  {
    id: 'start',
    label: '快速开始',
    title: '安装与快速开始',
    description: '安装 OKRamp，选择合适的生成入口，并正确消费第一份颜色结果。',
    sections: [
      { id: 'start-install', label: '安装' },
      { id: 'start-first-scale', label: '生成第一条色阶' },
      { id: 'start-choose-api', label: '选择 API' },
      { id: 'start-runtime', label: '运行环境' },
    ],
  },
  {
    id: 'scales',
    label: '色阶生成',
    title: '品牌色阶生成',
    description: '了解颜色输入、生成策略、全部配置项、返回结构和自定义曲线。',
    sections: [
      { id: 'scales-input', label: '颜色输入' },
      { id: 'scales-strategies', label: '三种策略' },
      { id: 'scales-options', label: 'ColorScaleOptions' },
      { id: 'scales-result', label: 'ColorScaleResult' },
      { id: 'scales-curves', label: '自定义曲线' },
    ],
  },
  {
    id: 'themes',
    label: '主题系统',
    title: '中性色与语义主题',
    description: '从原始色阶建立浅色、深色语义角色，并处理界面对比度。',
    sections: [
      { id: 'themes-neutral', label: '中性色阶' },
      { id: 'themes-generate', label: '生成主题' },
      { id: 'themes-semantic', label: '语义角色' },
      { id: 'themes-contrast', label: '对比度策略' },
      { id: 'themes-output', label: '主题返回结构' },
    ],
  },
  {
    id: 'tdesign',
    label: 'TDesign 接入',
    title: '接入 TDesign React',
    description: '通过导出文件或运行时适配，将 OKRamp 语义主题映射为 TDesign Token。',
    sections: [
      { id: 'tdesign-boundary', label: '适配边界' },
      { id: 'tdesign-export', label: '使用导出文件' },
      { id: 'tdesign-runtime', label: '运行时映射' },
      { id: 'tdesign-dark', label: '深色主题' },
      { id: 'tdesign-scope', label: 'Token 范围' },
    ],
  },
  {
    id: 'api',
    label: 'API 参考',
    title: 'API 与 TypeScript 参考',
    description: '查询包入口导出的函数、辅助工具和常用类型。',
    sections: [
      { id: 'api-scale', label: 'generateColorScale' },
      { id: 'api-neutral', label: 'generateNeutralScale' },
      { id: 'api-theme', label: 'generateColorTheme' },
      { id: 'api-contrast', label: '对比度工具' },
      { id: 'api-types', label: '类型导入' },
    ],
  },
  {
    id: 'diagnostics',
    label: '诊断与错误',
    title: '诊断、错误与输出稳定性',
    description: '区分可继续使用的诊断消息与需要中止流程的异常。',
    sections: [
      { id: 'diagnostics-read', label: '读取诊断' },
      { id: 'diagnostics-codes', label: '诊断代码' },
      { id: 'diagnostics-errors', label: 'ColorScaleError' },
      { id: 'diagnostics-gamut', label: '色域映射' },
      { id: 'diagnostics-stability', label: '版本与稳定性' },
    ],
  },
];

function Code({
  children,
  language = 'typescript',
}: {
  children: string;
  language?: 'typescript' | 'bash';
}) {
  const highlighted = useMemo(
    () => hljs.highlight(children, { language }).value,
    [children, language],
  );
  return (
    <div className="guide-code">
      <div className="guide-code-toolbar">
        <span>{language === 'bash' ? 'Shell' : 'TypeScript'}</span>
        <CopyButton value={children} label="复制代码" />
      </div>
      <pre className="code-block" tabIndex={0} aria-label={`${language} 示例代码`}>
        <code className="hljs" translate="no" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

function Definitions({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="guide-definitions">
      {items.map(([term, description]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  );
}

function StartDocument() {
  const example = useMemo(() => generateColorScale('#0052D9'), []);
  return (
    <>
      <section id="start-install" className="guide-doc-section">
        <h2>安装</h2>
        <p>
          OKRamp 是 ESM-only 的 TypeScript Library，npm 包名为 <code>oklch-ramp</code>。
        </p>
        <Code language="bash">npm install oklch-ramp</Code>
      </section>
      <section id="start-first-scale" className="guide-doc-section">
        <h2>生成第一条色阶</h2>
        <Code>{`import { generateColorScale } from 'oklch-ramp';

const result = generateColorScale('#0052D9');

console.log(result.colors);
console.log(result.colors[result.recommendedIndex]);
console.log(result.diagnostics.messages);`}</Code>
        <figure className="guide-scale-example">
          <figcaption>上述代码的生成结果 · 点击色块复制颜色</figcaption>
          <ScaleStrip result={example} compact />
        </figure>
        <p>
          <code>colors</code>{' '}
          是便于直接使用的颜色数组；产品通常还应读取推荐阶位和诊断，而不是假定某个固定数组位置永远代表品牌主色。
        </p>
      </section>
      <section id="start-choose-api" className="guide-doc-section">
        <h2>选择 API</h2>
        <Definitions
          items={[
            ['generateColorScale', '只需要一条按感知明度排列的品牌色阶时使用。'],
            ['generateNeutralScale', '需要带轻微品牌倾向的中性色阶时使用。'],
            ['generateColorTheme', '需要品牌色阶、中性色阶和浅色或深色语义角色时使用。'],
          ]}
        />
        <Alert
          theme="info"
          message="颜色引擎不依赖 React、TDesign 或 DOM。组件库接入应放在应用适配层。"
        />
      </section>
      <section id="start-runtime" className="guide-doc-section">
        <h2>运行环境</h2>
        <ul>
          <li>Node.js 20 及以上。</li>
          <li>支持 ESM 的现代浏览器构建工具。</li>
          <li>包内包含 TypeScript 类型声明。</li>
          <li>核心生成函数不读取浏览器状态，也不产生 DOM 副作用。</li>
        </ul>
      </section>
    </>
  );
}

function ScalesDocument() {
  return (
    <>
      <section id="scales-input" className="guide-doc-section">
        <h2>颜色输入</h2>
        <p>
          输入为 Culori 可识别的 CSS 颜色字符串，包括 HEX、RGB、HSL 与
          OKLCH。输出是实体不透明色；输入 Alpha 会被忽略并产生诊断。
        </p>
        <Code>{`generateColorScale('#0052D9');
generateColorScale('rgb(0 82 217)');
generateColorScale('hsl(217 100% 43%)');
generateColorScale('oklch(0.52 0.22 260)');`}</Code>
      </section>
      <section id="scales-strategies" className="guide-doc-section">
        <h2>三种策略</h2>
        <div className="guide-strategies">
          <section>
            <Tag theme="primary" variant="light">
              tonal · 默认
            </Tag>
            <p>
              提取输入色的色相和彩度，重建完整明度曲线。输入色不保证原样出现，适合探索和处理质量不确定的输入。
            </p>
          </section>
          <section>
            <Tag variant="light">adaptive-anchor</Tag>
            <p>保留规范化后的输入色，并根据感知明度自动选择锚点。</p>
          </section>
          <section>
            <Tag variant="light">fixed-anchor</Tag>
            <p>将输入色固定在 anchorIndex。索引从 0 开始，默认 5 表示第 6 阶。</p>
          </section>
        </div>
      </section>
      <section id="scales-options" className="guide-doc-section">
        <h2>ColorScaleOptions</h2>
        <Definitions
          items={[
            ['steps', '3–20，默认 10。稳定的 v1 视觉预设为 10 阶。'],
            ['strategy', 'tonal、adaptive-anchor 或 fixed-anchor。'],
            ['anchorIndex', '仅用于 fixed-anchor，从 0 开始。'],
            ['output', 'hex、rgb 或 oklch，默认 hex。'],
            ['gamutMapping', '当前支持 chroma-reduction。'],
            ['hueShift', '统一色相偏移，或与阶数等长的偏移数组。'],
            ['lightnessCurve', '严格递减、值域为 0–1、长度等于 steps 的数组。'],
            ['chromaCurve', '非负的种子彩度倍率数组，长度等于 steps。'],
          ]}
        />
      </section>
      <section id="scales-result" className="guide-doc-section">
        <h2>ColorScaleResult</h2>
        <Code>{`const result = generateColorScale('#0052D9', {
  strategy: 'adaptive-anchor',
  output: 'hex',
});

result.seed.input;          // 原始输入
result.seed.normalized;     // sRGB 规范化颜色
result.seed.oklch;          // 结构化 OKLCH
result.strategy;
result.anchorIndex;         // 输入色位置或 null
result.recommendedIndex;    // 推荐品牌主色位置
result.colors;              // string[]
result.stops;               // 每阶详细信息
result.diagnostics;`}</Code>
        <p>
          每个 <code>ColorStop</code> 包含 index、label、color、oklch、inGamut 和 source。source
          可用于区分输入色、生成色与经过色域映射的颜色。
        </p>
      </section>
      <section id="scales-curves" className="guide-doc-section">
        <h2>自定义曲线</h2>
        <p>只有在产品拥有明确的色阶规范时才需要覆盖曲线。两条数组都必须与 steps 等长。</p>
        <Code>{`generateColorScale('#0052D9', {
  steps: 5,
  lightnessCurve: [0.96, 0.82, 0.64, 0.43, 0.24],
  chromaCurve: [0.15, 0.45, 1, 0.82, 0.55],
});`}</Code>
      </section>
    </>
  );
}

function ThemesDocument() {
  return (
    <>
      <section id="themes-neutral" className="guide-doc-section">
        <h2>中性色阶</h2>
        <Code>{`const neutral = generateNeutralScale('#0052D9', {
  steps: 14,
  tintStrength: 0.025,
  hue: 'seed',
  output: 'hex',
});`}</Code>
        <Definitions
          items={[
            ['steps', '只能为 10 或 14，默认 14。'],
            ['tintStrength', '最大 OKLCH 彩度，默认 0.025，上限 0.08。'],
            ['hue', '使用 seed 色相，或指定一个角度。'],
            ['lightnessCurve', '自定义中性色明度曲线。'],
          ]}
        />
      </section>
      <section id="themes-generate" className="guide-doc-section">
        <h2>生成主题</h2>
        <Code>{`const result = generateColorTheme('#0052D9', {
  mode: 'both',
  scale: { strategy: 'tonal', steps: 10 },
  neutral: { steps: 14, tintStrength: 0.025 },
  contrast: { normalText: 4.5, nonText: 3 },
  contrastPolicy: 'adjust',
});`}</Code>
        <Alert
          theme="info"
          message="语义主题要求品牌色阶至少 10 阶，以便为 default、hover、active 等角色分配不同颜色。"
        />
      </section>
      <section id="themes-semantic" className="guide-doc-section">
        <h2>语义角色</h2>
        <Definitions
          items={[
            [
              'brand',
              'default、hover、active、disabled、subtle、text、border、focusRing、onBrand 等品牌角色。',
            ],
            ['background', 'page、container、elevated 和 disabled。'],
            ['text', 'primary、secondary、placeholder、disabled、inverse、link 和 linkHover。'],
            ['border', 'default、subtle、strong 和 focus。'],
          ]}
        />
        <p>深色主题使用独立映射，不是将浅色色阶倒序。</p>
      </section>
      <section id="themes-contrast" className="guide-doc-section">
        <h2>对比度策略</h2>
        <Definitions
          items={[
            ['report', '保留语义映射并报告对比度结果。'],
            ['adjust', '从已有色阶选择距离最近且达到目标的颜色。'],
            ['strict', '仍有失败项时抛出 CONTRAST_TARGET_UNMET。'],
          ]}
        />
        <p>默认普通文本目标为 4.5:1，重要非文本元素目标为 3:1。</p>
      </section>
      <section id="themes-output" className="guide-doc-section">
        <h2>主题返回结构</h2>
        <Code>{`result.seed;
result.scales.brand;
result.scales.neutral;
result.themes.light?.color;
result.themes.dark?.color;
result.diagnostics.contrastChecks;`}</Code>
      </section>
    </>
  );
}

function TDesignDocument() {
  return (
    <>
      <section id="tdesign-boundary" className="guide-doc-section">
        <h2>适配边界</h2>
        <p>
          核心 npm 包不依赖 TDesign，也不导出 <code>--td-*</code> Token。演示站的 Adapter 将 OKRamp
          语义角色映射为 TDesign React 变量。
        </p>
      </section>
      <section id="tdesign-export" className="guide-doc-section">
        <h2>使用导出文件</h2>
        <ol>
          <li>在工作台配置主色、策略、中性色和对比度。</li>
          <li>在导出面板选择 TDesign、CSS 以及需要的主题模式。</li>
          <li>保存生成的 CSS，并在 TDesign 默认样式之后加载。</li>
        </ol>
        <Code>{`import 'tdesign-react/dist/tdesign.css';
import './okramp-theme.css';`}</Code>
        <p>导出的语义变量引用品牌色阶和中性色阶原语，便于追踪 Token 来源。</p>
      </section>
      <section id="tdesign-runtime" className="guide-doc-section">
        <h2>运行时映射</h2>
        <Code>{`const generated = generateColorTheme('#0052D9', {
  mode: 'both',
  contrastPolicy: 'adjust',
});

const light = generated.themes.light!;
const tokens = {
  '--td-brand-color': light.color.brand.default,
  '--td-brand-color-hover': light.color.brand.hover,
  '--td-brand-color-active': light.color.brand.active,
  '--td-brand-color-disabled': light.color.brand.disabled,
  '--td-brand-color-light': light.color.brand.subtle,
  '--td-text-color-brand': light.color.brand.text,
  '--td-bg-color-page': light.color.background.page,
  '--td-bg-color-container': light.color.background.container,
  '--td-text-color-primary': light.color.text.primary,
  '--td-border-level-1-color': light.color.border.default,
};

for (const [name, value] of Object.entries(tokens)) {
  document.documentElement.style.setProperty(name, value);
}`}</Code>
      </section>
      <section id="tdesign-dark" className="guide-doc-section">
        <h2>深色主题</h2>
        <Code>{`document.documentElement.setAttribute('theme-mode', 'dark');

// 恢复浅色
document.documentElement.setAttribute('theme-mode', 'light');`}</Code>
        <p>
          同时导出两种模式时，浅色变量位于 :root，深色变量位于 <code>:root[theme-mode="dark"]</code>
          。
        </p>
      </section>
      <section id="tdesign-scope" className="guide-doc-section">
        <h2>Token 范围</h2>
        <p>
          当前适配覆盖品牌、背景、文字和边框语义，以及组件需要的相关容器变量。成功、警告和错误状态色沿用
          TDesign 官方默认值。
        </p>
        <Alert
          theme="warning"
          message="升级 TDesign 后应重新核对变量名称和组件状态。Adapter 是应用代码，版本应与所用 TDesign 版本一起维护。"
        />
      </section>
    </>
  );
}

function ApiDocument() {
  return (
    <>
      <section id="api-scale" className="guide-doc-section">
        <h2>generateColorScale</h2>
        <Code>{`function generateColorScale(
  seed: string,
  options?: ColorScaleOptions,
): ColorScaleResult`}</Code>
        <p>生成品牌色阶。默认使用 tonal 策略、10 个阶位和 HEX 输出。</p>
      </section>
      <section id="api-neutral" className="guide-doc-section">
        <h2>generateNeutralScale</h2>
        <Code>{`function generateNeutralScale(
  seed: string,
  options?: NeutralScaleOptions,
): ColorScaleResult`}</Code>
        <p>生成 10 或 14 阶品牌关联中性色，并返回与品牌色阶一致的结果结构。</p>
      </section>
      <section id="api-theme" className="guide-doc-section">
        <h2>generateColorTheme</h2>
        <Code>{`function generateColorTheme(
  seed: string,
  options?: ColorThemeOptions,
): ColorThemeResult`}</Code>
        <p>生成品牌与中性色阶，以及 mode 指定的 light、dark 或两种语义主题。</p>
      </section>
      <section id="api-contrast" className="guide-doc-section">
        <h2>对比度工具</h2>
        <Code>{`relativeLuminance('#0052D9');
contrastRatio('#ffffff', '#0052D9');
chooseContrastingForeground('#0052D9');`}</Code>
        <p>
          实现基于 WCAG 2.x 的 sRGB 相对亮度。contrastRatio
          支持将半透明前景合成到不透明背景；半透明背景会被拒绝。
        </p>
      </section>
      <section id="api-types" className="guide-doc-section">
        <h2>类型导入</h2>
        <Code>{`import type {
  ColorScaleOptions,
  ColorScaleResult,
  ColorStop,
  ColorThemeOptions,
  ColorThemeResult,
  ContrastPolicy,
  Diagnostics,
  NeutralScaleOptions,
  ScaleStrategy,
  SemanticTheme,
} from 'oklch-ramp';`}</Code>
        <div className="guide-links">
          <Button
            href="https://github.com/Seeridia/oklch-ramp/blob/main/docs/API.md"
            target="_blank"
            variant="outline"
          >
            仓库 API 文档
          </Button>
        </div>
      </section>
    </>
  );
}

function DiagnosticsDocument() {
  return (
    <>
      <section id="diagnostics-read" className="guide-doc-section">
        <h2>读取诊断</h2>
        <Code>{`const result = generateColorScale('#f8fbff', {
  strategy: 'fixed-anchor',
});

for (const message of result.diagnostics.messages) {
  console.log(message.code, message.severity, message.message);
}`}</Code>
        <p>
          合法但不理想的输入会返回消息，结果仍可使用。每条消息还可能包含 stopIndexes 和 details。
        </p>
      </section>
      <section id="diagnostics-codes" className="guide-doc-section">
        <h2>诊断代码</h2>
        <Definitions
          items={[
            ['输入', 'ALPHA_IGNORED、SEED_TOO_LIGHT、SEED_TOO_DARK、SEED_LOW_CHROMA。'],
            ['色域', 'SEED_OUT_OF_GAMUT、GAMUT_MAPPED。'],
            ['色阶', 'DUPLICATE_STOPS、LOW_ADJACENT_DIFFERENCE、ANCHOR_MOVED。'],
            ['主题', 'CONTRAST_TARGET_UNMET。'],
          ]}
        />
      </section>
      <section id="diagnostics-errors" className="guide-doc-section">
        <h2>ColorScaleError</h2>
        <Code>{`try {
  generateColorTheme('invalid', { contrastPolicy: 'strict' });
} catch (error) {
  if (error instanceof ColorScaleError) {
    console.error(error.code, error.details);
  }
}`}</Code>
        <p>稳定错误码为 INVALID_COLOR、INVALID_OPTIONS 和 CONTRAST_TARGET_UNMET。</p>
      </section>
      <section id="diagnostics-gamut" className="guide-doc-section">
        <h2>色域映射</h2>
        <p>
          当前实现保持 OKLCH 明度与色相，通过降低彩度将颜色映射到 sRGB。fixed-anchor 和
          adaptive-anchor 保留的是规范化后的 sRGB 输入色。
        </p>
      </section>
      <section id="diagnostics-stability" className="guide-doc-section">
        <h2>版本与输出稳定性</h2>
        <p>
          算法升级可能改变具体
          HEX。需要稳定视觉结果时，请锁定依赖版本，并在产品侧保留关键主题快照或视觉基线。
        </p>
      </section>
    </>
  );
}

const CONTENT: Record<GuideId, () => ReactElement> = {
  start: StartDocument,
  scales: ScalesDocument,
  themes: ThemesDocument,
  tdesign: TDesignDocument,
  api: ApiDocument,
  diagnostics: DiagnosticsDocument,
};

export function Guide() {
  const initial = readUrlParam('guideDoc', 'start') as GuideId;
  const [documentId, setDocumentId] = useState<GuideId>(() =>
    DOCUMENTS.some((document) => document.id === initial) ? initial : 'start',
  );
  const currentDocument = DOCUMENTS.find((item) => item.id === documentId)!;
  const Content = CONTENT[documentId];

  useEffect(() => {
    const sync = () => {
      const value = readUrlParam('guideDoc', 'start') as GuideId;
      setDocumentId(DOCUMENTS.some((item) => item.id === value) ? value : 'start');
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    window.document.title = `${currentDocument.title} · OKRamp`;
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (currentDocument.sections.some((section) => section.id === id)) {
        window.document.getElementById(id)?.scrollIntoView({ block: 'start' });
      }
    };
    const frame = requestAnimationFrame(scrollToHash);
    window.addEventListener('hashchange', scrollToHash);
    window.addEventListener('popstate', scrollToHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', scrollToHash);
      window.removeEventListener('popstate', scrollToHash);
    };
  }, [currentDocument]);

  const selectDocument = (event: MouseEvent<HTMLAnchorElement>, id: GuideId) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    setDocumentId(id);
    updateUrlParams({ guideDoc: id === 'start' ? null : id });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    requestAnimationFrame(() =>
      window.document.getElementById('main-content')?.scrollIntoView({ block: 'start' }),
    );
  };

  return (
    <div className="guide-docs-shell">
      <aside className="guide-doc-nav" aria-label="指南文档">
        <strong>使用指南</strong>
        <nav>
          {DOCUMENTS.map((item) => (
            <a
              key={item.id}
              href={
                urlWithParams({
                  page: 'guide',
                  guideDoc: item.id === 'start' ? null : item.id,
                }).split('#')[0]
              }
              className={item.id === documentId ? 'is-active' : undefined}
              aria-current={item.id === documentId ? 'page' : undefined}
              onClick={(event) => selectDocument(event, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="guide-document">
        <header className="guide-document-header">
          <span className="eyebrow">OKRAMP DOCUMENTATION</span>
          <h1>{currentDocument.title}</h1>
          <p>{currentDocument.description}</p>
        </header>
        <Content />
      </article>

      <aside className="guide-outline" aria-label="当前文档大纲">
        <strong>本篇大纲</strong>
        <nav>
          {currentDocument.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}
