import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="principles-oklch" title={t('为什么使用 OKLCH', 'Why OKLCH')}>
        <Definitions
          items={[
            [
              'L · Lightness',
              t(
                '描述感知明度，用于控制从浅到深的视觉顺序。',
                'Represents perceived lightness and controls the visual order from light to dark.',
              ),
            ],
            [
              'C · Chroma',
              t(
                '描述颜色强度，用于塑造浅端、中段和深端的饱和程度。',
                'Represents color intensity and shapes saturation across light, middle, and dark stops.',
              ),
            ],
            [
              'H · Hue',
              t(
                '描述色相角度；生成时尽量稳定，仅在显式设置 hueShift 时偏移。',
                'Represents the hue angle; it remains stable unless hueShift explicitly changes it.',
              ),
            ],
          ]}
        />
        <DocParagraph>
          {t(
            'RGB 与 HSL 中相同的数值步长不一定带来相同的视觉变化。OKLCH 将明度与彩度分开控制，使跨色相的色阶更容易获得连续的感知节奏；最终结果仍会约束到网页通用的 sRGB 色域。',
            'Equal numeric steps in RGB or HSL do not necessarily look equally spaced. OKLCH separates lightness from chroma, making perceptual pacing easier to control across hues, while final colors are still constrained to the web-standard sRGB gamut.',
          )}
        </DocParagraph>
      </Section>); }
