import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="tdesign-dark" title={t('深色主题', 'Dark theme')}>
      <Code>{`document.documentElement.setAttribute('theme-mode', 'dark');\ndocument.documentElement.setAttribute('theme-mode', 'light');`}</Code>
      <DocParagraph>
        {t(
          '同时导出时，浅色变量位于 :root，深色变量位于 :root[theme-mode="dark"]。',
          'When exporting both modes, light variables use :root and dark variables use :root[theme-mode="dark"].',
        )}
      </DocParagraph>
    </Section>
  );
}
