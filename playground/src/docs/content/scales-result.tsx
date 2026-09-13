import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="scales-result" title="ColorScaleResult">
        <Code>{`const result = generateColorScale('#0052D9', {\n  strategy: 'adaptive-anchor',\n  output: 'hex',\n});\n\nresult.seed;\nresult.strategy;\nresult.anchorIndex;\nresult.recommendedIndex;\nresult.colors;\nresult.stops;\nresult.diagnostics;`}</Code>
        <DocParagraph>
          {t(
            '每个 ColorStop 包含索引、标签、颜色、OKLCH、色域状态和来源，可区分输入色、生成色与色域映射色。',
            'Each ColorStop contains its index, label, color, OKLCH value, gamut status, and source, distinguishing seed, generated, and gamut-mapped colors.',
          )}
        </DocParagraph>
      </Section>); }
