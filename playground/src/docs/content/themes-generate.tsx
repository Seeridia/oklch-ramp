import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
import { Alert } from 'tdesign-react';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="themes-generate" title={t('生成主题', 'Generate a theme')}>
      <Code>{`const result = generateColorTheme('#0052D9', {\n  mode: 'both',\n  scale: { strategy: 'tonal', steps: 10 },\n  neutral: { steps: 14, tintStrength: 0.025 },\n  contrast: { normalText: 4.5, nonText: 3 },\n  contrastPolicy: 'adjust',\n});`}</Code>
      <Alert
        theme="info"
        message={t(
          '语义主题要求至少 10 阶品牌色，以分配不同交互角色。',
          'Semantic themes require at least 10 brand stops to assign distinct interaction roles.',
        )}
      />
    </Section>
  );
}
