import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="principles-pipeline" title={t('完整处理流程', 'Generation pipeline')}>
        <DocParagraph>
          {t(
            'OKRamp 先把 CSS 颜色解析为 OKLCH，再按策略计算每一阶的目标明度、彩度与色相。候选色会经过 sRGB 色域映射、格式化和质量诊断，最后才在品牌色阶与中性色阶之上建立语义主题。',
            'OKRamp first parses a CSS color into OKLCH, then computes the target lightness, chroma, and hue for every stop. Candidates pass through sRGB gamut mapping, formatting, and quality diagnostics before semantic themes are built from the brand and neutral scales.',
          )}
        </DocParagraph>
        <ol>
          <li>
            {t(
              '解析输入并规范化为不透明的 sRGB 种子色。',
              'Parse the input and normalize it to an opaque sRGB seed.',
            )}
          </li>
          <li>
            {t(
              '转换到 OKLCH，读取感知明度 L、彩度 C 和色相 H。',
              'Convert to OKLCH and read perceptual lightness L, chroma C, and hue H.',
            )}
          </li>
          <li>
            {t(
              '根据策略与曲线生成各阶的目标 L/C/H。',
              'Generate target L/C/H values from the selected strategy and curves.',
            )}
          </li>
          <li>
            {t(
              '保持 L/H、降低 C，将超色域候选色映射到 sRGB。',
              'Map out-of-gamut candidates into sRGB by preserving L/H and reducing C.',
            )}
          </li>
          <li>
            {t(
              '输出颜色并检查重复、相邻感知差异和主题对比度。',
              'Format the colors and inspect duplicates, adjacent perceptual differences, and theme contrast.',
            )}
          </li>
        </ol>
      </Section>); }
