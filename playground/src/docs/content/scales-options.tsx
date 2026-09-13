import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="scales-options" title="ColorScaleOptions">
        <Definitions
          items={[
            ['steps', t('3–20，默认 10。', '3–20; default 10.')],
            ['strategy', 'tonal · adaptive-anchor · fixed-anchor'],
            [
              'anchorIndex',
              t('仅用于 fixed-anchor，从 0 开始。', 'Zero-based; fixed-anchor only.'),
            ],
            [
              'endpoints',
              t('curve 或 black-white，默认 curve。', 'curve or black-white; default curve.'),
            ],
            ['output', t('hex、rgb 或 oklch，默认 hex。', 'hex, rgb, or oklch; default hex.')],
            ['gamutMapping', 'chroma-reduction'],
            [
              'hueShift',
              t('统一偏移或与阶数等长的数组。', 'One shift or an array matching the stop count.'),
            ],
            [
              'lightnessCurve',
              t('严格递减、值域 0–1。', 'Strictly descending values from 0 to 1.'),
            ],
            ['chromaCurve', t('非负的种子彩度倍率。', 'Non-negative seed-chroma multipliers.')],
          ]}
        />
      </Section>); }
