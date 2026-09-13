import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
import { Code } from '../Blocks';
import { Button } from 'tdesign-react';
export default function Article() { const {t} = useI18n();  return (<Section id="api-types" title={t('类型导入', 'Type imports')}>
        <Code>{`import type {\n  ColorScaleOptions, ColorScaleResult, ColorStop,\n  ColorThemeOptions, ColorThemeResult, ContrastPolicy,\n  Diagnostics, NeutralScaleOptions, ScaleStrategy, SemanticTheme,\n} from '@okramp/core';`}</Code>
        <div className="guide-links">
          <Button
            href="https://github.com/Seeridia/okramp/blob/main/docs/API.md"
            target="_blank"
            variant="outline"
          >
            {t('仓库 API 文档', 'Repository API reference')}
          </Button>
        </div>
      </Section>); }
