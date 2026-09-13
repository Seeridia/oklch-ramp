import { DocParagraph } from '../Blocks';
import { generateColorScale } from '@okramp/core';
const example = generateColorScale('#0052D9');
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
import { ScaleStrip } from '../../components/Scales';
export default function Article() { const {t} = useI18n();  return (<Section id="start-first-scale" title={t('生成第一条色阶', 'Generate your first scale')}>
        <Code>{`import { generateColorScale } from '@okramp/core';\n\nconst result = generateColorScale('#0052D9');\nconsole.log(result.colors);\nconsole.log(result.colors[result.recommendedIndex]);\nconsole.log(result.diagnostics.messages);`}</Code>
        <figure className="guide-scale-example">
          <figcaption>
            {t(
              '上述代码的生成结果 · 点击色块复制颜色',
              'Output from the example · Click a swatch to copy',
            )}
          </figcaption>
          <ScaleStrip result={example} compact />
        </figure>
        <DocParagraph>
          {t(
            'colors 是便于直接使用的数组；产品还应读取 recommendedIndex 和 diagnostics，不要假定固定位置始终是品牌主色。',
            'colors is ready to use, but products should also read recommendedIndex and diagnostics instead of assuming a fixed position is always the brand color.',
          )}
        </DocParagraph>
      </Section>); }
