import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Definitions } from '../Blocks';
import { Alert } from 'tdesign-react';
export default function Article() { const {t} = useI18n();  return (<Section id="principles-theme" title={t('语义主题与对比度', 'Semantic themes and contrast')}>
        <DocParagraph>
          {t(
            '主题不是再生成一套颜色，而是从品牌色阶和中性色阶中为按钮、文字、背景与边框选择语义角色。深色主题拥有独立映射：页面背景取中性色深端，文字取浅端，品牌默认色通常比浅色主题更亮。',
            'A theme does not generate another palette. It selects semantic roles for controls, text, surfaces, and borders from the brand and neutral scales. Dark mode has an independent mapping: page surfaces use dark neutral stops, text uses light stops, and the default brand color is usually lighter than in light mode.',
          )}
        </DocParagraph>
        <Definitions
          items={[
            [
              'report',
              t(
                '保留初始语义映射，只报告未达到目标的组合。',
                'Keep the initial semantic mapping and report pairs that miss their targets.',
              ),
            ],
            [
              'adjust',
              t(
                '在对应色阶内寻找达到目标且与原角色颜色感知距离最近的候选色。',
                'Find a passing candidate in the relevant scale with the smallest perceptual distance from the original role color.',
              ),
            ],
            [
              'strict',
              t(
                '不自动修改颜色；存在任何失败项时抛出结构化异常。',
                'Do not modify colors; throw a structured error if any check fails.',
              ),
            ],
          ]}
        />
        <Alert
          theme="info"
          message={t(
            '默认目标为普通文本 4.5:1、重要非文本元素 3:1。诊断覆盖引擎声明的语义组合，不等同于对完整产品页面的无障碍审计。',
            'Default targets are 4.5:1 for body text and 3:1 for important non-text elements. Diagnostics cover declared engine semantics and are not a complete accessibility audit of a product interface.',
          )}
        />
      </Section>); }
