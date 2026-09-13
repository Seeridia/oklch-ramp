import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="start-install" title={t('安装', 'Install')}>
      <DocParagraph>
        {t(
          'OKRamp 是仅支持 ESM 的 TypeScript 库，npm 包名为 @okramp/core。',
          'OKRamp is an ESM-only TypeScript library published as @okramp/core.',
        )}
      </DocParagraph>
      <Code language="bash">npm install @okramp/core</Code>
    </Section>
  );
}
