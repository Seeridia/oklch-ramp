import { useMemo, type ReactNode } from 'react';
import { Typography, Link } from 'tdesign-react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { useI18n } from '../i18n';
import { CopyButton } from '../components/Scales';
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('plaintext', plaintext);
export function Code({
  children,
  language = 'typescript',
}: {
  children: string;
  language?: string;
}) {
  const { t } = useI18n();
  const highlighted = useMemo(
    () => hljs.highlight(children, { language: hljs.getLanguage(language) ? language : 'plaintext' }).value,
    [children, language],
  );
  return (
    <div className="guide-code">
      <div className="guide-code-toolbar">
        <span>{language === 'bash' ? 'Shell' : language}</span>
        <CopyButton value={children} label={t('复制代码', 'Copy code')} />
      </div>
      <pre
        className="code-block"
        tabIndex={0}
        aria-label={t('{language} 示例代码', '{language} example', { language })}
      >
        <code className="hljs" translate="no" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

export function Definitions({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="guide-definitions">
      {items.map(([term, description]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="guide-doc-section">
      <DocHeading level="h2">{title}</DocHeading>
      {children}
    </section>
  );
}

export function Text({ zh, en }: { zh: string; en: string }) {
  const { t } = useI18n();
  return <>{t(zh, en)}</>;
}

export const DocParagraph = Typography.Paragraph;
export const DocLink = Link;
export function DocHeading({
  id, level = 'h2', children,
}: {
  id?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children?: ReactNode;
}) {
  return <Typography.Title level={level} ref={node => { if (node && id) node.id = id; }}>{children}</Typography.Title>;
}
export function InlineCode({ children }: { children?: ReactNode }) {
  return <Typography.Text code>{children}</Typography.Text>;
}
