import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="api-scale" title="generateColorScale">
        <Code>{`function generateColorScale(\n  seed: string,\n  options?: ColorScaleOptions,\n): ColorScaleResult`}</Code>
        <DocParagraph>
          {t(
            '生成品牌色阶；默认 tonal、10 阶和 HEX。',
            'Generates a brand scale; defaults to tonal, 10 stops, and HEX.',
          )}
        </DocParagraph>
      </Section>); }
