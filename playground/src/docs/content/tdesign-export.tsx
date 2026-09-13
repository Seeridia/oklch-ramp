import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="tdesign-export" title={t('使用导出文件', 'Use an exported file')}>
        <ol>
          <li>
            {t('在工作台配置颜色与策略。', 'Configure colors and policies in the workspace.')}
          </li>
          <li>
            {t(
              '在导出面板选择 TDesign、CSS 和主题模式。',
              'Choose TDesign, CSS, and theme modes in Export.',
            )}
          </li>
          <li>
            {t('在 TDesign 默认样式之后加载文件。', 'Load the file after TDesign default styles.')}
          </li>
        </ol>
        <Code>{`import 'tdesign-react/dist/tdesign.css';\nimport './okramp-theme.css';`}</Code>
        <DocParagraph>
          {t(
            '语义变量引用基础色阶原语，便于追踪来源。',
            'Semantic variables reference base-scale primitives for traceability.',
          )}
        </DocParagraph>
      </Section>); }
