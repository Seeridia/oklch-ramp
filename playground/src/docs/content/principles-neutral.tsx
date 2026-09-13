import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
import { NeutralDemo } from '../../components/PrincipleDemos';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section
      id="principles-neutral"
      title={t('中性色如何关联品牌', 'How neutrals inherit the brand')}
    >
      <DocParagraph>
        {t(
          '中性色使用独立的 10 阶或 14 阶明度曲线。它继承种子色色相，但实际彩度取 tintStrength 与种子彩度 18% 中的较小值，再乘以中性色彩度形状；中段略有色相倾向，极浅和极深端更克制。',
          'Neutral scales use independent 10- or 14-stop lightness curves. They inherit the seed hue, while actual chroma is the smaller of tintStrength and 18% of seed chroma, multiplied by a neutral chroma shape. Middle stops carry a subtle tint while the extreme ends remain restrained.',
        )}
      </DocParagraph>
      <Code>{`const baseChroma = Math.min(tintStrength, seedC * 0.18);
const chroma = baseChroma * neutralChromaShape[index];`}</Code>
      <NeutralDemo />
    </Section>
  );
}
