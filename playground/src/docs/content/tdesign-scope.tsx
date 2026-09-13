import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Alert } from 'tdesign-react';
export default function Article() {
  const { t } = useI18n();
  return (
    <Section id="tdesign-scope" title={t('Token 范围', 'Token coverage')}>
      <DocParagraph>
        {t(
          '适配覆盖品牌、背景、文字、边框和相关容器变量；成功、警告和错误色沿用 TDesign 默认值。',
          'The adapter covers brand, surface, text, border, and related container variables; success, warning, and error colors retain TDesign defaults.',
        )}
      </DocParagraph>
      <Alert
        theme="warning"
        message={t(
          '升级 TDesign 后应重新核对变量和组件状态。适配器版本应与 TDesign 版本一起维护。',
          'Recheck variables and component states after upgrading TDesign. Maintain the adapter alongside the TDesign version.',
        )}
      />
    </Section>
  );
}
