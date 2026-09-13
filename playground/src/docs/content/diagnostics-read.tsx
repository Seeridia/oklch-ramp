import { DocParagraph } from '../Blocks';
import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="diagnostics-read" title={t('读取诊断', 'Read diagnostics')}>
        <Code>{`const result = generateColorScale('#f8fbff');\nfor (const message of result.diagnostics.messages) {\n  console.log(message.code, message.severity, message.message);\n}`}</Code>
        <DocParagraph>
          {t(
            '合法但不理想的输入会返回消息，结果仍可使用；消息可能包含 stopIndexes 和 details。',
            'Valid but suboptimal inputs return messages while keeping the result usable; messages may include stopIndexes and details.',
          )}
        </DocParagraph>
      </Section>); }
