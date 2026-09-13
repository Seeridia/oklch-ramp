import { useI18n } from '../../i18n';
import { Section } from '../Blocks';
export default function Article() { const {t} = useI18n();  return (<Section id="start-runtime" title={t('运行环境', 'Runtime')}>
        <ul>
          <li>{t('Node.js 20 及以上。', 'Node.js 20 or later.')}</li>
          <li>
            {t('支持 ESM 的现代浏览器构建工具。', 'A modern browser build tool with ESM support.')}
          </li>
          <li>{t('包内包含 TypeScript 类型声明。', 'TypeScript declarations are included.')}</li>
          <li>{t('核心函数没有 DOM 副作用。', 'Core functions have no DOM side effects.')}</li>
        </ul>
      </Section>); }
