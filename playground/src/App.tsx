import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Drawer,
  Empty,
  Layout,
  Menu,
  Radio,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
} from 'tdesign-react';
import {
  AppIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CloseIcon,
  CodeIcon,
  DownloadIcon,
  LogoGithubIcon,
  LayersIcon,
  MenuFoldIcon,
  MenuUnfoldIcon,
  MoonIcon,
  RefreshIcon,
  SettingIcon,
  SunnyIcon,
} from 'tdesign-icons-react';
import { Controls, Field } from './components/Controls';
import { Scales, copyText } from './components/Scales';
import { Preview } from './components/Preview';
import { Comparison, Diagnostics, Guide, Tokens } from './components/Analysis';
import { DEFAULTS, generate, generateComparison, type DisplayFormat, type Settings } from './model';
import { createExport, type ExportFormat, type ExportMode, type ExportTarget } from './export';
import { toTDesignTheme } from './adapters/tdesign';
import { readUrlParam, updateUrlParams, urlWithParams } from './url-state';
import { readSettings, writeSettings } from './settings-url';
import { localizeEngineError, useI18n } from './i18n';
import enUS from 'tdesign-react/es/locale/en_US';

const PAGES = new Set(['workspace', 'compare', 'guide']);
const TABS = new Set(['scale', 'preview', 'tokens', 'diagnostics']);
function initialMode(): 'light' | 'dark' {
  try {
    return (localStorage.getItem('okramp-ui-mode') ??
      localStorage.getItem('color-studio-ui-mode')) === 'dark'
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}
export function App() {
  const { locale, isZh, setLocale, t } = useI18n();
  const NAV = [
    {
      value: 'workspace',
      label: t('色彩工作台', 'Color workspace'),
      icon: <AppIcon aria-hidden="true" />,
    },
    {
      value: 'compare',
      label: t('方案对比', 'Method comparison'),
      icon: <ChartBarIcon aria-hidden="true" />,
    },
    {
      value: 'guide',
      label: t('使用指南', 'Documentation'),
      icon: <BookOpenIcon aria-hidden="true" />,
    },
  ];
  const [settings, storeSettings] = useState<Settings>(() => readSettings('workspace'));
  const setSettings = (next: Settings) => {
    storeSettings(next);
    writeSettings('workspace', next);
  };
  const attempt = useMemo(() => {
    try {
      return { result: generate(settings), error: '' };
    } catch (error) {
      return { result: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [settings]);
  const [lastValid, setLastValid] = useState(() => generate(DEFAULTS));
  useEffect(() => {
    if (attempt.result) setLastValid(attempt.result);
  }, [attempt.result]);
  const result = attempt.result ?? lastValid;
  const generationError = localizeEngineError(attempt.error, locale);
  const [page, setPage] = useState(() => {
    const value = readUrlParam('page', 'workspace');
    return PAGES.has(value) ? value : 'workspace';
  });
  const [comparisonSettings, storeComparisonSettings] = useState<Settings>(() =>
    readSettings('compare'),
  );
  const setComparisonSettings = (next: Settings) => {
    storeComparisonSettings(next);
    writeSettings('compare', next);
  };
  const comparisonAttempt = useMemo(() => {
    try {
      return { result: generateComparison(comparisonSettings), error: '' };
    } catch (error) {
      return { result: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [comparisonSettings]);
  const [lastComparison, setLastComparison] = useState(() => generateComparison(DEFAULTS));
  const comparisonError = localizeEngineError(comparisonAttempt.error, locale);
  useEffect(() => {
    if (comparisonAttempt.result) setLastComparison(comparisonAttempt.result);
  }, [comparisonAttempt.result]);
  const [tab, setTab] = useState(() => {
    const value = readUrlParam('tab', 'scale');
    return TABS.has(value) ? value : 'scale';
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [format, setFormat] = useState<DisplayFormat>('hex');
  const [uiMode, setUiMode] = useState(initialMode);
  const [applyToShell, setApplyToShell] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTarget>('tdesign');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [exportMode, setExportMode] = useState<ExportMode>('both');
  const [sections, setSections] = useState(['brand', 'neutral', 'semantic']);
  useEffect(() => {
    document.documentElement.setAttribute('theme-mode', uiMode);
    try {
      localStorage.setItem('okramp-ui-mode', uiMode);
    } catch {
      /* persistence is optional */
    }
  }, [uiMode]);
  useEffect(() => {
    const hideDecorativeIcons = () => {
      for (const icon of document.querySelectorAll('svg.t-icon:not([aria-hidden])')) {
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');
      }
    };
    hideDecorativeIcons();
    const observer = new MutationObserver(hideDecorativeIcons);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const syncFromUrl = () => {
      storeSettings(readSettings('workspace'));
      storeComparisonSettings(readSettings('compare'));
      const nextPage = readUrlParam('page', 'workspace');
      const nextTab = readUrlParam('tab', 'scale');
      setPage(PAGES.has(nextPage) ? nextPage : 'workspace');
      setTab(TABS.has(nextTab) ? nextTab : 'scale');
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);
  useEffect(() => {
    const values =
      applyToShell && result.theme?.themes[uiMode]
        ? toTDesignTheme(result.theme.themes[uiMode]!, result.theme.scales.neutral)
        : {};
    for (const [key, value] of Object.entries(values))
      document.documentElement.style.setProperty(key, value);
    const themeColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--td-bg-color-page')
      .trim();
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColor || (uiMode === 'dark' ? '#181818' : '#f5f7fa'));
    return () => {
      for (const key of Object.keys(values)) document.documentElement.style.removeProperty(key);
    };
  }, [applyToShell, result.theme, uiMode]);
  useEffect(() => {
    if (page !== 'guide')
      document.title = `${NAV.find((item) => item.value === page)?.label ?? t('色彩工作台', 'Color workspace')} · OKRamp`;
  }, [locale, page]);
  const messages = result.theme?.diagnostics.messages ?? result.scale.diagnostics.messages;
  const warningCount = messages.filter((m) => m.severity !== 'info').length;
  const exportDisabled =
    Boolean(attempt.error) ||
    sections.length === 0 ||
    (exportTarget !== 'generic' && !result.theme) ||
    (sections.length === 1 && sections[0] === 'semantic' && !result.theme);
  const exportValue = createExport(result, {
    format: exportFormat,
    target: exportTarget,
    mode: exportMode,
    colorFormat: format,
    sections,
  });
  const changePage = (value: string) => {
    setPage(value);
    updateUrlParams({ page: value === 'workspace' ? null : value });
    setMobileNav(false);
  };
  const changeTab = (value: string) => {
    setTab(value);
    updateUrlParams({ tab: value === 'scale' ? null : value });
  };
  const openWorkspace = (workspaceTab = 'scale') => {
    setPage('workspace');
    setTab(workspaceTab);
    setMobileNav(false);
    updateUrlParams({ page: null, tab: workspaceTab === 'scale' ? null : workspaceTab });
  };
  const navigation = (
    <Menu
      width="100%"
      value={page}
      collapsed={collapsed && !mobileNav}
      onChange={(value) => changePage(String(value))}
    >
      {NAV.map((item) => (
        <Menu.MenuItem key={item.value} value={item.value} icon={item.icon}>
          {item.label}
        </Menu.MenuItem>
      ))}
    </Menu>
  );
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportValue], {
        type: exportFormat === 'json' ? 'application/json' : 'text/plain;charset=utf-8',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `okramp-theme-${exportTarget}.${exportFormat === 'typescript' ? 'ts' : exportFormat}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <ConfigProvider globalConfig={isZh ? {} : enUS}>
      <a className="skip-link" href="#main-content">
        {t('跳到主要内容', 'Skip to main content')}
      </a>
      <Layout className={`app-shell ${collapsed ? 'nav-collapsed' : ''}`}>
        <Layout.Aside width={collapsed ? '64px' : '208px'} className="app-sidebar">
          <a
            className="brand-logo"
            href={urlWithParams({ page: null, tab: null })}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              openWorkspace();
            }}
            aria-label={t('OKRamp 首页', 'OKRamp home')}
          >
            <span className="brand-icon">
              <LayersIcon aria-hidden="true" />
            </span>
            {!collapsed && <span>OKRamp</span>}
          </a>
          {navigation}
          <div className="sidebar-bottom">
            <Button
              variant="text"
              shape="square"
              aria-label={
                collapsed
                  ? t('展开导航', 'Expand navigation')
                  : t('折叠导航', 'Collapse navigation')
              }
              icon={
                collapsed ? (
                  <MenuUnfoldIcon aria-hidden="true" />
                ) : (
                  <MenuFoldIcon aria-hidden="true" />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
        </Layout.Aside>
        <Layout className="main-layout">
          <Layout.Header className="app-header">
            <div className="header-left">
              <Button
                className="mobile-menu"
                shape="square"
                variant="text"
                aria-label={t('打开导航', 'Open navigation')}
                icon={<MenuUnfoldIcon aria-hidden="true" />}
                onClick={() => setMobileNav(true)}
              />
              <Breadcrumb
                options={[
                  { content: t('设计工具', 'Design tools') },
                  { content: NAV.find((n) => n.value === page)?.label },
                ]}
              />
            </div>
            <Space size={12} align="center" className="header-actions">
              <Tag variant="light" className="header-version">
                OKRAMP
              </Tag>
              <Tooltip content={t('查看源码', 'View source')}>
                <Button
                  aria-label={t('查看源码', 'View source')}
                  variant="text"
                  shape="square"
                  icon={<LogoGithubIcon aria-hidden="true" />}
                  href="https://github.com/Seeridia/okramp"
                  target="_blank"
                />
              </Tooltip>
              <Tooltip content={t('切换为英文', 'Switch to Chinese')}>
                <Button
                  className="language-switch"
                  aria-label={t('切换为英文', 'Switch to Chinese')}
                  variant="text"
                  onClick={() => setLocale(isZh ? 'en-US' : 'zh-CN')}
                >
                  {isZh ? 'EN' : '中文'}
                </Button>
              </Tooltip>
              <Tooltip
                content={
                  uiMode === 'light'
                    ? t('切换深色界面', 'Switch to dark mode')
                    : t('切换浅色界面', 'Switch to light mode')
                }
              >
                <Button
                  aria-label={
                    uiMode === 'light'
                      ? t('切换深色界面', 'Switch to dark mode')
                      : t('切换浅色界面', 'Switch to light mode')
                  }
                  variant="text"
                  shape="square"
                  icon={
                    uiMode === 'light' ? (
                      <MoonIcon aria-hidden="true" />
                    ) : (
                      <SunnyIcon aria-hidden="true" />
                    )
                  }
                  onClick={() => setUiMode(uiMode === 'light' ? 'dark' : 'light')}
                />
              </Tooltip>
            </Space>
          </Layout.Header>
          <Layout.Content className="app-content" id="main-content">
            {page !== 'guide' && (
              <div className="page-heading">
                <div>
                  <h1>{NAV.find((n) => n.value === page)?.label}</h1>
                  <p>
                    {page === 'workspace'
                      ? t(
                          '从一个主色，构建协调、可用的色彩主题。',
                          'Build a coherent, usable color theme from one seed color.',
                        )
                      : page === 'compare'
                        ? t(
                            '相同的主色，对比不同颜色空间的生成效果。',
                            'Compare generation methods using the same seed color.',
                          )
                        : t(
                            '了解色彩策略，把设计带入代码。',
                            'Understand the color system and bring it into code.',
                          )}
                  </p>
                </div>
                {page !== 'guide' && (
                  <Space breakLine size={8} className="page-actions">
                    {page === 'workspace' && (
                      <Button
                        className="mobile-settings"
                        theme="default"
                        variant="outline"
                        icon={<SettingIcon aria-hidden="true" />}
                        onClick={() => setControlsOpen(true)}
                      >
                        {t('参数', 'Settings')}
                      </Button>
                    )}
                    <Button
                      theme="default"
                      variant="outline"
                      icon={<RefreshIcon aria-hidden="true" />}
                      onClick={() => {
                        if (page === 'compare') {
                          setComparisonSettings({ ...DEFAULTS });
                          return;
                        }
                        setSettings({ ...DEFAULTS });
                        setApplyToShell(true);
                      }}
                    >
                      {t('恢复默认', 'Reset')}
                    </Button>
                    {page === 'workspace' && (
                      <Button
                        theme="primary"
                        icon={<DownloadIcon aria-hidden="true" />}
                        disabled={Boolean(attempt.error)}
                        onClick={() => setExportOpen(true)}
                      >
                        {t('导出主题', 'Export theme')}
                      </Button>
                    )}
                  </Space>
                )}
              </div>
            )}
            {attempt.error && page === 'workspace' && (
              <Alert
                className="generation-error"
                theme="error"
                title={t(
                  '当前配置生成失败，正在展示上次有效结果',
                  'Generation failed; showing the last valid result',
                )}
                message={`${generationError} ${t('请修改参数后重试；导出已暂停。', 'Change the settings and try again. Export is paused.')}`}
              />
            )}
            {page === 'guide' ? (
              <Guide />
            ) : (
              <div className={`workspace-grid ${page === 'compare' ? 'compare-workspace' : ''}`}>
                {page === 'workspace' && (
                  <Card className="control-card" bordered={false}>
                    <Controls settings={settings} onChange={setSettings} error={generationError} />
                  </Card>
                )}
                <div className="result-area">
                  {page === 'compare' ? (
                    <>
                      {comparisonAttempt.error && (
                        <Alert
                          theme="error"
                          message={`${comparisonError} ${t('正在展示上次有效结果。', 'Showing the last valid result.')}`}
                        />
                      )}
                      <Comparison
                        result={comparisonAttempt.result ?? lastComparison}
                        settings={comparisonSettings}
                        onChange={setComparisonSettings}
                        error={comparisonError}
                      />
                    </>
                  ) : (
                    <>
                      <div className="result-tabs">
                        <Tabs value={tab} onChange={(value) => changeTab(String(value))}>
                          <Tabs.TabPanel
                            value="scale"
                            label={
                              <span className="tab-label">
                                <LayersIcon aria-hidden="true" />
                                {t('色阶', 'Scales')}
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="preview"
                            label={
                              <span className="tab-label">
                                <AppIcon aria-hidden="true" />
                                {t('组件预览', 'Preview')}
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="tokens"
                            label={
                              <span className="tab-label">
                                <CodeIcon aria-hidden="true" />
                                Token
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="diagnostics"
                            label={
                              <span className="tab-label">
                                <CheckCircleIcon aria-hidden="true" />
                                {t('诊断', 'Diagnostics')}
                                {warningCount > 0 && <Badge count={warningCount} />}
                              </span>
                            }
                          />
                        </Tabs>
                        <span className="live-indicator">
                          <span className="status-dot" />
                          {t('实时生成', 'Live')}
                        </span>
                      </div>
                      {tab === 'scale' && (
                        <Scales result={result} format={format} onFormat={setFormat} />
                      )}
                      {(tab === 'preview' || tab === 'tokens') && !result.theme && (
                        <Card bordered={false}>
                          <Empty
                            description={t(
                              '主题需要至少 10 阶品牌色',
                              'Themes require at least 10 brand stops',
                            )}
                          />
                          <Button
                            theme="primary"
                            onClick={() => setSettings({ ...settings, steps: 10 })}
                          >
                            {t('切换为 10 阶并生成主题', 'Use 10 stops and generate theme')}
                          </Button>
                        </Card>
                      )}
                      {tab === 'preview' && result.theme && (
                        <>
                          <div className="apply-theme">
                            <Checkbox checked={applyToShell} onChange={setApplyToShell}>
                              {t('同时应用到工作台', 'Apply to workspace')}
                            </Checkbox>
                            <span>
                              {t(
                                '界面明暗模式仍由右上角控制',
                                'Use the top-right control to change interface mode',
                              )}
                            </span>
                          </div>
                          <Preview theme={result.theme} />
                        </>
                      )}
                      {tab === 'tokens' && result.theme && <Tokens theme={result.theme} />}
                      {tab === 'diagnostics' && <Diagnostics result={result} />}
                    </>
                  )}
                </div>
              </div>
            )}
            <footer className="site-footer">
              <span>OKRamp</span>
              <span>
                {t(
                  '用感知一致的颜色，连接设计与开发。',
                  'Connect design and development with perceptually consistent color.',
                )}
              </span>
              <a href="https://tdesign.tencent.com/starter/react/" target="_blank" rel="noreferrer">
                {t('TDesign Starter 布局参考', 'Layout inspired by TDesign Starter')}
              </a>
            </footer>
          </Layout.Content>
        </Layout>
        <Drawer
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label={t('关闭面板', 'Close panel')}
              icon={<CloseIcon aria-hidden="true" />}
            />
          }
          visible={mobileNav}
          header="OKRamp"
          placement="left"
          size="240px"
          footer={false}
          onClose={() => setMobileNav(false)}
        >
          {navigation}
        </Drawer>
        <Drawer
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label={t('关闭面板', 'Close panel')}
              icon={<CloseIcon aria-hidden="true" />}
            />
          }
          visible={controlsOpen}
          header={t('生成设置', 'Generation settings')}
          size="min(340px, 100vw)"
          footer={false}
          onClose={() => setControlsOpen(false)}
        >
          <Controls settings={settings} onChange={setSettings} error={generationError} />
        </Drawer>
        <Drawer
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label={t('关闭面板', 'Close panel')}
              icon={<CloseIcon aria-hidden="true" />}
            />
          }
          visible={exportOpen}
          header={t('导出主题', 'Export theme')}
          size="min(620px, 100vw)"
          onClose={() => setExportOpen(false)}
          footer={
            <Space>
              <Button onClick={() => void copyText(exportValue)} disabled={exportDisabled}>
                {t('复制代码', 'Copy code')}
              </Button>
              <Button
                theme="primary"
                icon={<DownloadIcon aria-hidden="true" />}
                onClick={download}
                disabled={exportDisabled}
              >
                {t('下载文件', 'Download')}
              </Button>
            </Space>
          }
        >
          <div className="export-options">
            <Field label={t('导出目标', 'Export target')}>
              <Radio.Group
                aria-label={t('导出目标', 'Export target')}
                theme="button"
                variant="default-filled"
                value={exportTarget}
                onChange={(v) => {
                  setExportTarget(v as ExportTarget);
                  if (v === 'antd' && exportFormat === 'css') setExportFormat('typescript');
                }}
                options={[
                  { label: t('TDesign 主题', 'TDesign theme'), value: 'tdesign' },
                  { label: 'Ant Design', value: 'antd' },
                  { label: 'shadcn/ui', value: 'shadcn' },
                  { label: t('通用颜色', 'Generic colors'), value: 'generic' },
                ]}
              />
            </Field>
            <div className="export-row">
              <Field label={t('主题范围', 'Theme modes')}>
                <Select
                  aria-label={t('主题范围', 'Theme modes')}
                  value={exportMode}
                  onChange={(v) => setExportMode(v as ExportMode)}
                  options={[
                    { label: t('浅色 + 深色', 'Light + dark'), value: 'both' },
                    { label: t('仅浅色', 'Light only'), value: 'light' },
                    { label: t('仅深色', 'Dark only'), value: 'dark' },
                  ]}
                />
              </Field>
              <Field label={t('颜色格式', 'Color format')}>
                <Select
                  aria-label={t('颜色格式', 'Color format')}
                  value={format}
                  disabled={exportTarget === 'antd' || exportTarget === 'shadcn'}
                  onChange={(v) => setFormat(v as DisplayFormat)}
                  options={['hex', 'rgb', 'oklch'].map((v) => ({
                    value: v,
                    label: v.toUpperCase(),
                  }))}
                />
              </Field>
            </div>
            <Field label={t('内容范围', 'Content')}>
              <Checkbox.Group
                aria-label={t('内容范围', 'Content')}
                disabled={exportTarget === 'antd' || exportTarget === 'shadcn'}
                value={sections}
                onChange={(values) => setSections(values.map(String))}
                options={[
                  { label: t('品牌色阶', 'Brand scale'), value: 'brand' },
                  { label: t('中性色阶', 'Neutral scale'), value: 'neutral' },
                  {
                    label: t('语义 Token', 'Semantic tokens'),
                    value: 'semantic',
                    disabled: !result.theme,
                  },
                ]}
              />
            </Field>
            {exportTarget === 'tdesign' && sections.includes('semantic') && (
              <p className="field-hint">
                {t(
                  '语义 Token 使用变量引用；自动包含依赖的基础色阶与调整色，确保导出可独立使用。',
                  'Semantic tokens use variable references. Required palettes and adjusted colors are included automatically.',
                )}
              </p>
            )}
            <Field label={t('文件格式', 'File format')}>
              <Radio.Group
                aria-label={t('文件格式', 'File format')}
                theme="button"
                variant="default-filled"
                value={exportFormat}
                onChange={(v) => setExportFormat(v as ExportFormat)}
                options={[
                  { label: 'CSS', value: 'css', disabled: exportTarget === 'antd' },
                  { label: 'JSON', value: 'json' },
                  { label: 'TypeScript', value: 'typescript' },
                ]}
              />
            </Field>
          </div>
          {!result.theme && (
            <Alert
              theme="warning"
              message={t(
                '当前仅生成原始色阶。组件库主题需要至少 10 阶品牌色。',
                'Only raw scales are available. A component-library theme requires at least 10 brand stops.',
              )}
            />
          )}
          <div className="export-code-header">
            <span>
              okramp-theme-{exportTarget}.{exportFormat === 'typescript' ? 'ts' : exportFormat}
            </span>
            <Tag size="small">
              {t('{count} 行', '{count} lines', { count: exportValue.split('\n').length })}
            </Tag>
          </div>
          <pre className="code-block export-code" tabIndex={0}>
            {exportValue}
          </pre>
          <Alert
            theme="info"
            message={
              exportTarget === 'antd'
                ? t(
                    '将 themes.light 或 themes.dark 传入 ConfigProvider 的 theme。导出包含完整映射。',
                    'Pass themes.light or themes.dark to ConfigProvider theme. Exports include the full mapping.',
                  )
                : exportTarget === 'shadcn'
                  ? t(
                      'CSS 在现有主题之后加载，以 .dark 切换深色。保留原有 destructive、chart 与 radius 配置。',
                      'Load CSS after existing theme variables and toggle .dark. Keep existing destructive, chart and radius settings.',
                    )
                  : exportTarget === 'tdesign'
                    ? t(
                        'CSS 请在 TDesign 样式之后加载。深色模式设置根元素 theme-mode="dark"；成功、警告与错误色使用官方默认值。',
                        'Load the CSS after TDesign styles. Set theme-mode="dark" on the root element for dark mode. Status colors retain TDesign defaults.',
                      )
                    : t(
                        '通用 Token 不依赖组件库，可用于自己的设计系统。',
                        'Generic tokens are framework-independent and can be used in your own design system.',
                      )
            }
          />
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
}
