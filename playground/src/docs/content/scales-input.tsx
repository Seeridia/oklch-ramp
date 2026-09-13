import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="scales-input" title={t('颜色输入', 'Color input')}>
        <DocParagraph>
          {t(
            '接受 Culori 可识别的 CSS 颜色，包括 HEX、RGB、HSL 和 OKLCH。输出为不透明颜色；输入 Alpha 会被忽略并产生诊断。',
            'Accepts CSS colors recognized by Culori, including HEX, RGB, HSL, and OKLCH. Output is opaque; input alpha is ignored and reported.',
          )}
        </DocParagraph>
        <Code>{`generateColorScale('#0052D9');\ngenerateColorScale('rgb(0 82 217)');\ngenerateColorScale('hsl(217 100% 43%)');\ngenerateColorScale('oklch(0.52 0.22 260)');`}</Code>
      </Section>); }
