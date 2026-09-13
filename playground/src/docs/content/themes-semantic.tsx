import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="themes-semantic" title={t('语义角色', 'Semantic roles')}>
      <Definitions
        items={[
          [
            'brand',
            'default · hover · active · disabled · subtle · text · border · focusRing · onBrand',
          ],
          ['background', 'page · container · elevated · disabled'],
          ['text', 'primary · secondary · placeholder · disabled · inverse · link · linkHover'],
          ['border', 'default · subtle · strong · focus'],
        ]}
      />
      <DocParagraph>
        {t(
          '深色主题使用独立映射，不是简单反转浅色色阶。',
          'Dark themes use an independent mapping rather than reversing the light scale.',
        )}
      </DocParagraph>
    </Section>
  );
}
