import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Dialog,
  Pagination,
  Radio,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'tdesign-react';
import {
  AddIcon,
  SearchIcon,
  LayersIcon,
  SunnyIcon,
  MoonIcon,
  CloseIcon,
} from 'tdesign-icons-react';
import type { ColorThemeResult, SemanticTheme } from '@okramp/core';
import { toTDesignTheme } from '../adapters/tdesign';
import { AccessibleInput, Field } from './Controls';
import { readUrlParam, updateUrlParams } from '../url-state';
import { useI18n } from '../i18n';
import enUS from 'tdesign-react/es/locale/en_US';
interface Project {
  id: string;
  name: string;
  status: string;
  owner: string;
}

function createInitialProjects(isZh: boolean): Project[] {
  return [
    {
      id: '1',
      name: isZh ? '品牌设计系统' : 'Brand design system',
      status: '进行中',
      owner: isZh ? '林晓' : 'Lin Xiao',
    },
    {
      id: '2',
      name: isZh ? '移动端体验升级' : 'Mobile experience upgrade',
      status: '已完成',
      owner: isZh ? '陈墨' : 'Chen Mo',
    },
    {
      id: '3',
      name: isZh ? '工作台 2.0' : 'Workspace 2.0',
      status: '进行中',
      owner: isZh ? '周宁' : 'Zhou Ning',
    },
    {
      id: '4',
      name: isZh ? '产品官网' : 'Product website',
      status: '待开始',
      owner: isZh ? '林晓' : 'Lin Xiao',
    },
    {
      id: '5',
      name: isZh ? '开放平台' : 'Open platform',
      status: '进行中',
      owner: isZh ? '陈墨' : 'Chen Mo',
    },
    {
      id: '6',
      name: isZh ? '主题规范' : 'Theme specification',
      status: '已完成',
      owner: isZh ? '周宁' : 'Zhou Ning',
    },
  ];
}

