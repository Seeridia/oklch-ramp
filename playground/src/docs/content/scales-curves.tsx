import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="scales-curves" title={t('自定义曲线', 'Custom curves')}>
        <DocParagraph>
          {t(
            '只有拥有明确色阶规范时才需要覆盖曲线；数组长度必须等于 steps。',
            'Override curves only when your product has a defined scale specification; arrays must match steps.',
          )}
        </DocParagraph>
        <Code>{`generateColorScale('#0052D9', {\n  steps: 5,\n  lightnessCurve: [0.96, 0.82, 0.64, 0.43, 0.24],\n  chromaCurve: [0.15, 0.45, 1, 0.82, 0.55],\n});`}</Code>
      </Section>); }
