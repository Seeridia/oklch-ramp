import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
import { StrategyDemo } from '../../components/PrincipleDemos';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section
      id="principles-strategies"
      title={t('三种策略的计算差异', 'How the three strategies differ')}
    >
      <Definitions
        items={[
          [
            'tonal',
            t(
              '只继承输入色的色相和彩度特征，完整采用标准明度曲线。推荐主色是与输入色感知距离最近的一阶，不保证精确保留输入色。',
              'Inherits only the seed hue and chroma characteristics and uses the full standard lightness curve. The recommended color is the perceptually closest generated stop; the exact seed is not guaranteed to appear.',
            ),
          ],
          [
            'adaptive-anchor',
            t(
              '在各候选阶位中综合计算明度距离、边缘惩罚和两侧空间不足惩罚，再把规范化输入色放入得分最低的位置。',
              'Scores candidate stops using lightness distance, edge penalties, and insufficient-space penalties, then places the normalized seed at the lowest-scoring position.',
            ),
          ],
          [
            'fixed-anchor',
            t(
              '把输入色固定在指定 anchorIndex，锚点两侧分别重映射为“浅端到种子”和“种子到深端”；算法不会静默移动锚点。',
              'Pins the seed to anchorIndex and separately remaps the two sides from the light end to the seed and from the seed to the dark end. The algorithm never silently moves the requested anchor.',
            ),
          ],
        ]}
      />
      <StrategyDemo />
    </Section>
  );
}
