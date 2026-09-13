import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section
      id="diagnostics-stability"
      title={t('版本与输出稳定性', 'Version and output stability')}
    >
      <DocParagraph>
        {t(
          '算法升级可能改变具体 HEX。需要稳定结果时请锁定依赖版本，并保留关键主题快照或视觉基线。',
          'Algorithm upgrades may change exact HEX values. Pin the dependency and retain key theme snapshots or visual baselines when stability matters.',
        )}
      </DocParagraph>
    </Section>
  );
}
