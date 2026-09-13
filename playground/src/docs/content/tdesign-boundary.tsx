import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="tdesign-boundary" title={t('适配边界', 'Adapter boundary')}>
        <DocParagraph>
          {t(
            '核心 npm 包不依赖 TDesign，也不导出 --td-* Token。独立包 @okramp/tdesign 负责将 OKRamp 语义角色映射到 TDesign React。',
            'The npm package does not depend on TDesign or export --td-* tokens. The @okramp/tdesign package maps OKRamp semantic roles to TDesign React.',
          )}
        </DocParagraph>
      </Section>); }
