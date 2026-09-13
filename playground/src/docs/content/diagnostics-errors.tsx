import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="diagnostics-errors" title="ColorScaleError">
      <Code>{`try {\n  generateColorTheme('invalid', { contrastPolicy: 'strict' });\n} catch (error) {\n  if (error instanceof ColorScaleError) {\n    console.error(error.code, error.details);\n  }\n}`}</Code>
      <DocParagraph>
        {t(
          '稳定错误码为 INVALID_COLOR、INVALID_OPTIONS 和 CONTRAST_TARGET_UNMET。',
          'Stable error codes are INVALID_COLOR, INVALID_OPTIONS, and CONTRAST_TARGET_UNMET.',
        )}
      </DocParagraph>
    </Section>
  );
}
