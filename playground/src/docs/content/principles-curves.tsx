import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section
      id="principles-curves"
      title={t('默认曲线如何塑造色阶', 'How the default curves shape a ramp')}
    >
      <DocParagraph>
        {t(
          '默认 10 阶使用独立的明度曲线和彩度倍率。明度严格递减；彩度在浅端较低，在主色区域达到峰值，再向深端收敛，从而避免浅色刺眼或深色浑浊。其他阶数会对这两条预设曲线做线性重采样。',
          'The default 10-stop preset uses separate lightness and chroma-factor curves. Lightness strictly decreases; chroma starts low, peaks around the primary region, and tapers toward the dark end to avoid harsh tints and muddy shades. Other stop counts linearly resample both curves.',
        )}
      </DocParagraph>
      <Code>{`const lightness = [0.97, 0.93, 0.87, 0.79, 0.70, 0.61, 0.52, 0.43, 0.34, 0.25];
const chromaFactor = [0.12, 0.30, 0.52, 0.74, 0.92, 1.00, 0.96, 0.86, 0.70, 0.50];

// tonal strategy
const chroma = Math.min(seedC, 0.32) * chromaFactor[index];`}</Code>
    </Section>
  );
}