function PreviewCanvas({
  theme,
  scene,
  neutral,
}: {
  theme: SemanticTheme;
  scene: string;
  neutral: ColorThemeResult['scales']['neutral'];
}) {
  const { isZh, t } = useI18n();
  const modeLabel = theme.mode === 'light' ? t('浅色', 'light') : t('深色', 'dark');
  const statusLabels: Record<string, string> = {
    进行中: t('进行中', 'In progress'),
    已完成: t('已完成', 'Completed'),
    待开始: t('待开始', 'Not started'),
  };
  const statusLabel = (value: string) => statusLabels[value] ?? value;
  const host = useRef<HTMLDivElement>(null);
  const urlSuffix = theme.mode === 'light' ? 'Light' : 'Dark';
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [radio, setRadio] = useState('a');
  const [slider, setSlider] = useState(62);
  const [sampleTab, setSampleTab] = useState('overview');
  const [input, setInput] = useState(() => t('品牌设计系统', 'Brand design system'));
  const [choice, setChoice] = useState('design');
  const [search, setSearch] = useState(() => readUrlParam(`projectSearch${urlSuffix}`, ''));
  const [status, setStatus] = useState(() => readUrlParam(`projectStatus${urlSuffix}`, 'all'));
  const [page, setPage] = useState(() => {
    const value = Number(readUrlParam(`projectPage${urlSuffix}`, '1'));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  const [projects, setProjects] = useState<Project[]>(() => createInitialProjects(isZh));
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const filtered = projects.filter(
    (p) => p.name.includes(search) && (status === 'all' || p.status === status),
  );
  useEffect(() => {
    const syncFromUrl = () => {
      setSearch(readUrlParam(`projectSearch${urlSuffix}`, ''));
      setStatus(readUrlParam(`projectStatus${urlSuffix}`, 'all'));
      const nextPage = Number(readUrlParam(`projectPage${urlSuffix}`, '1'));
      setPage(Number.isInteger(nextPage) && nextPage > 0 ? nextPage : 1);
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [urlSuffix]);
  useEffect(() => {
    setProjects(createInitialProjects(isZh));
    setInput(isZh ? '品牌设计系统' : 'Brand design system');
  }, [isZh]);
  return (
    <div className="preview-frame">
      <div className="preview-frame-label">
        {theme.mode === 'light' ? (
          <SunnyIcon aria-hidden="true" />
        ) : (
          <MoonIcon aria-hidden="true" />
        )}{' '}
        {theme.mode === 'light' ? t('浅色主题', 'Light theme') : t('深色主题', 'Dark theme')}
        <span>{t('实时预览', 'LIVE PREVIEW')}</span>
      </div>
      <div
        ref={host}
        className="td-theme-scope preview-canvas"
        data-mode={theme.mode}
        style={toTDesignTheme(theme, neutral) as CSSProperties}
      >
        <ConfigProvider globalConfig={{ ...(isZh ? {} : enUS), attach: () => host.current! }}>
          <div className="preview-brand">
            <LayersIcon aria-hidden="true" />
            <strong>{t('设计工作台', 'Design Workspace')}</strong>
            <Tag size="small" theme="primary" variant="light">
              {t('团队版', 'Team')}
            </Tag>
          </div>
          {scene === 'components' ? (
            <div className="component-gallery">
              <section>
                <h4>
                  {t('按钮', 'Buttons')} <span>Button</span>
                </h4>
                <Space breakLine>
                  <Button
                    theme="primary"
                    onClick={() => {
                      setEditing({ id: '', name: '', status: '进行中', owner: '我' });
                      setName('');
                    }}
                  >
                    {t('主要按钮', 'Primary')}
                  </Button>
                  <Button variant="outline">{t('次要按钮', 'Secondary')}</Button>
                  <Button theme="primary" variant="text">
                    {t('文字按钮', 'Text button')}
                  </Button>
                  <Button theme="primary" disabled>
                    {t('禁用', 'Disabled')}
                  </Button>
                </Space>
                <p className="field-hint">
                  {t(
                    '可悬停、按下与键盘聚焦，观察真实交互状态。',
                    'Hover, press, or focus with the keyboard to inspect real interaction states.',
                  )}
                </p>
              </section>
              <section>
                <h4>
                  {t('表单', 'Forms')} <span>Form</span>
                </h4>
                <div className="preview-form">
                  <AccessibleInput
                    aria-label={t('{mode}示例名称', '{mode} sample name', { mode: modeLabel })}
                    name={`${theme.mode}-sample-name`}
                    value={input}
                    onChange={setInput}
                    placeholder={t('例如：品牌设计系统…', 'e.g. Brand design system…')}
                    autocomplete="off"
                  />
                  <Select
                    aria-label={t('{mode}示例分类', '{mode} sample category', { mode: modeLabel })}
                    inputProps={{ name: `${theme.mode}-sample-category`, autocomplete: 'off' }}
                    value={choice}
                    onChange={(v) => setChoice(typeof v === 'string' ? v : 'design')}
                    options={[
                      { label: t('设计系统', 'Design system'), value: 'design' },
                      { label: t('产品体验', 'Product experience'), value: 'product' },
                    ]}
                  />
                  <AccessibleInput
                    aria-label={t('{mode}禁用状态示例', '{mode} disabled example', {
                      mode: modeLabel,
                    })}
                    name={`${theme.mode}-disabled-example`}
                    value={t('禁用状态', 'Disabled state')}
                    disabled
                  />
                  <div>
                    <AccessibleInput
                      aria-label={t('{mode}错误状态示例', '{mode} error example', {
                        mode: modeLabel,
                      })}
                      aria-describedby={`${theme.mode}-sample-error`}
                      name={`${theme.mode}-error-example`}
                      placeholder={t('例如：请输入项目名称…', 'e.g. Enter a project name…')}
                      status="error"
                    />
                    <p className="preview-field-error" id={`${theme.mode}-sample-error`}>
                      {t('项目名称不能为空', 'Project name is required')}
                    </p>
                  </div>
                </div>
              </section>
              <section>
                <h4>
                  {t('选择与控制', 'Selection controls')} <span>Selection</span>
                </h4>
                <Space breakLine size={24}>
                  <Checkbox checked={checked} onChange={setChecked}>
                    {t('自动同步', 'Auto sync')}
                  </Checkbox>
                  <Radio.Group
                    aria-label={t('{mode}配置方式', '{mode} configuration mode', {
                      mode: modeLabel,
                    })}
                    value={radio}
                    onChange={(v) => setRadio(String(v))}
                    options={[
                      { label: t('默认', 'Default'), value: 'a' },
                      { label: t('自定义', 'Custom'), value: 'b' },
                    ]}
                  />
                  <Switch
                    value={enabled}
                    onChange={(v) => setEnabled(Boolean(v))}
                    aria-label={t('{mode}启用主题', '{mode} enable theme', { mode: modeLabel })}
                  />
                </Space>
                <Slider
                  aria-label={t('{mode}配置强度', '{mode} intensity', { mode: modeLabel })}
                  value={slider}
                  onChange={(v) => setSlider(Number(v))}
                />
              </section>
              <section>
                <h4>
                  {t('导航与状态', 'Navigation and status')} <span>Feedback</span>
                </h4>
                <Tabs value={sampleTab} onChange={(v) => setSampleTab(String(v))}>
                  <Tabs.TabPanel value="overview" label={t('概览', 'Overview')}>
                    <p className="sample-tab-copy">
                      {t('查看当前主题的整体表现。', 'Review the overall appearance of the theme.')}
                    </p>
                  </Tabs.TabPanel>
                  <Tabs.TabPanel value="members" label={t('成员', 'Members')}>
                    <p className="sample-tab-copy">
                      {t(
                        '3 位成员正在参与设计协作。',
                        'Three members are collaborating on the design.',
                      )}
                    </p>
                  </Tabs.TabPanel>
                </Tabs>
                <Space breakLine>
                  <Tag theme="primary" variant="light">
                    {t('品牌标签', 'Brand tag')}
                  </Tag>
                  <Tag theme="success" variant="light">
                    {t('已完成', 'Completed')}
                  </Tag>
                  <Tag theme="warning" variant="light">
                    {t('待处理', 'Pending')}
                  </Tag>
                  <Tag theme="danger" variant="light">
                    {t('需关注', 'Attention')}
                  </Tag>
                </Space>
                <Alert
                  theme="info"
                  message={t(
                    '主题已就绪，开始构建你的下一款产品。',
                    'Your theme is ready. Start building your next product.',
                  )}
                />
              </section>
            </div>
          ) : (
            <div className="business-scene">
              <div className="section-heading">
                <div>
                  <h3>{t('项目列表', 'Projects')}</h3>
                  <p>
                    {t('让每一个好想法，有序发生。', 'Give every good idea a clear path forward.')}
                  </p>
                </div>
                <Button
                  theme="primary"
                  icon={<AddIcon aria-hidden="true" />}
                  onClick={() => {
                    setEditing({ id: '', name: '', status: '进行中', owner: '我' });
                    setName('');
                  }}
                >
                  {t('新建项目', 'New project')}
                </Button>
              </div>
              <div className="business-filter">
                <AccessibleInput
                  aria-label={t('{mode}搜索项目', '{mode} search projects', { mode: modeLabel })}
                  name={`${theme.mode}-project-search`}
                  prefixIcon={<SearchIcon aria-hidden="true" />}
                  placeholder={t('例如：品牌设计系统…', 'e.g. Brand design system…')}
                  autocomplete="off"
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                    updateUrlParams(
                      {
                        [`projectSearch${urlSuffix}`]: v || null,
                        [`projectPage${urlSuffix}`]: null,
                      },
                      'replace',
                    );
                  }}
                />
                <Select
                  aria-label={t('{mode}项目状态', '{mode} project status', { mode: modeLabel })}
                  inputProps={{ name: `${theme.mode}-project-status`, autocomplete: 'off' }}
                  value={status}
                  onChange={(v) => {
                    const value = typeof v === 'string' ? v : 'all';
                    setStatus(value);
                    setPage(1);
                    updateUrlParams(
                      {
                        [`projectStatus${urlSuffix}`]: value === 'all' ? null : value,
                        [`projectPage${urlSuffix}`]: null,
                      },
                      'replace',
                    );
                  }}
                  options={['all', '进行中', '已完成', '待开始'].map((v) => ({
                    value: v,
                    label: v === 'all' ? t('全部状态', 'All statuses') : statusLabel(v),
                  }))}
                />
              </div>
              <Table
                rowKey="id"
                data={filtered.slice((page - 1) * 4, page * 4)}
                columns={[
                  { colKey: 'name', title: t('项目名称', 'Project name'), ellipsis: true },
                  {
                    colKey: 'status',
                    title: t('状态', 'Status'),
                    width: 85,
                    cell: ({ row }) => (
                      <Tag
                        size="small"
                        variant="light"
                        theme={
                          row.status === '已完成'
                            ? 'success'
                            : row.status === '进行中'
                              ? 'primary'
                              : 'default'
                        }
                      >
                        {statusLabel(row.status)}
                      </Tag>
                    ),
                  },
                  {
                    colKey: 'operation',
                    title: t('操作', 'Actions'),
                    width: 65,
                    cell: ({ row }) => (
                      <Button
                        size="small"
                        theme="primary"
                        variant="text"
                        onClick={() => {
                          setEditing(row as Project);
                          setName(row.name);
                        }}
                      >
                        {t('编辑', 'Edit')}
                      </Button>
                    ),
                  },
                ]}
              />
              <Pagination
                aria-label={t('{mode}项目分页', '{mode} project pagination', { mode: modeLabel })}
                size="small"
                total={filtered.length}
                current={page}
                pageSize={4}
                showPageSize={false}
                showJumper={false}
                onCurrentChange={(value) => {
                  setPage(value);
                  updateUrlParams(
                    { [`projectPage${urlSuffix}`]: value === 1 ? null : value },
                    'replace',
                  );
                }}
              />
            </div>
          )}
          <Dialog
            closeBtn={
              <Button
                theme="default"
                variant="text"
                shape="square"
                aria-label={t('关闭项目对话框', 'Close project dialog')}
                icon={<CloseIcon aria-hidden="true" />}
              />
            }
            visible={editing !== null}
            header={editing?.id ? t('编辑项目', 'Edit project') : t('新建项目', 'New project')}
            width="min(420px, calc(100vw - 32px))"
            placement="center"
            confirmBtn={{ content: t('保存项目', 'Save project'), disabled: !name.trim() }}
            onClose={() => setEditing(null)}
            onConfirm={() => {
              if (!editing || !name.trim()) return;
              setProjects((current) =>
                editing.id
                  ? current.map((p) => (p.id === editing.id ? { ...p, name: name.trim() } : p))
                  : [{ ...editing, id: crypto.randomUUID(), name: name.trim() }, ...current],
              );
              setEditing(null);
              setPage(1);
            }}
          >
            <Field label={t('项目名称', 'Project name')} htmlFor={`${theme.mode}-project-name`}>
              <AccessibleInput
                inputId={`${theme.mode}-project-name`}
                name={`${theme.mode}-project-name`}
                aria-label={t('项目名称', 'Project name')}
                value={name}
                onChange={setName}
                placeholder={t('例如：移动端体验升级…', 'e.g. Mobile experience upgrade…')}
                maxlength={40}
                autocomplete="off"
              />
            </Field>
            <p className="field-hint">
              {t(
                '这是可交互的演示数据，仅在当前预览中生效。',
                'This interactive demo data exists only in the current preview.',
              )}
            </p>
          </Dialog>
        </ConfigProvider>
      </div>
    </div>
  );
}
export function Preview({ theme }: { theme: ColorThemeResult }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(() => {
    const value = readUrlParam('previewMode', 'both');
    return ['light', 'dark', 'both'].includes(value) ? value : 'both';
  });
  const [scene, setScene] = useState(() => {
    const value = readUrlParam('scene', 'components');
    return ['components', 'business'].includes(value) ? value : 'components';
  });
  useEffect(() => {
    const syncFromUrl = () => {
      const nextMode = readUrlParam('previewMode', 'both');
      const nextScene = readUrlParam('scene', 'components');
      setMode(['light', 'dark', 'both'].includes(nextMode) ? nextMode : 'both');
      setScene(['components', 'business'].includes(nextScene) ? nextScene : 'components');
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);
  return (
    <div className="stack">
      <Card bordered={false} className="preview-toolbar">
        <div className="section-heading">
          <div>
            <h3>{t('真实组件，实时主题', 'Real components, live theme')}</h3>
            <p>
              {t(
                '基于 TDesign React · 状态色沿用官方默认值',
                'Built with TDesign React · Status colors retain official defaults',
              )}
            </p>
          </div>
          <div className="preview-switches">
            <Radio.Group
              aria-label={t('预览内容', 'Preview content')}
              size="medium"
              theme="button"
              variant="default-filled"
              value={scene}
              onChange={(v) => {
                const value = String(v);
                setScene(value);
                updateUrlParams({ scene: value === 'components' ? null : value });
              }}
              options={[
                { label: t('组件状态', 'Components'), value: 'components' },
                { label: t('业务场景', 'Business scenario'), value: 'business' },
              ]}
            />
            <Radio.Group
              aria-label={t('预览主题模式', 'Preview theme mode')}
              size="medium"
              theme="button"
              variant="default-filled"
              value={mode}
              onChange={(v) => {
                const value = String(v);
                setMode(value);
                updateUrlParams({ previewMode: value === 'both' ? null : value });
              }}
              options={[
                { label: t('浅色', 'Light'), value: 'light' },
                { label: t('深色', 'Dark'), value: 'dark' },
                { label: t('并排', 'Side by side'), value: 'both' },
              ]}
            />
          </div>
        </div>
      </Card>
      <div className={`preview-grid ${mode === 'both' ? 'dual' : ''}`}>
        {(['light', 'dark'] as const)
          .filter((m) => mode === 'both' || mode === m)
          .map(
            (m) =>
              theme.themes[m] && (
                <PreviewCanvas
                  key={m}
                  theme={theme.themes[m]!}
                  scene={scene}
                  neutral={theme.scales.neutral}
                />
              ),
          )}
      </div>
    </div>
  );
}
