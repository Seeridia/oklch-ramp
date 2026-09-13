import { useEffect, useRef, useState, Children, isValidElement, type ReactNode, type ComponentType, type MouseEvent } from 'react';
import { Menu } from 'tdesign-react';
import { BookOpenIcon, SearchIcon } from 'tdesign-icons-react';
import { AccessibleInput } from './Controls';
import { useI18n } from '../i18n';
import { readUrlParam, urlWithParams } from '../url-state';
import catalog from '../docs/catalog.json';
import { Code, DocHeading, DocParagraph, DocLink, InlineCode } from '../docs/Blocks';

const markdownComponents = {
  h1: (props: { id?: string; children?: ReactNode }) => <DocHeading {...props} level="h1" />,
  h2: (props: { id?: string; children?: ReactNode }) => <DocHeading {...props} level="h2" />,
  h3: (props: { id?: string; children?: ReactNode }) => <DocHeading {...props} level="h3" />,
  h4: (props: { id?: string; children?: ReactNode }) => <DocHeading {...props} level="h4" />,
  h5: (props: { id?: string; children?: ReactNode }) => <DocHeading {...props} level="h5" />,
  h6: (props: { id?: string; children?: ReactNode }) => <DocHeading {...props} level="h6" />,
  p: DocParagraph,
  a: DocLink,
  code: InlineCode,
  pre({ children }: { children?: ReactNode }) {
    const child = Children.toArray(children)[0];
    if (isValidElement<{ children?: string; className?: string }>(child) && typeof child.props.children === 'string') {
      const language = child.props.className?.replace('language-', '') ?? 'plaintext';
      return <Code language={language}>{child.props.children.trimEnd()}</Code>;
    }
    return <pre>{children}</pre>;
  },
};
const modules = import.meta.glob<{ default: ComponentType<{ components: typeof markdownComponents }> }>('../docs/articles/*.mdx', { eager: true });
const groups = [
  ['getting-started', '快速开始', 'Getting started'],
  ['core', '色阶生成', 'Color scales'],
  ['principles', '生成原理', 'How it works'],
  ['themes', '语义主题', 'Semantic themes'],
  ['integrations', '集成', 'Integrations'],
  ['reference', 'API 与诊断', 'API & diagnostics'],
];
const articles = groups.flatMap(([group]) => catalog.filter(item => item.group === group));
const resolveId = () => {
  const id = readUrlParam('guideDoc', '');
  return articles.find(item => item.id === id)?.id ?? articles[0].id;
};
type Heading = { id: string; label: string; level: number };

