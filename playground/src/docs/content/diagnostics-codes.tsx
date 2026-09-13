import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="diagnostics-codes" title={t('诊断代码', 'Diagnostic codes')}>
        <Definitions
          items={[
            [
              t('输入', 'Input'),
              'ALPHA_IGNORED · SEED_TOO_LIGHT · SEED_TOO_DARK · SEED_LOW_CHROMA',
            ],
            [t('色域', 'Gamut'), 'SEED_OUT_OF_GAMUT · GAMUT_MAPPED'],
            [t('色阶', 'Scale'), 'DUPLICATE_STOPS · LOW_ADJACENT_DIFFERENCE · ANCHOR_MOVED'],
            [t('主题', 'Theme'), 'CONTRAST_TARGET_UNMET'],
          ]}
        />
      </Section>); }
