import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="api-theme" title="generateColorTheme">
      <Code>{`function generateColorTheme(\n  seed: string,\n  options?: ColorThemeOptions,\n): ColorThemeResult`}</Code>
      <DocParagraph>
        {t(
          '生成品牌色阶、中性色阶和所选模式的语义主题。',
          'Generates brand and neutral scales plus semantic themes for the selected mode.',
        )}
      </DocParagraph>
    </Section>
  );
}
