import { useRef, useState, type CSSProperties } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Dialog,
  Input,
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
import type { ColorThemeResult, SemanticTheme } from 'oklch-ramp';
import { toTDesignTheme } from '../adapters/tdesign';
import { Field } from './Controls';
interface Project {
  id: string;
  name: string;
  status: string;
  owner: string;
}
const PROJECTS: Project[] = [
  { id: '1', name: '品牌设计系统', status: '进行中', owner: '林晓' },
  { id: '2', name: '移动端体验升级', status: '已完成', owner: '陈墨' },
  { id: '3', name: '工作台 2.0', status: '进行中', owner: '周宁' },
  { id: '4', name: '产品官网', status: '待开始', owner: '林晓' },
  { id: '5', name: '开放平台', status: '进行中', owner: '陈墨' },
  { id: '6', name: '主题规范', status: '已完成', owner: '周宁' },
];
function PreviewCanvas({
  theme,
  scene,
  neutral,
}: {
  theme: SemanticTheme;
  scene: string;
  neutral: ColorThemeResult['scales']['neutral'];
}) {
  const host = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [radio, setRadio] = useState('a');
  const [slider, setSlider] = useState(62);
  const [sampleTab, setSampleTab] = useState('overview');
  const [input, setInput] = useState('品牌设计系统');
  const [choice, setChoice] = useState('design');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState(PROJECTS);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const filtered = projects.filter(
    (p) => p.name.includes(search) && (status === 'all' || p.status === status),
  );
  return (
    <div className="preview-frame">
      <div className="preview-frame-label">
        {theme.mode === 'light' ? <SunnyIcon /> : <MoonIcon />}{' '}
        {theme.mode === 'light' ? '浅色主题' : '深色主题'}
        <span>LIVE PREVIEW</span>
      </div>
      <div
        ref={host}
        className="td-theme-scope preview-canvas"
        data-mode={theme.mode}
        style={toTDesignTheme(theme, neutral) as CSSProperties}
      >
        <ConfigProvider globalConfig={{ attach: () => host.current! }}>
          <div className="preview-brand">
            <LayersIcon />
            <strong>Design Workspace</strong>
            <Tag size="small" theme="primary" variant="light">
              团队版
            </Tag>
          </div>
          {scene === 'components' ? (
            <div className="component-gallery">
              <section>
                <h4>
                  按钮 <span>Button</span>
                </h4>
                <Space breakLine>
                  <Button
                    theme="primary"
                    onClick={() => {
                      setEditing({ id: '', name: '', status: '进行中', owner: '我' });
                      setName('');
                    }}
                  >
                    主要按钮
                  </Button>
                  <Button variant="outline">次要按钮</Button>
                  <Button theme="primary" variant="text">
                    文字按钮
                  </Button>
                  <Button theme="primary" disabled>
                    禁用
                  </Button>
                </Space>
                <p className="field-hint">可悬停、按下与键盘聚焦，观察真实交互状态。</p>
              </section>
              <section>
                <h4>
                  表单 <span>Form</span>
                </h4>
                <div className="preview-form">
                  <Input
                    aria-label={`${theme.mode} 示例名称`}
                    value={input}
                    onChange={setInput}
                    placeholder="请输入名称"
                  />
                  <Select
                    aria-label={`${theme.mode} 示例分类`}
                    value={choice}
                    onChange={(v) => setChoice(typeof v === 'string' ? v : 'design')}
                    options={[
                      { label: '设计系统', value: 'design' },
                      { label: '产品体验', value: 'product' },
                    ]}
                  />
                  <Input placeholder="禁用状态" disabled />
                  <Input placeholder="请完善名称" status="error" />
                </div>
              </section>
              <section>
                <h4>
                  选择与控制 <span>Selection</span>
                </h4>
                <Space breakLine size={24}>
                  <Checkbox checked={checked} onChange={setChecked}>
                    自动同步
                  </Checkbox>
                  <Radio.Group
                    value={radio}
                    onChange={(v) => setRadio(String(v))}
                    options={[
                      { label: '默认', value: 'a' },
                      { label: '自定义', value: 'b' },
                    ]}
                  />
                  <Switch
                    value={enabled}
                    onChange={(v) => setEnabled(Boolean(v))}
                    aria-label={`${theme.mode} 启用主题`}
                  />
                </Space>
                <Slider value={slider} onChange={(v) => setSlider(Number(v))} />
              </section>
              <section>
                <h4>
                  导航与状态 <span>Feedback</span>
                </h4>
                <Tabs value={sampleTab} onChange={(v) => setSampleTab(String(v))}>
                  <Tabs.TabPanel value="overview" label="概览">
                    <p className="sample-tab-copy">查看当前主题的整体表现。</p>
                  </Tabs.TabPanel>
                  <Tabs.TabPanel value="members" label="成员">
                    <p className="sample-tab-copy">3 位成员正在参与设计协作。</p>
                  </Tabs.TabPanel>
                </Tabs>
                <Space breakLine>
                  <Tag theme="primary" variant="light">
                    品牌标签
                  </Tag>
                  <Tag theme="success" variant="light">
                    已完成
                  </Tag>
                  <Tag theme="warning" variant="light">
                    待处理
                  </Tag>
                  <Tag theme="danger" variant="light">
                    需关注
                  </Tag>
                </Space>
                <Alert theme="info" message="主题已就绪，开始构建你的下一款产品。" />
              </section>
            </div>
          ) : (
            <div className="business-scene">
              <div className="section-heading">
                <div>
                  <h3>项目列表</h3>
                  <p>让每一个好想法，有序发生。</p>
                </div>
                <Button
                  theme="primary"
                  icon={<AddIcon />}
                  onClick={() => {
                    setEditing({ id: '', name: '', status: '进行中', owner: '我' });
                    setName('');
                  }}
                >
                  新建项目
                </Button>
              </div>
              <div className="business-filter">
                <Input
                  aria-label={`${theme.mode} 搜索项目`}
                  prefixIcon={<SearchIcon />}
                  placeholder="搜索项目名称"
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                />
                <Select
                  aria-label={`${theme.mode} 项目状态`}
                  value={status}
                  onChange={(v) => {
                    setStatus(typeof v === 'string' ? v : 'all');
                    setPage(1);
                  }}
                  options={['all', '进行中', '已完成', '待开始'].map((v) => ({
                    value: v,
                    label: v === 'all' ? '全部状态' : v,
                  }))}
                />
              </div>
              <Table
                rowKey="id"
                data={filtered.slice((page - 1) * 4, page * 4)}
                columns={[
                  { colKey: 'name', title: '项目名称', ellipsis: true },
                  {
                    colKey: 'status',
                    title: '状态',
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
                        {row.status}
                      </Tag>
                    ),
                  },
                  {
                    colKey: 'operation',
                    title: '操作',
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
                        编辑
                      </Button>
                    ),
                  },
                ]}
              />
              <Pagination
                size="small"
                total={filtered.length}
                current={page}
                pageSize={4}
                showPageSize={false}
                showJumper={false}
                onCurrentChange={setPage}
              />
            </div>
          )}
          <Dialog
            closeBtn={
              <Button
                theme="default"
                variant="text"
                shape="square"
                aria-label="关闭项目对话框"
                icon={<CloseIcon />}
              />
            }
            visible={editing !== null}
            header={editing?.id ? '编辑项目' : '新建项目'}
            width="min(420px, calc(100vw - 32px))"
            placement="center"
            confirmBtn={{ content: '保存项目', disabled: !name.trim() }}
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
            <Field label="项目名称">
              <Input
                aria-label="项目名称"
                value={name}
                onChange={setName}
                placeholder="输入项目名称"
                maxlength={40}
              />
            </Field>
            <p className="field-hint">这是可交互的演示数据，仅在当前预览中生效。</p>
          </Dialog>
        </ConfigProvider>
      </div>
    </div>
  );
}
export function Preview({ theme }: { theme: ColorThemeResult }) {
  const [mode, setMode] = useState('both');
  const [scene, setScene] = useState('components');
  return (
    <div className="stack">
      <Card bordered={false} className="preview-toolbar">
        <div className="section-heading">
          <div>
            <h3>真实组件，实时主题</h3>
            <p>基于 TDesign React · 状态色沿用官方默认值</p>
          </div>
          <div className="preview-switches">
            <Radio.Group
              size="medium"
              theme="button"
              variant="default-filled"
              value={scene}
              onChange={(v) => setScene(String(v))}
              options={[
                { label: '组件状态', value: 'components' },
                { label: '业务场景', value: 'business' },
              ]}
            />
            <Radio.Group
              size="medium"
              theme="button"
              variant="default-filled"
              value={mode}
              onChange={(v) => setMode(String(v))}
              options={[
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
                { label: '并排', value: 'both' },
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
