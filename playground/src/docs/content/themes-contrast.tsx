import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="themes-contrast" title={t('对比度策略', 'Contrast policy')}>
      <Definitions
        items={[
          ['report', t('保留映射并报告结果。', 'Keep mappings and report results.')],
          [
            'adjust',
            t(
              '选择最近且达到目标的已有颜色。',
              'Select the nearest existing color that meets the target.',
            ),
          ],
          ['strict', t('仍有失败项时抛出异常。', 'Throw when any check still fails.')],
        ]}
      />
      <DocParagraph>
        {t(
          '默认普通文本目标为 4.5:1，重要非文本元素为 3:1。',
          'Defaults are 4.5:1 for body text and 3:1 for important non-text elements.',
        )}
      </DocParagraph>
    </Section>
  );
}
