import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="diagnostics-gamut" title={t('色域映射', 'Gamut mapping')}>
        <DocParagraph>
          {t(
            '当前实现保持 OKLCH 明度和色相，通过降低彩度映射到 sRGB。锚点策略保留规范化后的 sRGB 输入色。',
            'The current implementation preserves OKLCH lightness and hue while reducing chroma into sRGB. Anchored strategies preserve the normalized sRGB seed.',
          )}
        </DocParagraph>
      </Section>); }
