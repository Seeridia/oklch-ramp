import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="api-contrast" title={t('对比度工具', 'Contrast utilities')}>
      <Code>{`relativeLuminance('#0052D9');\ncontrastRatio('#ffffff', '#0052D9');\nchooseContrastingForeground('#0052D9');`}</Code>
      <DocParagraph>
        {t(
          '基于 WCAG 2.x 的 sRGB 相对亮度。支持半透明前景与不透明背景合成。',
          'Uses WCAG 2.x sRGB relative luminance and supports compositing translucent foregrounds over opaque backgrounds.',
        )}
      </DocParagraph>
    </Section>
  );
}
