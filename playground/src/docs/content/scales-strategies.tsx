import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Tag } from 'tdesign-react';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="scales-strategies" title={t('三种策略', 'Three strategies')}>
      <div className="guide-strategies">
        <section>
          <Tag theme="primary" variant="light">
            tonal · {t('默认', 'default')}
          </Tag>
          <DocParagraph>
            {t(
              '提取输入色的色相和彩度并重建明度曲线。适合探索或处理质量不确定的输入。',
              'Uses seed hue and chroma to rebuild the lightness curve. Useful for exploration or uncertain inputs.',
            )}
          </DocParagraph>
        </section>
        <section>
          <Tag variant="light">adaptive-anchor</Tag>
          <DocParagraph>
            {t(
              '保留规范化输入色，并按感知明度自动选择锚点。',
              'Preserves the normalized seed and selects its anchor by perceived lightness.',
            )}
          </DocParagraph>
        </section>
        <section>
          <Tag variant="light">fixed-anchor</Tag>
          <DocParagraph>
            {t(
              '将输入色固定在 anchorIndex；索引从 0 开始。',
              'Places the seed at anchorIndex, using zero-based indexing.',
            )}
          </DocParagraph>
        </section>
      </div>
    </Section>
  );
}
