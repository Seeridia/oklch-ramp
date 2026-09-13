import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Button } from 'tdesign-react';
export default function Article() { const {t} = useI18n();  return (<Section id="principles-limits" title={t('稳定性与已知边界', 'Stability and known limits')}>
        <ul>
          <li>
            {t(
              '不同色相共享基础曲线，困难色相主要依靠色域映射修正。',
              'Hues share the base curves; difficult hues are primarily corrected through gamut mapping.',
            )}
          </li>
          <li>
            {t(
              '当前对比度模型采用 WCAG 2.x，尚未加入 APCA。',
              'The current contrast model uses WCAG 2.x; APCA is not included yet.',
            )}
          </li>
          <li>
            {t(
              '输出基线是 sRGB，目前不生成原生 Display-P3 色板。',
              'The output baseline is sRGB; native Display-P3 palettes are not generated.',
            )}
          </li>
          <li>
            {t(
              '8-bit 输出量化在极端输入下可能产生相邻重复，诊断会明确报告。',
              'Eight-bit output quantization can produce adjacent duplicates for extreme inputs, which diagnostics report explicitly.',
            )}
          </li>
          <li>
            {t(
              '算法升级可能改变具体颜色；需要固定结果时应锁定 npm 版本。',
              'Algorithm updates may change exact colors; pin the npm version when deterministic output is required.',
            )}
          </li>
        </ul>
        <div className="guide-links">
          <Button
            href="https://github.com/Seeridia/okramp/blob/main/docs/ALGORITHMS.md"
            target="_blank"
            variant="outline"
          >
            {t('查看仓库算法说明', 'Read the repository algorithm notes')}
          </Button>
        </div>
      </Section>); }
