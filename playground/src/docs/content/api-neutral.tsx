import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="api-neutral" title="generateNeutralScale">
        <Code>{`function generateNeutralScale(\n  seed: string,\n  options?: NeutralScaleOptions,\n): ColorScaleResult`}</Code>
        <DocParagraph>
          {t(
            '生成 10 或 14 阶品牌关联中性色。',
            'Generates a 10- or 14-stop brand-tinted neutral scale.',
          )}
        </DocParagraph>
      </Section>); }
