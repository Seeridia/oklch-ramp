import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="themes-output" title={t('主题返回结构', 'Theme result')}>
      <Code>{`result.seed;\nresult.scales.brand;\nresult.scales.neutral;\nresult.themes.light?.color;\nresult.themes.dark?.color;\nresult.diagnostics.contrastChecks;`}</Code>
    </Section>
  );
}
