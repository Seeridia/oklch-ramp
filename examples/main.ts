import {
  generateColorScale,
  generateColorTheme,
  generateNeutralScale,
  type ColorScaleResult,
  type ScaleStrategy,
  type SemanticTheme,
} from '../src/index.js';

const app = document.querySelector<HTMLElement>('#app');
if (app === null) throw new Error('Missing #app element');
const root = app;

const presets = ['#0052D9', '#E34D59', '#00A870', '#ED7B2F', '#8B5CF6', '#F2C94C'];
const strategies: ScaleStrategy[] = ['tonal', 'adaptive-anchor', 'fixed-anchor'];

function swatches(title: string, result: ColorScaleResult): string {
  const items = result.stops
    .map(
      (stop) => `
        <li class="swatch" style="--swatch:${stop.color}">
          <span class="chip"></span>
          <span class="index">${stop.label}</span>
          <code>${stop.color}</code>
        </li>`,
    )
    .join('');

  return `
    <section class="scale-panel">
      <div class="section-heading">
        <h2>${title}</h2>
        <span>${result.anchorIndex === null ? `推荐第 ${result.recommendedIndex + 1} 阶` : `锚点第 ${result.anchorIndex + 1} 阶`}</span>
      </div>
      <ol class="swatches">${items}</ol>
    </section>`;
}

function themeCard(theme: SemanticTheme): string {
  const colors = theme.color;
  return `
    <article class="theme-card" style="--page:${colors.background.page};--container:${colors.background.container};--text:${colors.text.primary};--muted:${colors.text.secondary};--border:${colors.border.default};--brand:${colors.brand.default};--on-brand:${colors.brand.onBrand};--subtle:${colors.brand.subtle};--link:${colors.text.link}">
      <header>
        <div>
          <span class="eyebrow">${theme.mode} mode</span>
          <h3>语义主题预览</h3>
        </div>
        <span class="status">Ready</span>
      </header>
      <p>文字、容器、边框和交互颜色来自同一套品牌与中性色阶。</p>
      <div class="theme-actions">
        <button class="primary">主要操作</button>
        <button class="secondary">次要操作</button>
        <a href="#preview">文字链接</a>
      </div>
    </article>`;
}

function render(seed: string): void {
  try {
    const scaleSections = strategies
      .map((strategy) =>
        swatches(
          strategy,
          generateColorScale(seed, {
            strategy,
            ...(strategy === 'fixed-anchor' ? { anchorIndex: 5 } : {}),
          }),
        ),
      )
      .join('');
    const neutral = generateNeutralScale(seed);
    const theme = generateColorTheme(seed, { contrastPolicy: 'adjust' });
    const warnings = theme.diagnostics.messages
      .filter((message) => message.severity !== 'info')
      .map((message) => `<li><code>${message.code}</code> ${message.message}</li>`)
      .join('');

    root.innerHTML = `
      <header class="hero">
        <div>
          <p class="kicker">OKLCH · sRGB · TypeScript</p>
          <h1>Color Scale Engine</h1>
          <p>比较三种色阶策略，并检查品牌关联中性色和明暗主题。</p>
        </div>
        <div class="controls">
          <label>种子色 <input id="seed" type="color" value="${theme.seed.normalized}" /></label>
          <div class="presets">
            ${presets.map((color) => `<button type="button" data-color="${color}" style="--preset:${color}" aria-label="使用 ${color}"></button>`).join('')}
          </div>
        </div>
      </header>
      <div class="content">
        ${scaleSections}
        ${swatches('tinted neutral · 14', neutral)}
        <section class="theme-section" id="preview">
          <div class="section-heading"><h2>light / dark themes</h2><span>contrast: adjust</span></div>
          <div class="theme-grid">
            ${theme.themes.light === undefined ? '' : themeCard(theme.themes.light)}
            ${theme.themes.dark === undefined ? '' : themeCard(theme.themes.dark)}
          </div>
        </section>
        <section class="diagnostics">
          <h2>诊断</h2>
          ${warnings.length === 0 ? '<p>没有警告。</p>' : `<ul>${warnings}</ul>`}
        </section>
      </div>`;

    document.querySelector<HTMLInputElement>('#seed')?.addEventListener('input', (event) => {
      render((event.currentTarget as HTMLInputElement).value);
    });
    document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((button) => {
      button.addEventListener('click', () => render(button.dataset.color ?? seed));
    });
  } catch (error) {
    root.textContent = error instanceof Error ? error.message : String(error);
  }
}

render('#0052D9');
