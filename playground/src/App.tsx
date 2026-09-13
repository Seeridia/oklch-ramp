import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Dialog,
  Drawer,
  Empty,
  Input,
  Layout,
  Menu,
  MessagePlugin,
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
  FolderIcon,
  LayersIcon,
  MenuFoldIcon,
  MenuUnfoldIcon,
  MoonIcon,
  RefreshIcon,
  SaveIcon,
  SettingIcon,
  SunnyIcon,
} from 'tdesign-icons-react';
import { Controls, Field } from './components/Controls';
import { Scales, copyText } from './components/Scales';
import { Preview } from './components/Preview';
import { Comparison, Diagnostics, Guide, Tokens } from './components/Analysis';
import {
  DEFAULTS,
  STRATEGIES,
  generate,
  persistSchemes,
  readSchemes,
  type DisplayFormat,
  type SavedScheme,
  type Settings,
} from './model';
import { createExport, type ExportFormat, type ExportMode, type ExportTarget } from './export';
import { toTDesignTheme } from './adapters/tdesign';

const NAV = [
  { value: 'workspace', label: '色彩工作台', icon: <AppIcon /> },
  { value: 'compare', label: '策略对比', icon: <ChartBarIcon /> },
  { value: 'guide', label: '使用指南', icon: <BookOpenIcon /> },
];
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
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
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
  const [page, setPage] = useState('workspace');
  const [tab, setTab] = useState('scale');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [format, setFormat] = useState<DisplayFormat>('hex');
  const [uiMode, setUiMode] = useState(initialMode);
  const [applyToShell, setApplyToShell] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTarget>('tdesign');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [exportMode, setExportMode] = useState<ExportMode>('both');
  const [sections, setSections] = useState(['brand', 'neutral', 'semantic']);
  const [schemes, setSchemes] = useState(readSchemes);
  const [schemeName, setSchemeName] = useState('未命名方案');
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  useEffect(() => {
    document.documentElement.setAttribute('theme-mode', uiMode);
    try {
      localStorage.setItem('okramp-ui-mode', uiMode);
    } catch {
      /* persistence is optional */
    }
  }, [uiMode]);
  useEffect(() => {
    const values =
      applyToShell && result.theme?.themes[uiMode]
        ? toTDesignTheme(result.theme.themes[uiMode]!, result.theme.scales.neutral)
        : {};
    for (const [key, value] of Object.entries(values))
      document.documentElement.style.setProperty(key, value);
    return () => {
      for (const key of Object.keys(values)) document.documentElement.style.removeProperty(key);
    };
  }, [applyToShell, result.theme, uiMode]);
  const messages = result.theme?.diagnostics.messages ?? result.scale.diagnostics.messages;
  const warningCount = messages.filter((m) => m.severity !== 'info').length;
  const checks = result.theme?.diagnostics.contrastChecks ?? [];
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
    setMobileNav(false);
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
  function saveScheme() {
    if (!nameDraft.trim() || attempt.error) return;
    const scheme: SavedScheme = {
      id: crypto.randomUUID(),
      name: nameDraft.trim(),
      settings: { ...settings },
      savedAt: new Date().toISOString(),
    };
    const next = [scheme, ...schemes].slice(0, 50);
    try {
      persistSchemes(next);
      setSchemes(next);
      setSchemeName(scheme.name);
      setSaveOpen(false);
      void MessagePlugin.success('方案已保存在当前浏览器');
    } catch {
      void MessagePlugin.error('本地存储不可用，方案未保存。请导出 JSON 备份。');
    }
  }
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
            href="#"
            onClick={(e) => {
              e.preventDefault();
              changePage('workspace');
            }}
            aria-label="OKRamp 首页"
          >
            <span className="brand-icon">
              <LayersIcon />
            </span>
            {!collapsed && (
              <span>
                OKRamp<small>OKLCH 色彩主题工作台</small>
              </span>
            )}
          </a>
          <div className="nav-caption">{collapsed ? '·' : '设计工具'}</div>
          {navigation}
          <div className="sidebar-bottom">
            {!collapsed && (
              <div className="sidebar-note">
                <span className="status-dot" /> 本地运行 · 无需上传颜色
                <br />
                <small>Powered by TDesign React</small>
              </div>
            )}
            <Button
              variant="text"
              shape="square"
              aria-label={collapsed ? '展开导航' : '折叠导航'}
              icon={collapsed ? <MenuUnfoldIcon /> : <MenuFoldIcon />}
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
                icon={<MenuUnfoldIcon />}
                onClick={() => setMobileNav(true)}
              />
              <Breadcrumb
                options={[
                  { content: '设计工具' },
                  { content: NAV.find((n) => n.value === page)?.label },
                ]}
              />
            </div>
            <Space size={12}>
              <Tag variant="light" className="header-version">
                OKLCH ENGINE
              </Tag>
              <Tooltip content="查看源码">
                <Button
                  aria-label="查看源码"
                  variant="text"
                  shape="square"
                  icon={<CodeIcon />}
                  href="https://github.com/Seeridia/oklch-ramp"
                  target="_blank"
                />
              </Tooltip>
              <Tooltip content={uiMode === 'light' ? '切换深色界面' : '切换浅色界面'}>
                <Button
                  aria-label={uiMode === 'light' ? '切换深色界面' : '切换浅色界面'}
                  variant="text"
                  shape="square"
                  icon={uiMode === 'light' ? <MoonIcon /> : <SunnyIcon />}
                  onClick={() => setUiMode(uiMode === 'light' ? 'dark' : 'light')}
                />
              </Tooltip>
            </Space>
          </Layout.Header>
          <Layout.Content className="app-content" id="main-content">
            <div className="page-heading">
              <div>
                <h1>{NAV.find((n) => n.value === page)?.label}</h1>
                <p>
                  {page === 'workspace'
                    ? '从一个主色，构建协调、可用的色彩主题。'
                    : page === 'compare'
                      ? '相同的起点，不同的色彩表达。'
                      : '了解色彩策略，把设计带入代码。'}
                </p>
              </div>
              {page !== 'guide' && (
                <Space breakLine size={8} className="page-actions">
                  <Button
                    theme="default"
                    variant="outline"
                    icon={<FolderIcon />}
                    onClick={() => setSavedOpen(true)}
                  >
                    我的方案
                  </Button>
                  <Button
                    theme="default"
                    variant="outline"
                    icon={<SaveIcon />}
                    disabled={Boolean(attempt.error)}
                    onClick={() => {
                      setNameDraft(
                        schemeName === '未命名方案' ? `主题 ${result.settings.seed}` : schemeName,
                      );
                      setSaveOpen(true);
                    }}
                  >
                    保存
                  </Button>
                  <Button
                    theme="primary"
                    icon={<DownloadIcon />}
                    disabled={Boolean(attempt.error)}
                    onClick={() => setExportOpen(true)}
                  >
                    导出主题
                  </Button>
                </Space>
              )}
            </div>
            {page !== 'guide' && (
              <div className="context-bar">
                <div>
                  <span
                    className="context-swatch"
                    style={{ background: result.scale.seed.normalized }}
                  />
                  <strong>{schemeName}</strong>
                  <code>{result.scale.seed.normalized.toUpperCase()}</code>
                  <span className="context-divider" />
                  <span>{STRATEGIES.find((s) => s.value === result.settings.strategy)?.label}</span>
                </div>
                <Space size={12}>
                  <Button
                    className={page === 'compare' ? 'compare-settings' : 'mobile-settings'}
                    size="small"
                    variant="text"
                    icon={<SettingIcon />}
                    onClick={() => setControlsOpen(true)}
                  >
                    参数
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    icon={<RefreshIcon />}
                    onClick={() => {
                      setSettings({ ...DEFAULTS });
                      setSchemeName('未命名方案');
                      setApplyToShell(false);
                    }}
                  >
                    恢复默认
                  </Button>
                </Space>
              </div>
            )}
            {attempt.error && page !== 'guide' && (
              <Alert
                className="generation-error"
                theme="error"
                title="当前配置生成失败，正在展示上次有效结果"
                message={`${attempt.error} 请修改参数后重试；保存和导出已暂停。`}
              />
            )}
            {page === 'guide' ? (
              <Guide />
            ) : (
              <div className={`workspace-grid ${page === 'compare' ? 'compare-workspace' : ''}`}>
                <Card className="control-card" bordered={false}>
                  <Controls settings={settings} onChange={setSettings} error={attempt.error} />
                </Card>
                <div className="result-area">
                  {page === 'compare' ? (
                    <Comparison
                      result={result}
                      onApply={(strategy) => {
                        setSettings({ ...settings, strategy });
                        setPage('workspace');
                        setTab('scale');
                      }}
                    />
                  ) : (
                    <>
                      <div className="result-tabs">
                        <Tabs value={tab} onChange={(value) => setTab(String(value))}>
                          <Tabs.TabPanel
                            value="scale"
                            label={
                              <span className="tab-label">
                                <LayersIcon />
                                色阶
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="preview"
                            label={
                              <span className="tab-label">
                                <AppIcon />
                                组件预览
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="tokens"
                            label={
                              <span className="tab-label">
                                <CodeIcon />
                                Token
                              </span>
                            }
                          />
                          <Tabs.TabPanel
                            value="diagnostics"
                            label={
                              <span className="tab-label">
                                <CheckCircleIcon />
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
                      <div className="result-footer">
                        <span>
                          <CheckCircleIcon /> sRGB 色域映射
                        </span>
                        <span>
                          {checks.length
                            ? `${checks.filter((c) => c.passes).length}/${checks.length} 个对比度检查通过`
                            : '色阶模式'}
                        </span>
                        <span>浏览器本地计算</span>
                      </div>
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
              icon={<CloseIcon />}
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
              icon={<CloseIcon />}
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
        <Dialog
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label="关闭对话框"
              icon={<CloseIcon />}
            />
          }
          visible={saveOpen}
          header="保存方案"
          placement="center"
          width="min(440px, calc(100vw - 32px))"
          confirmBtn={{ content: '保存到浏览器', disabled: !nameDraft.trim() }}
          onConfirm={saveScheme}
          onClose={() => setSaveOpen(false)}
        >
          <Field label="方案名称">
            <Input
              value={nameDraft}
              aria-label="方案名称"
              onChange={setNameDraft}
              maxlength={40}
              placeholder="为这套主题起个名字"
            />
          </Field>
          <p className="field-hint">仅保存在当前浏览器，最多保留最近 50 个方案。</p>
        </Dialog>
        <Drawer
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label="关闭面板"
              icon={<CloseIcon />}
            />
          }
          visible={savedOpen}
          header={`我的方案 · ${schemes.length}`}
          footer={false}
          size="min(420px, 100vw)"
          onClose={() => setSavedOpen(false)}
        >
          {schemes.length ? (
            <div className="saved-schemes">
              {schemes.map((s) => (
                <Card key={s.id} size="small">
                  <div className="saved-scheme">
                    <span className="saved-swatch" style={{ background: s.settings.seed }} />
                    <div>
                      <strong>{s.name}</strong>
                      <p>
                        {s.settings.seed} · {new Date(s.savedAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Button
                      size="small"
                      theme="primary"
                      variant="text"
                      onClick={() => {
                        setSettings(s.settings);
                        setSchemeName(s.name);
                        setSavedOpen(false);
                        setPage('workspace');
                      }}
                    >
                      载入
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="还没有保存方案。调整主色后，点击「保存」。" />
          )}
        </Drawer>
        <Drawer
          closeBtn={
            <Button
              theme="default"
              variant="text"
              shape="square"
              aria-label="关闭面板"
              icon={<CloseIcon />}
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
                icon={<DownloadIcon />}
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
