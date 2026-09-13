import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Alert, Button, Tag } from 'tdesign-react';
import { generateColorScale } from 'okramp';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import { useI18n } from '../i18n';
import { readUrlParam, updateUrlParams, urlWithParams } from '../url-state';
import { CopyButton, ScaleStrip } from './Scales';
import { StrategyDemo, GamutDemo, NeutralDemo } from './PrincipleDemos';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);

type GuideId = 'start' | 'scales' | 'principles' | 'themes' | 'tdesign' | 'api' | 'diagnostics';
type Translate = ReturnType<typeof useI18n>['t'];

interface GuideDocument {
  id: GuideId;
  label: string;
  title: string;
  description: string;
  sections: Array<[string, string]>;
}

function Code({
  children,
  language = 'typescript',
}: {
  children: string;
  language?: 'typescript' | 'bash';
}) {
  const { t } = useI18n();
  const highlighted = useMemo(
    () => hljs.highlight(children, { language }).value,
    [children, language],
  );
  return (
    <div className="guide-code">
      <div className="guide-code-toolbar">
        <span>{language === 'bash' ? 'Shell' : 'TypeScript'}</span>
        <CopyButton value={children} label={t('复制代码', 'Copy code')} />
      </div>
      <pre
        className="code-block"
        tabIndex={0}
        aria-label={t('{language} 示例代码', '{language} example', { language })}
      >
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

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="guide-doc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function StartDocument({ t }: { t: Translate }) {
  const example = useMemo(() => generateColorScale('#0052D9'), []);
  return (
    <>
      <Section id="start-install" title={t('安装', 'Install')}>
        <p>
          {t(
            'OKRamp 是仅支持 ESM 的 TypeScript 库，npm 包名为 okramp。',
            'OKRamp is an ESM-only TypeScript library published as okramp.',
          )}
        </p>
        <Code language="bash">npm install okramp</Code>
      </Section>
      <Section id="start-first-scale" title={t('生成第一条色阶', 'Generate your first scale')}>
        <Code>{`import { generateColorScale } from 'okramp';\n\nconst result = generateColorScale('#0052D9');\nconsole.log(result.colors);\nconsole.log(result.colors[result.recommendedIndex]);\nconsole.log(result.diagnostics.messages);`}</Code>
        <figure className="guide-scale-example">
          <figcaption>
            {t(
              '上述代码的生成结果 · 点击色块复制颜色',
              'Output from the example · Click a swatch to copy',
            )}
          </figcaption>
          <ScaleStrip result={example} compact />
        </figure>
        <p>
          {t(
            'colors 是便于直接使用的数组；产品还应读取 recommendedIndex 和 diagnostics，不要假定固定位置始终是品牌主色。',
            'colors is ready to use, but products should also read recommendedIndex and diagnostics instead of assuming a fixed position is always the brand color.',
          )}
        </p>
      </Section>
      <Section id="start-choose-api" title={t('选择 API', 'Choose an API')}>
        <Definitions
          items={[
            [
              'generateColorScale',
              t(
                '生成按感知明度排列的品牌色阶。',
                'Generate a brand scale ordered by perceived lightness.',
              ),
            ],
            [
              'generateNeutralScale',
              t('生成带轻微品牌倾向的中性色阶。', 'Generate a subtly brand-tinted neutral scale.'),
            ],
            [
              'generateColorTheme',
              t(
                '生成品牌色阶、中性色阶和明暗语义主题。',
                'Generate brand and neutral scales plus light and dark semantic themes.',
              ),
            ],
          ]}
        />
        <Alert
          theme="info"
          message={t(
            '颜色引擎不依赖 React、TDesign 或 DOM。组件库接入应放在应用适配层。',
            'The color engine does not depend on React, TDesign, or the DOM. Component-library integration belongs in the application adapter.',
          )}
        />
      </Section>
      <Section id="start-runtime" title={t('运行环境', 'Runtime')}>
        <ul>
          <li>{t('Node.js 20 及以上。', 'Node.js 20 or later.')}</li>
          <li>
            {t('支持 ESM 的现代浏览器构建工具。', 'A modern browser build tool with ESM support.')}
          </li>
          <li>{t('包内包含 TypeScript 类型声明。', 'TypeScript declarations are included.')}</li>
          <li>{t('核心函数没有 DOM 副作用。', 'Core functions have no DOM side effects.')}</li>
        </ul>
      </Section>
    </>
  );
}

function ScalesDocument({ t }: { t: Translate }) {
  return (
    <>
      <Section id="scales-input" title={t('颜色输入', 'Color input')}>
        <p>
          {t(
            '接受 Culori 可识别的 CSS 颜色，包括 HEX、RGB、HSL 和 OKLCH。输出为不透明颜色；输入 Alpha 会被忽略并产生诊断。',
            'Accepts CSS colors recognized by Culori, including HEX, RGB, HSL, and OKLCH. Output is opaque; input alpha is ignored and reported.',
          )}
        </p>
        <Code>{`generateColorScale('#0052D9');\ngenerateColorScale('rgb(0 82 217)');\ngenerateColorScale('hsl(217 100% 43%)');\ngenerateColorScale('oklch(0.52 0.22 260)');`}</Code>
      </Section>
      <Section id="scales-strategies" title={t('三种策略', 'Three strategies')}>
        <div className="guide-strategies">
          <section>
            <Tag theme="primary" variant="light">
              tonal · {t('默认', 'default')}
            </Tag>
            <p>
              {t(
                '提取输入色的色相和彩度并重建明度曲线。适合探索或处理质量不确定的输入。',
                'Uses seed hue and chroma to rebuild the lightness curve. Useful for exploration or uncertain inputs.',
              )}
            </p>
          </section>
          <section>
            <Tag variant="light">adaptive-anchor</Tag>
            <p>
              {t(
                '保留规范化输入色，并按感知明度自动选择锚点。',
                'Preserves the normalized seed and selects its anchor by perceived lightness.',
              )}
            </p>
          </section>
          <section>
            <Tag variant="light">fixed-anchor</Tag>
            <p>
              {t(
                '将输入色固定在 anchorIndex；索引从 0 开始。',
                'Places the seed at anchorIndex, using zero-based indexing.',
              )}
            </p>
          </section>
        </div>
      </Section>
      <Section id="scales-options" title="ColorScaleOptions">
        <Definitions
          items={[
            ['steps', t('3–20，默认 10。', '3–20; default 10.')],
            ['strategy', 'tonal · adaptive-anchor · fixed-anchor'],
            [
              'anchorIndex',
              t('仅用于 fixed-anchor，从 0 开始。', 'Zero-based; fixed-anchor only.'),
            ],
            [
              'endpoints',
              t('curve 或 black-white，默认 curve。', 'curve or black-white; default curve.'),
            ],
            ['output', t('hex、rgb 或 oklch，默认 hex。', 'hex, rgb, or oklch; default hex.')],
            ['gamutMapping', 'chroma-reduction'],
            [
              'hueShift',
              t('统一偏移或与阶数等长的数组。', 'One shift or an array matching the stop count.'),
            ],
            [
              'lightnessCurve',
              t('严格递减、值域 0–1。', 'Strictly descending values from 0 to 1.'),
            ],
            ['chromaCurve', t('非负的种子彩度倍率。', 'Non-negative seed-chroma multipliers.')],
          ]}
        />
      </Section>
      <Section id="scales-result" title="ColorScaleResult">
        <Code>{`const result = generateColorScale('#0052D9', {\n  strategy: 'adaptive-anchor',\n  output: 'hex',\n});\n\nresult.seed;\nresult.strategy;\nresult.anchorIndex;\nresult.recommendedIndex;\nresult.colors;\nresult.stops;\nresult.diagnostics;`}</Code>
        <p>
          {t(
            '每个 ColorStop 包含索引、标签、颜色、OKLCH、色域状态和来源，可区分输入色、生成色与色域映射色。',
            'Each ColorStop contains its index, label, color, OKLCH value, gamut status, and source, distinguishing seed, generated, and gamut-mapped colors.',
          )}
        </p>
      </Section>
      <Section id="scales-curves" title={t('自定义曲线', 'Custom curves')}>
        <p>
          {t(
            '只有拥有明确色阶规范时才需要覆盖曲线；数组长度必须等于 steps。',
            'Override curves only when your product has a defined scale specification; arrays must match steps.',
          )}
        </p>
        <Code>{`generateColorScale('#0052D9', {\n  steps: 5,\n  lightnessCurve: [0.96, 0.82, 0.64, 0.43, 0.24],\n  chromaCurve: [0.15, 0.45, 1, 0.82, 0.55],\n});`}</Code>
      </Section>
    </>
  );
}

function PrinciplesDocument({ t }: { t: Translate }) {
  return (
    <>
      <Section id="principles-pipeline" title={t('完整处理流程', 'Generation pipeline')}>
        <p>
          {t(
            'OKRamp 先把 CSS 颜色解析为 OKLCH，再按策略计算每一阶的目标明度、彩度与色相。候选色会经过 sRGB 色域映射、格式化和质量诊断，最后才在品牌色阶与中性色阶之上建立语义主题。',
            'OKRamp first parses a CSS color into OKLCH, then computes the target lightness, chroma, and hue for every stop. Candidates pass through sRGB gamut mapping, formatting, and quality diagnostics before semantic themes are built from the brand and neutral scales.',
          )}
        </p>
        <ol>
          <li>
            {t(
              '解析输入并规范化为不透明的 sRGB 种子色。',
              'Parse the input and normalize it to an opaque sRGB seed.',
            )}
          </li>
          <li>
            {t(
              '转换到 OKLCH，读取感知明度 L、彩度 C 和色相 H。',
              'Convert to OKLCH and read perceptual lightness L, chroma C, and hue H.',
            )}
          </li>
          <li>
            {t(
              '根据策略与曲线生成各阶的目标 L/C/H。',
              'Generate target L/C/H values from the selected strategy and curves.',
            )}
          </li>
          <li>
            {t(
              '保持 L/H、降低 C，将超色域候选色映射到 sRGB。',
              'Map out-of-gamut candidates into sRGB by preserving L/H and reducing C.',
            )}
          </li>
          <li>
            {t(
              '输出颜色并检查重复、相邻感知差异和主题对比度。',
              'Format the colors and inspect duplicates, adjacent perceptual differences, and theme contrast.',
            )}
          </li>
        </ol>
      </Section>

      <Section id="principles-oklch" title={t('为什么使用 OKLCH', 'Why OKLCH')}>
        <Definitions
          items={[
            [
              'L · Lightness',
              t(
                '描述感知明度，用于控制从浅到深的视觉顺序。',
                'Represents perceived lightness and controls the visual order from light to dark.',
              ),
            ],
            [
              'C · Chroma',
              t(
                '描述颜色强度，用于塑造浅端、中段和深端的饱和程度。',
                'Represents color intensity and shapes saturation across light, middle, and dark stops.',
              ),
            ],
            [
              'H · Hue',
              t(
                '描述色相角度；生成时尽量稳定，仅在显式设置 hueShift 时偏移。',
                'Represents the hue angle; it remains stable unless hueShift explicitly changes it.',
              ),
            ],
          ]}
        />
        <p>
          {t(
            'RGB 与 HSL 中相同的数值步长不一定带来相同的视觉变化。OKLCH 将明度与彩度分开控制，使跨色相的色阶更容易获得连续的感知节奏；最终结果仍会约束到网页通用的 sRGB 色域。',
            'Equal numeric steps in RGB or HSL do not necessarily look equally spaced. OKLCH separates lightness from chroma, making perceptual pacing easier to control across hues, while final colors are still constrained to the web-standard sRGB gamut.',
          )}
        </p>
      </Section>

      <Section
        id="principles-curves"
        title={t('默认曲线如何塑造色阶', 'How the default curves shape a ramp')}
      >
        <p>
          {t(
            '默认 10 阶使用独立的明度曲线和彩度倍率。明度严格递减；彩度在浅端较低，在主色区域达到峰值，再向深端收敛，从而避免浅色刺眼或深色浑浊。其他阶数会对这两条预设曲线做线性重采样。',
            'The default 10-stop preset uses separate lightness and chroma-factor curves. Lightness strictly decreases; chroma starts low, peaks around the primary region, and tapers toward the dark end to avoid harsh tints and muddy shades. Other stop counts linearly resample both curves.',
          )}
        </p>
        <Code>{`const lightness = [0.97, 0.93, 0.87, 0.79, 0.70, 0.61, 0.52, 0.43, 0.34, 0.25];
const chromaFactor = [0.12, 0.30, 0.52, 0.74, 0.92, 1.00, 0.96, 0.86, 0.70, 0.50];

// tonal strategy
const chroma = Math.min(seedC, 0.32) * chromaFactor[index];`}</Code>
      </Section>

      <Section
        id="principles-strategies"
        title={t('三种策略的计算差异', 'How the three strategies differ')}
      >
        <Definitions
          items={[
            [
              'tonal',
              t(
                '只继承输入色的色相和彩度特征，完整采用标准明度曲线。推荐主色是与输入色感知距离最近的一阶，不保证精确保留输入色。',
                'Inherits only the seed hue and chroma characteristics and uses the full standard lightness curve. The recommended color is the perceptually closest generated stop; the exact seed is not guaranteed to appear.',
              ),
            ],
            [
              'adaptive-anchor',
              t(
                '在各候选阶位中综合计算明度距离、边缘惩罚和两侧空间不足惩罚，再把规范化输入色放入得分最低的位置。',
                'Scores candidate stops using lightness distance, edge penalties, and insufficient-space penalties, then places the normalized seed at the lowest-scoring position.',
              ),
            ],
            [
              'fixed-anchor',
              t(
                '把输入色固定在指定 anchorIndex，锚点两侧分别重映射为“浅端到种子”和“种子到深端”；算法不会静默移动锚点。',
                'Pins the seed to anchorIndex and separately remaps the two sides from the light end to the seed and from the seed to the dark end. The algorithm never silently moves the requested anchor.',
              ),
            ],
          ]}
        />
        <StrategyDemo />
      </Section>

      <Section
        id="principles-gamut"
        title={t('端点与 sRGB 色域映射', 'Endpoints and sRGB gamut mapping')}
      >
        <p>
          {t(
            'curve 端点保留预设曲线中的带色浅端与深端；black-white 会把明度范围拉伸至 1–0，并让首尾彩度归零，得到纯白和纯黑。固定锚点使用黑白端点时只能选择内部阶位。',
            'Curve endpoints retain tinted light and dark ends from the preset. Black-white stretches lightness to 1–0 and sets endpoint chroma to zero, producing pure white and black. A fixed anchor must remain inside the ramp when black-white endpoints are used.',
          )}
        </p>
        <p>
          {t(
            '候选色超出 sRGB 时，引擎会在 0 到目标彩度之间执行 28 次二分搜索，保持 OKLCH 明度和色相，寻找仍可显示的最大彩度。相比直接裁剪 RGB 通道，这种方式更能保留原本的明暗关系与色相。',
            'When a candidate falls outside sRGB, the engine performs 28 binary-search iterations between zero and the target chroma. It preserves OKLCH lightness and hue while finding the highest displayable chroma. This retains the intended lightness and hue better than clipping RGB channels directly.',
          )}
        </p>
        <GamutDemo />
      </Section>

      <Section
        id="principles-neutral"
        title={t('中性色如何关联品牌', 'How neutrals inherit the brand')}
      >
        <p>
          {t(
            '中性色使用独立的 10 阶或 14 阶明度曲线。它继承种子色色相，但实际彩度取 tintStrength 与种子彩度 18% 中的较小值，再乘以中性色彩度形状；中段略有色相倾向，极浅和极深端更克制。',
            'Neutral scales use independent 10- or 14-stop lightness curves. They inherit the seed hue, while actual chroma is the smaller of tintStrength and 18% of seed chroma, multiplied by a neutral chroma shape. Middle stops carry a subtle tint while the extreme ends remain restrained.',
          )}
        </p>
        <Code>{`const baseChroma = Math.min(tintStrength, seedC * 0.18);
const chroma = baseChroma * neutralChromaShape[index];`}</Code>
        <NeutralDemo />
      </Section>

      <Section id="principles-theme" title={t('语义主题与对比度', 'Semantic themes and contrast')}>
        <p>
          {t(
            '主题不是再生成一套颜色，而是从品牌色阶和中性色阶中为按钮、文字、背景与边框选择语义角色。深色主题拥有独立映射：页面背景取中性色深端，文字取浅端，品牌默认色通常比浅色主题更亮。',
            'A theme does not generate another palette. It selects semantic roles for controls, text, surfaces, and borders from the brand and neutral scales. Dark mode has an independent mapping: page surfaces use dark neutral stops, text uses light stops, and the default brand color is usually lighter than in light mode.',
          )}
        </p>
        <Definitions
          items={[
            [
              'report',
              t(
                '保留初始语义映射，只报告未达到目标的组合。',
                'Keep the initial semantic mapping and report pairs that miss their targets.',
              ),
            ],
            [
              'adjust',
              t(
                '在对应色阶内寻找达到目标且与原角色颜色感知距离最近的候选色。',
                'Find a passing candidate in the relevant scale with the smallest perceptual distance from the original role color.',
              ),
            ],
            [
              'strict',
              t(
                '不自动修改颜色；存在任何失败项时抛出结构化异常。',
                'Do not modify colors; throw a structured error if any check fails.',
              ),
            ],
          ]}
        />
        <Alert
          theme="info"
          message={t(
            '默认目标为普通文本 4.5:1、重要非文本元素 3:1。诊断覆盖引擎声明的语义组合，不等同于对完整产品页面的无障碍审计。',
            'Default targets are 4.5:1 for body text and 3:1 for important non-text elements. Diagnostics cover declared engine semantics and are not a complete accessibility audit of a product interface.',
          )}
        />
      </Section>

      <Section id="principles-limits" title={t('稳定性与已知边界', 'Stability and known limits')}>
        <ul>
          <li>
            {t(
              '不同色相共享基础曲线，困难色相主要依靠色域映射修正。',
              'Hues share the base curves; difficult hues are primarily corrected through gamut mapping.',
            )}
          </li>
          <li>
            {t(
              '当前对比度模型采用 WCAG 2.x，尚未加入 APCA。',
              'The current contrast model uses WCAG 2.x; APCA is not included yet.',
            )}
          </li>
          <li>
            {t(
              '输出基线是 sRGB，目前不生成原生 Display-P3 色板。',
              'The output baseline is sRGB; native Display-P3 palettes are not generated.',
            )}
          </li>
          <li>
            {t(
              '8-bit 输出量化在极端输入下可能产生相邻重复，诊断会明确报告。',
              'Eight-bit output quantization can produce adjacent duplicates for extreme inputs, which diagnostics report explicitly.',
            )}
          </li>
          <li>
            {t(
              '算法升级可能改变具体颜色；需要固定结果时应锁定 npm 版本。',
              'Algorithm updates may change exact colors; pin the npm version when deterministic output is required.',
            )}
          </li>
        </ul>
        <div className="guide-links">
          <Button
            href="https://github.com/Seeridia/okramp/blob/main/docs/ALGORITHMS.md"
            target="_blank"
            variant="outline"
          >
            {t('查看仓库算法说明', 'Read the repository algorithm notes')}
          </Button>
        </div>
      </Section>
    </>
  );
}

function ThemesDocument({ t }: { t: Translate }) {
  return (
    <>
      <Section id="themes-neutral" title={t('中性色阶', 'Neutral scale')}>
        <Code>{`generateNeutralScale('#0052D9', {\n  steps: 14,\n  tintStrength: 0.025,\n  hue: 'seed',\n});`}</Code>
        <Definitions
          items={[
            ['steps', t('只能为 10 或 14，默认 14。', '10 or 14; default 14.')],
            [
              'tintStrength',
              t(
                '最大 OKLCH 彩度，默认 0.025，上限 0.08。',
                'Maximum OKLCH chroma; default 0.025, maximum 0.08.',
              ),
            ],
            ['hue', t('使用 seed 色相或指定角度。', 'Use the seed hue or a specific angle.')],
            ['lightnessCurve', t('自定义中性色明度曲线。', 'Custom neutral lightness curve.')],
          ]}
        />
      </Section>
      <Section id="themes-generate" title={t('生成主题', 'Generate a theme')}>
        <Code>{`const result = generateColorTheme('#0052D9', {\n  mode: 'both',\n  scale: { strategy: 'tonal', steps: 10 },\n  neutral: { steps: 14, tintStrength: 0.025 },\n  contrast: { normalText: 4.5, nonText: 3 },\n  contrastPolicy: 'adjust',\n});`}</Code>
        <Alert
          theme="info"
          message={t(
            '语义主题要求至少 10 阶品牌色，以分配不同交互角色。',
            'Semantic themes require at least 10 brand stops to assign distinct interaction roles.',
          )}
        />
      </Section>
      <Section id="themes-semantic" title={t('语义角色', 'Semantic roles')}>
        <Definitions
          items={[
            [
              'brand',
              'default · hover · active · disabled · subtle · text · border · focusRing · onBrand',
            ],
            ['background', 'page · container · elevated · disabled'],
            ['text', 'primary · secondary · placeholder · disabled · inverse · link · linkHover'],
            ['border', 'default · subtle · strong · focus'],
          ]}
        />
        <p>
          {t(
            '深色主题使用独立映射，不是简单反转浅色色阶。',
            'Dark themes use an independent mapping rather than reversing the light scale.',
          )}
        </p>
      </Section>
      <Section id="themes-contrast" title={t('对比度策略', 'Contrast policy')}>
        <Definitions
          items={[
            ['report', t('保留映射并报告结果。', 'Keep mappings and report results.')],
            [
              'adjust',
              t(
                '选择最近且达到目标的已有颜色。',
                'Select the nearest existing color that meets the target.',
              ),
            ],
            ['strict', t('仍有失败项时抛出异常。', 'Throw when any check still fails.')],
          ]}
        />
        <p>
          {t(
            '默认普通文本目标为 4.5:1，重要非文本元素为 3:1。',
            'Defaults are 4.5:1 for body text and 3:1 for important non-text elements.',
          )}
        </p>
      </Section>
      <Section id="themes-output" title={t('主题返回结构', 'Theme result')}>
        <Code>{`result.seed;\nresult.scales.brand;\nresult.scales.neutral;\nresult.themes.light?.color;\nresult.themes.dark?.color;\nresult.diagnostics.contrastChecks;`}</Code>
      </Section>
    </>
  );
}

function TDesignDocument({ t }: { t: Translate }) {
  return (
    <>
      <Section id="tdesign-boundary" title={t('适配边界', 'Adapter boundary')}>
        <p>
          {t(
            '核心 npm 包不依赖 TDesign，也不导出 --td-* Token。独立包 okramp-tdesign 负责将 OKRamp 语义角色映射到 TDesign React。',
            'The npm package does not depend on TDesign or export --td-* tokens. The playground adapter maps OKRamp semantic roles to TDesign React.',
          )}
        </p>
      </Section>
      <Section id="tdesign-export" title={t('使用导出文件', 'Use an exported file')}>
        <ol>
          <li>
            {t('在工作台配置颜色与策略。', 'Configure colors and policies in the workspace.')}
          </li>
          <li>
            {t(
              '在导出面板选择 TDesign、CSS 和主题模式。',
              'Choose TDesign, CSS, and theme modes in Export.',
            )}
          </li>
          <li>
            {t('在 TDesign 默认样式之后加载文件。', 'Load the file after TDesign default styles.')}
          </li>
        </ol>
        <Code>{`import 'tdesign-react/dist/tdesign.css';\nimport './okramp-theme.css';`}</Code>
        <p>
          {t(
            '语义变量引用基础色阶原语，便于追踪来源。',
            'Semantic variables reference base-scale primitives for traceability.',
          )}
        </p>
      </Section>
      <Section id="tdesign-runtime" title={t('运行时映射', 'Runtime mapping')}>
        <Code>{`const generated = generateColorTheme('#0052D9', { mode: 'both' });\nconst light = generated.themes.light!;\ndocument.documentElement.style.setProperty(\n  '--td-brand-color',\n  light.color.brand.default,\n);`}</Code>
      </Section>
      <Section id="tdesign-dark" title={t('深色主题', 'Dark theme')}>
        <Code>{`document.documentElement.setAttribute('theme-mode', 'dark');\ndocument.documentElement.setAttribute('theme-mode', 'light');`}</Code>
        <p>
          {t(
            '同时导出时，浅色变量位于 :root，深色变量位于 :root[theme-mode="dark"]。',
            'When exporting both modes, light variables use :root and dark variables use :root[theme-mode="dark"].',
          )}
        </p>
      </Section>
      <Section id="tdesign-scope" title={t('Token 范围', 'Token coverage')}>
        <p>
          {t(
            '适配覆盖品牌、背景、文字、边框和相关容器变量；成功、警告和错误色沿用 TDesign 默认值。',
            'The adapter covers brand, surface, text, border, and related container variables; success, warning, and error colors retain TDesign defaults.',
          )}
        </p>
        <Alert
          theme="warning"
          message={t(
            '升级 TDesign 后应重新核对变量和组件状态。适配器版本应与 TDesign 版本一起维护。',
            'Recheck variables and component states after upgrading TDesign. Maintain the adapter alongside the TDesign version.',
          )}
        />
      </Section>
    </>
  );
}

function ApiDocument({ t }: { t: Translate }) {
  return (
    <>
      <Section id="api-scale" title="generateColorScale">
        <Code>{`function generateColorScale(\n  seed: string,\n  options?: ColorScaleOptions,\n): ColorScaleResult`}</Code>
        <p>
          {t(
            '生成品牌色阶；默认 tonal、10 阶和 HEX。',
            'Generates a brand scale; defaults to tonal, 10 stops, and HEX.',
          )}
        </p>
      </Section>
      <Section id="api-neutral" title="generateNeutralScale">
        <Code>{`function generateNeutralScale(\n  seed: string,\n  options?: NeutralScaleOptions,\n): ColorScaleResult`}</Code>
        <p>
          {t(
            '生成 10 或 14 阶品牌关联中性色。',
            'Generates a 10- or 14-stop brand-tinted neutral scale.',
          )}
        </p>
      </Section>
      <Section id="api-theme" title="generateColorTheme">
        <Code>{`function generateColorTheme(\n  seed: string,\n  options?: ColorThemeOptions,\n): ColorThemeResult`}</Code>
        <p>
          {t(
            '生成品牌色阶、中性色阶和所选模式的语义主题。',
            'Generates brand and neutral scales plus semantic themes for the selected mode.',
          )}
        </p>
      </Section>
      <Section id="api-contrast" title={t('对比度工具', 'Contrast utilities')}>
        <Code>{`relativeLuminance('#0052D9');\ncontrastRatio('#ffffff', '#0052D9');\nchooseContrastingForeground('#0052D9');`}</Code>
        <p>
          {t(
            '基于 WCAG 2.x 的 sRGB 相对亮度。支持半透明前景与不透明背景合成。',
            'Uses WCAG 2.x sRGB relative luminance and supports compositing translucent foregrounds over opaque backgrounds.',
          )}
        </p>
      </Section>
      <Section id="api-types" title={t('类型导入', 'Type imports')}>
        <Code>{`import type {\n  ColorScaleOptions, ColorScaleResult, ColorStop,\n  ColorThemeOptions, ColorThemeResult, ContrastPolicy,\n  Diagnostics, NeutralScaleOptions, ScaleStrategy, SemanticTheme,\n} from 'okramp';`}</Code>
        <div className="guide-links">
          <Button
            href="https://github.com/Seeridia/okramp/blob/main/docs/API.md"
            target="_blank"
            variant="outline"
          >
            {t('仓库 API 文档', 'Repository API reference')}
          </Button>
        </div>
      </Section>
    </>
  );
}

function DiagnosticsDocument({ t }: { t: Translate }) {
  return (
    <>
      <Section id="diagnostics-read" title={t('读取诊断', 'Read diagnostics')}>
        <Code>{`const result = generateColorScale('#f8fbff');\nfor (const message of result.diagnostics.messages) {\n  console.log(message.code, message.severity, message.message);\n}`}</Code>
        <p>
          {t(
            '合法但不理想的输入会返回消息，结果仍可使用；消息可能包含 stopIndexes 和 details。',
            'Valid but suboptimal inputs return messages while keeping the result usable; messages may include stopIndexes and details.',
          )}
        </p>
      </Section>
      <Section id="diagnostics-codes" title={t('诊断代码', 'Diagnostic codes')}>
        <Definitions
          items={[
            [
              t('输入', 'Input'),
              'ALPHA_IGNORED · SEED_TOO_LIGHT · SEED_TOO_DARK · SEED_LOW_CHROMA',
            ],
            [t('色域', 'Gamut'), 'SEED_OUT_OF_GAMUT · GAMUT_MAPPED'],
            [t('色阶', 'Scale'), 'DUPLICATE_STOPS · LOW_ADJACENT_DIFFERENCE · ANCHOR_MOVED'],
            [t('主题', 'Theme'), 'CONTRAST_TARGET_UNMET'],
          ]}
        />
      </Section>
      <Section id="diagnostics-errors" title="ColorScaleError">
        <Code>{`try {\n  generateColorTheme('invalid', { contrastPolicy: 'strict' });\n} catch (error) {\n  if (error instanceof ColorScaleError) {\n    console.error(error.code, error.details);\n  }\n}`}</Code>
        <p>
          {t(
            '稳定错误码为 INVALID_COLOR、INVALID_OPTIONS 和 CONTRAST_TARGET_UNMET。',
            'Stable error codes are INVALID_COLOR, INVALID_OPTIONS, and CONTRAST_TARGET_UNMET.',
          )}
        </p>
      </Section>
      <Section id="diagnostics-gamut" title={t('色域映射', 'Gamut mapping')}>
        <p>
          {t(
            '当前实现保持 OKLCH 明度和色相，通过降低彩度映射到 sRGB。锚点策略保留规范化后的 sRGB 输入色。',
            'The current implementation preserves OKLCH lightness and hue while reducing chroma into sRGB. Anchored strategies preserve the normalized sRGB seed.',
          )}
        </p>
      </Section>
      <Section
        id="diagnostics-stability"
        title={t('版本与输出稳定性', 'Version and output stability')}
      >
        <p>
          {t(
            '算法升级可能改变具体 HEX。需要稳定结果时请锁定依赖版本，并保留关键主题快照或视觉基线。',
            'Algorithm upgrades may change exact HEX values. Pin the dependency and retain key theme snapshots or visual baselines when stability matters.',
          )}
        </p>
      </Section>
    </>
  );
}

export function Guide() {
  const { t } = useI18n();
  const documents = useMemo<GuideDocument[]>(
    () => [
      {
        id: 'start' as const,
        label: t('快速开始', 'Quick start'),
        title: t('安装与快速开始', 'Install and quick start'),
        description: t(
          '安装 OKRamp，选择生成入口并使用第一份结果。',
          'Install OKRamp, choose an API, and use your first color result.',
        ),
        sections: [
          ['start-install', t('安装', 'Install')],
          ['start-first-scale', t('生成第一条色阶', 'First scale')],
          ['start-choose-api', t('选择 API', 'Choose an API')],
          ['start-runtime', t('运行环境', 'Runtime')],
        ],
      },
      {
        id: 'scales' as const,
        label: t('色阶生成', 'Scale generation'),
        title: t('品牌色阶生成', 'Brand scale generation'),
        description: t(
          '了解颜色输入、策略、配置、返回结构和自定义曲线。',
          'Understand color input, strategies, options, result structure, and custom curves.',
        ),
        sections: [
          ['scales-input', t('颜色输入', 'Color input')],
          ['scales-strategies', t('三种策略', 'Strategies')],
          ['scales-options', 'ColorScaleOptions'],
          ['scales-result', 'ColorScaleResult'],
          ['scales-curves', t('自定义曲线', 'Custom curves')],
        ],
      },
      {
        id: 'principles' as const,
        label: t('生成原理', 'How it works'),
        title: t('OKRamp 生成原理', 'How OKRamp generates color systems'),
        description: t(
          '从颜色空间、曲线与策略，到色域映射、中性色和语义主题的完整计算过程。',
          'The complete process from color space, curves, and strategies to gamut mapping, neutrals, and semantic themes.',
        ),
        sections: [
          ['principles-pipeline', t('完整处理流程', 'Pipeline')],
          ['principles-oklch', t('为什么使用 OKLCH', 'Why OKLCH')],
          ['principles-curves', t('默认曲线', 'Default curves')],
          ['principles-strategies', t('策略差异', 'Strategies')],
          ['principles-gamut', t('端点与色域映射', 'Endpoints and gamut')],
          ['principles-neutral', t('中性色生成', 'Neutral generation')],
          ['principles-theme', t('主题与对比度', 'Themes and contrast')],
          ['principles-limits', t('稳定性与边界', 'Stability and limits')],
        ],
      },
      {
        id: 'themes' as const,
        label: t('主题系统', 'Theme system'),
        title: t('中性色与语义主题', 'Neutrals and semantic themes'),
        description: t(
          '从色阶建立明暗语义角色并处理界面对比度。',
          'Build light and dark semantic roles and handle interface contrast.',
        ),
        sections: [
          ['themes-neutral', t('中性色阶', 'Neutral scale')],
          ['themes-generate', t('生成主题', 'Generate theme')],
          ['themes-semantic', t('语义角色', 'Semantic roles')],
          ['themes-contrast', t('对比度策略', 'Contrast policy')],
          ['themes-output', t('主题返回结构', 'Theme result')],
        ],
      },
      {
        id: 'tdesign' as const,
        label: t('TDesign 接入', 'TDesign integration'),
        title: t('接入 TDesign React', 'Integrate TDesign React'),
        description: t(
          '通过导出文件或运行时适配映射 TDesign Token。',
          'Map TDesign tokens through exported files or a runtime adapter.',
        ),
        sections: [
          ['tdesign-boundary', t('适配边界', 'Boundary')],
          ['tdesign-export', t('使用导出文件', 'Exported file')],
          ['tdesign-runtime', t('运行时映射', 'Runtime mapping')],
          ['tdesign-dark', t('深色主题', 'Dark theme')],
          ['tdesign-scope', t('Token 范围', 'Token coverage')],
        ],
      },
      {
        id: 'api' as const,
        label: t('API 参考', 'API reference'),
        title: t('API 与 TypeScript 参考', 'API and TypeScript reference'),
        description: t(
          '查询导出函数、辅助工具和常用类型。',
          'Review exported functions, utilities, and common types.',
        ),
        sections: [
          ['api-scale', 'generateColorScale'],
          ['api-neutral', 'generateNeutralScale'],
          ['api-theme', 'generateColorTheme'],
          ['api-contrast', t('对比度工具', 'Contrast utilities')],
          ['api-types', t('类型导入', 'Type imports')],
        ],
      },
      {
        id: 'diagnostics' as const,
        label: t('诊断与错误', 'Diagnostics and errors'),
        title: t('诊断、错误与输出稳定性', 'Diagnostics, errors, and output stability'),
        description: t(
          '区分可继续使用的诊断和需要中止的异常。',
          'Distinguish usable diagnostics from exceptions that stop generation.',
        ),
        sections: [
          ['diagnostics-read', t('读取诊断', 'Read diagnostics')],
          ['diagnostics-codes', t('诊断代码', 'Codes')],
          ['diagnostics-errors', 'ColorScaleError'],
          ['diagnostics-gamut', t('色域映射', 'Gamut mapping')],
          ['diagnostics-stability', t('版本与稳定性', 'Stability')],
        ],
      },
    ],
    [t],
  );
  const initial = readUrlParam('guideDoc', 'start') as GuideId;
  const [documentId, setDocumentId] = useState<GuideId>(() =>
    documents.some(({ id }) => id === initial) ? initial : 'start',
  );
  const current = documents.find(({ id }) => id === documentId)!;
  const content = {
    start: <StartDocument t={t} />,
    scales: <ScalesDocument t={t} />,
    principles: <PrinciplesDocument t={t} />,
    themes: <ThemesDocument t={t} />,
    tdesign: <TDesignDocument t={t} />,
    api: <ApiDocument t={t} />,
    diagnostics: <DiagnosticsDocument t={t} />,
  }[documentId];
  useEffect(() => {
    document.title = `${current.title} · OKRamp`;
  }, [current.title]);
  useEffect(() => {
    const sync = () => {
      const value = readUrlParam('guideDoc', 'start') as GuideId;
      setDocumentId(documents.some(({ id }) => id === value) ? value : 'start');
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [documents]);
  const select = (event: MouseEvent<HTMLAnchorElement>, id: GuideId) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    setDocumentId(id);
    updateUrlParams({ guideDoc: id === 'start' ? null : id });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="guide-docs-shell">
      <aside className="guide-doc-nav" aria-label={t('指南文档', 'Guide documents')}>
        <strong>{t('使用指南', 'Documentation')}</strong>
        <nav>
          {documents.map((item) => (
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
              onClick={(event) => select(event, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <article className="guide-document">
        <header className="guide-document-header">
          <span className="eyebrow">{t('OKRAMP 使用文档', 'OKRAMP DOCUMENTATION')}</span>
          <h1>{current.title}</h1>
          <p>{current.description}</p>
        </header>
        {content}
      </article>
      <aside className="guide-outline" aria-label={t('当前文档大纲', 'On this page')}>
        <strong>{t('本篇大纲', 'On this page')}</strong>
        <nav>
          {current.sections.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}
