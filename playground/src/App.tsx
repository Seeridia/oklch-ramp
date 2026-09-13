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

const NAV = [
  { value: 'workspace', label: '色彩工作台', icon: <AppIcon aria-hidden="true" /> },
  { value: 'compare', label: '方案对比', icon: <ChartBarIcon aria-hidden="true" /> },
  { value: 'guide', label: '使用指南', icon: <BookOpenIcon aria-hidden="true" /> },
];
const PAGES = new Set(NAV.map((item) => item.value));
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
      document.title = `${NAV.find((item) => item.value === page)?.label ?? '色彩工作台'} · OKRamp`;
  }, [page]);
  const messages = result.theme?.diagnostics.messages ?? result.scale.diagnostics.messages;
  const warningCount = messages.filter((m) => m.severity !== 'info').length;
  const exportDisabled =
    Boolean(attempt.error) ||
    sections.length === 0 ||
    (exportTarget === 'tdesign' && !result.theme) ||
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
    <ConfigProvider globalConfig={{}}>
      <a className="skip-link" href="#main-content">
        跳到主要内容
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
            aria-label="OKRamp 首页"
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
              aria-label={collapsed ? '展开导航' : '折叠导航'}
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
                aria-label="打开导航"
                icon={<MenuUnfoldIcon aria-hidden="true" />}
                onClick={() => setMobileNav(true)}
              />
              <Breadcrumb
                options={[
                  { content: '设计工具' },
                  { content: NAV.find((n) => n.value === page)?.label },
                ]}
              />
            </div>
            <Space size={12} align="center" className="header-actions">
              <Tag variant="light" className="header-version">
                OKRAMP
              </Tag>
              <Tooltip content="查看源码">
                <Button
                  aria-label="查看源码"
                  variant="text"
                  shape="square"
                  icon={<LogoGithubIcon aria-hidden="true" />}
                  href="https://github.com/Seeridia/oklch-ramp"
                  target="_blank"
                />
              </Tooltip>
              <Tooltip content={uiMode === 'light' ? '切换深色界面' : '切换浅色界面'}>
                <Button
                  aria-label={uiMode === 'light' ? '切换深色界面' : '切换浅色界面'}
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
                      ? '从一个主色，构建协调、可用的色彩主题。'
                      : page === 'compare'
                        ? '相同的主色，对比不同颜色空间的生成效果。'
                        : '了解色彩策略，把设计带入代码。'}
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
                        参数
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
                      恢复默认
                    </Button>
                    {page === 'workspace' && (
                      <Button
                        theme="primary"
                        icon={<DownloadIcon aria-hidden="true" />}
                        disabled={Boolean(attempt.error)}
                        onClick={() => setExportOpen(true)}
                      >
                        导出主题
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
                title="当前配置生成失败，正在展示上次有效结果"
                message={`${attempt.error} 请修改参数后重试；导出已暂停。`}
              />
            )}
            {page === 'guide' ? (
              <Guide />
            ) : (
              <div className={`workspace-grid ${page === 'compare' ? 'compare-workspace' : ''}`}>
                {page === 'workspace' && (
                  <Card className="control-card" bordered={false}>
                    <Controls settings={settings} onChange={setSettings} error={attempt.error} />
                  </Card>
                )}
                <div className="result-area">
                  {page === 'compare' ? (
                    <>
                      {comparisonAttempt.error && (
                        <Alert
                          theme="error"
                          message={`${comparisonAttempt.error} 正在展示上次有效结果。`}
                        />
                      )}
                      <Comparison
                        result={comparisonAttempt.result ?? lastComparison}
                        settings={comparisonSettings}
                        onChange={setComparisonSettings}
                        error={comparisonAttempt.error}
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
                                色阶
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="preview"
                            label={
                              <span className="tab-label">
                                <AppIcon aria-hidden="true" />
                                组件预览
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
                                诊断{warningCount > 0 && <Badge count={warningCount} />}
                              </span>
                            }
                          />
                        </Tabs>
                        <span className="live-indicator">
                          <span className="status-dot" />
                          实时生成
                        </span>
                      </div>
                      {tab === 'scale' && (
                        <Scales result={result} format={format} onFormat={setFormat} />
                      )}
                      {(tab === 'preview' || tab === 'tokens') && !result.theme && (
                        <Card bordered={false}>
                          <Empty description="主题需要至少 10 阶品牌色" />
                          <Button
                            theme="primary"
                            onClick={() => setSettings({ ...settings, steps: 10 })}
                          >
                            切换为 10 阶并生成主题
                          </Button>
                        </Card>
                      )}
                      {tab === 'preview' && result.theme && (
                        <>
                          <div className="apply-theme">
                            <Checkbox checked={applyToShell} onChange={setApplyToShell}>
                              同时应用到工作台
                            </Checkbox>
                            <span>界面明暗模式仍由右上角控制</span>
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
              <span>用感知一致的颜色，连接设计与开发。</span>
              <a href="https://tdesign.tencent.com/starter/react/" target="_blank" rel="noreferrer">
                TDesign Starter 布局参考
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
              aria-label="关闭面板"
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
              aria-label="关闭面板"
              icon={<CloseIcon aria-hidden="true" />}
            />
          }
          visible={controlsOpen}
          header="生成设置"
          size="min(340px, 100vw)"
          footer={false}
          onClose={() => setControlsOpen(false)}
        >
          <Controls settings={settings} onChange={setSettings} error={attempt.error} />
        </Drawer>
        <Drawer
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label="关闭面板"
              icon={<CloseIcon aria-hidden="true" />}
            />
          }
          visible={exportOpen}
          header="导出主题"
          size="min(620px, 100vw)"
          onClose={() => setExportOpen(false)}
          footer={
            <Space>
              <Button onClick={() => void copyText(exportValue)} disabled={exportDisabled}>
                复制代码
              </Button>
              <Button
                theme="primary"
                icon={<DownloadIcon aria-hidden="true" />}
                onClick={download}
                disabled={exportDisabled}
              >
                下载文件
              </Button>
            </Space>
          }
        >
          <div className="export-options">
            <Field label="导出目标">
              <Radio.Group
                aria-label="导出目标"
                theme="button"
                variant="default-filled"
                value={exportTarget}
                onChange={(v) => setExportTarget(v as ExportTarget)}
                options={[
                  { label: 'TDesign 主题', value: 'tdesign' },
                  { label: '通用颜色', value: 'generic' },
                ]}
              />
            </Field>
            <div className="export-row">
              <Field label="主题范围">
                <Select
                  aria-label="主题范围"
                  value={exportMode}
                  onChange={(v) => setExportMode(v as ExportMode)}
                  options={[
                    { label: '浅色 + 深色', value: 'both' },
                    { label: '仅浅色', value: 'light' },
                    { label: '仅深色', value: 'dark' },
                  ]}
                />
              </Field>
              <Field label="颜色格式">
                <Select
                  aria-label="颜色格式"
                  value={format}
                  onChange={(v) => setFormat(v as DisplayFormat)}
                  options={['hex', 'rgb', 'oklch'].map((v) => ({
                    value: v,
                    label: v.toUpperCase(),
                  }))}
                />
              </Field>
            </div>
            <Field label="内容范围">
              <Checkbox.Group
                aria-label="内容范围"
                value={sections}
                onChange={(values) => setSections(values.map(String))}
                options={[
                  { label: '品牌色阶', value: 'brand' },
                  { label: '中性色阶', value: 'neutral' },
                  { label: '语义 Token', value: 'semantic', disabled: !result.theme },
                ]}
              />
            </Field>
            {exportTarget === 'tdesign' && sections.includes('semantic') && (
              <p className="field-hint">
                语义 Token 使用变量引用；自动包含依赖的基础色阶与调整色，确保导出可独立使用。
              </p>
            )}
            <Field label="文件格式">
              <Radio.Group
                aria-label="文件格式"
                theme="button"
                variant="default-filled"
                value={exportFormat}
                onChange={(v) => setExportFormat(v as ExportFormat)}
                options={[
                  { label: 'CSS', value: 'css' },
                  { label: 'JSON', value: 'json' },
                  { label: 'TypeScript', value: 'typescript' },
                ]}
              />
            </Field>
          </div>
          {!result.theme && (
            <Alert
              theme="warning"
              message="当前仅生成原始色阶。TDesign 主题需要至少 10 阶品牌色。"
            />
          )}
          <div className="export-code-header">
            <span>
              okramp-theme-{exportTarget}.{exportFormat === 'typescript' ? 'ts' : exportFormat}
            </span>
            <Tag size="small">{exportValue.split('\n').length} 行</Tag>
          </div>
          <pre className="code-block export-code" tabIndex={0}>
            {exportValue}
          </pre>
          <Alert
            theme="info"
            message={
              exportTarget === 'tdesign'
                ? 'CSS 请在 TDesign 样式之后加载。深色模式设置根元素 theme-mode="dark"；成功、警告与错误色使用官方默认值。'
                : '通用 Token 不依赖组件库，可用于自己的设计系统。'
            }
          />
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
}