export function Guide() {
  const { t, isZh } = useI18n();
  const [documentId, setDocumentId] = useState(resolveId);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>(() => groups.map(([id]) => id));
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const index = articles.findIndex(item => item.id === documentId);
  const current = articles[index];
  const group = groups.find(([id]) => id === current.group)!;
  useEffect(() => {
    setExpanded(previous => previous.includes(current.group) ? previous : [...previous, current.group]);
  }, [current.group]);
  const title = current.title[isZh ? 0 : 1];
  const Article = modules[`../docs/articles/${current.file}.mdx`].default;
  const href = (id: string) => urlWithParams({ page: 'guide', guideDoc: id }).split('#')[0];

  useEffect(() => {
    const sync = () => { setDocumentId(resolveId()); };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => { document.title = `${title} · OKRamp`; }, [title]);
  useEffect(() => {
    const nodes = Array.from(body.current?.querySelectorAll<HTMLHeadingElement>('h2, h3') ?? []);
    const used = new Set<string>();
    const outline = nodes.map((node, i) => {
      const base = node.id || `${current.file}-heading-${i + 1}`;
      let id = base;
      while (used.has(id)) id += '-section';
      used.add(id);
      node.id = id;
      return { id, label: node.textContent ?? '', level: Number(node.tagName.slice(1)) };
    });
    setHeadings(outline);
    const updateActive = () => {
      const above = nodes.filter(node => node.getBoundingClientRect().top <= 140);
      setActive((above[above.length - 1] ?? nodes[0])?.id ?? '');
    };
    const restore = () => {
      let hash = '';
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { /* Invalid URL hash. */ }
      if (hash) document.getElementById(hash)?.scrollIntoView();
      else window.scrollTo({ top: 0 });
      updateActive();
    };
    const frame = requestAnimationFrame(restore);
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, [documentId, isZh, current.file]);
  const select = (event: MouseEvent<HTMLElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    window.history.pushState(null, '', href(id));
    setDocumentId(id);
    window.scrollTo({ top: 0 });
  };
  const search = query.trim().toLocaleLowerCase();
  const matches = articles.filter(item => item.title.join(' ').toLocaleLowerCase().includes(search));
  return (
    <div className="guide-docs-shell guide-chapters-shell">
      <aside className="guide-doc-nav" aria-label={t('指南章节', 'Guide chapters')}>
        <div className="guide-nav-heading">
          <BookOpenIcon aria-hidden="true" />
          <strong>{t('使用指南', 'Documentation')}</strong>
        </div>
        <div className="guide-nav-search">
          <AccessibleInput
            value={query}
            onChange={setQuery}
            clearable
            prefixIcon={<SearchIcon aria-hidden="true" />}
            placeholder={t('搜索文章', 'Search articles')}
            aria-label={t('搜索文章标题', 'Search article titles')}
          />
        </div>
        <nav aria-label={t('文章导航', 'Article navigation')}>
          <Menu
            className="guide-chapter-menu"
            width="100%"
            value={documentId}
            expanded={search ? groups.filter(([id]) => matches.some(item => item.group === id)).map(([id]) => id) : expanded}
            onExpand={values => setExpanded(values.map(String))}
          >
            {groups.map(([id, zh, en]) => {
              const items = matches.filter(item => item.group === id);
              if (!items.length) return null;
              return (
                <Menu.SubMenu key={id} value={id} title={t(zh, en)}>
                  {items.map(item => (
                    <Menu.MenuItem
                      key={item.id}
                      value={item.id}
                      href={href(item.id)}
                      onClick={({ e }) => select(e, item.id)}
                    >
                      {item.title[isZh ? 0 : 1]}
                    </Menu.MenuItem>
                  ))}
                </Menu.SubMenu>
              );
            })}
          </Menu>
        </nav>
        {!matches.length && <p className="guide-nav-empty" role="status">{t('没有匹配的文章', 'No matching articles')}</p>}
      </aside>
      <article className="guide-document">
        <header className="guide-document-header">
          <span className="eyebrow">{t(group[1], group[2])}</span>
          <DocHeading level="h1">{title}</DocHeading>
          <DocParagraph>{current.description[isZh ? 0 : 1]}</DocParagraph>
        </header>
        <div className="guide-article-body" ref={body}><Article components={markdownComponents} /></div>
        <footer className="guide-pagination" aria-label={t('相邻文章', 'Adjacent articles')}>
          {[articles[index - 1], articles[index + 1]].map((item, i) => item ? <a key={i} href={href(item.id)} onClick={event => select(event, item.id)}><small>{i === 0 ? t('上一篇', 'Previous') : t('下一篇', 'Next')}</small><span>{item.title[isZh ? 0 : 1]}</span></a> : <span key={i} />)}
        </footer>
      </article>
      <aside className="guide-outline" aria-label={t('当前文档大纲', 'On this page')}>
        <strong>{t('本篇大纲', 'On this page')}</strong>
        <nav>{headings.map(item => <a key={item.id} href={`#${item.id}`} className={`${item.level === 3 ? 'is-subheading ' : ''}${active === item.id ? 'is-active' : ''}`} aria-current={active === item.id ? 'location' : undefined}>{item.label}</a>)}</nav>
      </aside>
    </div>
  );
}
