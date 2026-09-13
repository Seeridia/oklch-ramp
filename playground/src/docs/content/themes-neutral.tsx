import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code, Definitions } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="themes-neutral" title={t('中性色阶', 'Neutral scale')}>
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
      </Section>); }
