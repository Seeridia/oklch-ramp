import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
import { Alert } from 'tdesign-react';
export default function Article() { const {t} = useI18n();  return (<Section id="start-choose-api" title={t('选择 API', 'Choose an API')}>
        <Definitions
          items={[
            [
              'generateColorScale',
              t(
                '生成按感知明度排列的品牌色阶。',
                'Generate a brand scale ordered by perceived lightness.',
              ),
            ],
            [
              'generateNeutralScale',
              t('生成带轻微品牌倾向的中性色阶。', 'Generate a subtly brand-tinted neutral scale.'),
            ],
            [
              'generateColorTheme',
              t(
                '生成品牌色阶、中性色阶和明暗语义主题。',
                'Generate brand and neutral scales plus light and dark semantic themes.',
              ),
            ],
          ]}
        />
        <Alert
          theme="info"
          message={t(
            '颜色引擎不依赖 React、TDesign 或 DOM。组件库接入应放在应用适配层。',
            'The color engine does not depend on React, TDesign, or the DOM. Component-library integration belongs in the application adapter.',
          )}
        />
      </Section>); }
