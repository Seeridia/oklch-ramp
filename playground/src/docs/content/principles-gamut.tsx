import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { GamutDemo } from '../../components/PrincipleDemos';
export default function Article() { const {t} = useI18n();  return (<Section
        id="principles-gamut"
        title={t('端点与 sRGB 色域映射', 'Endpoints and sRGB gamut mapping')}
      >
        <DocParagraph>
          {t(
            'curve 端点保留预设曲线中的带色浅端与深端；black-white 会把明度范围拉伸至 1–0，并让首尾彩度归零，得到纯白和纯黑。固定锚点使用黑白端点时只能选择内部阶位。',
            'Curve endpoints retain tinted light and dark ends from the preset. Black-white stretches lightness to 1–0 and sets endpoint chroma to zero, producing pure white and black. A fixed anchor must remain inside the ramp when black-white endpoints are used.',
          )}
        </DocParagraph>
        <DocParagraph>
          {t(
            '候选色超出 sRGB 时，引擎会在 0 到目标彩度之间执行 28 次二分搜索，保持 OKLCH 明度和色相，寻找仍可显示的最大彩度。相比直接裁剪 RGB 通道，这种方式更能保留原本的明暗关系与色相。',
            'When a candidate falls outside sRGB, the engine performs 28 binary-search iterations between zero and the target chroma. It preserves OKLCH lightness and hue while finding the highest displayable chroma. This retains the intended lightness and hue better than clipping RGB channels directly.',
          )}
        </DocParagraph>
        <GamutDemo />
      </Section>); }
