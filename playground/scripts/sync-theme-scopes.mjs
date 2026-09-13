import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const css = readFileSync(require.resolve('tdesign-react/dist/tdesign.css'), 'utf8');
const blocks = ['light', 'dark'].map((mode) => {
  const match = css.match(new RegExp(":root\\[theme-mode='" + mode + "'\\] \\{([^}]+)\\}"));
  if (!match) throw new Error(`Missing TDesign ${mode} theme`);
  return `.td-theme-scope[data-mode="${mode}"] {${match[1]}}`;
});
writeFileSync(
  new URL('../src/theme-scopes.css', import.meta.url),
  '/* Generated from TDesign 1.18.3 (MIT). Run node scripts/sync-theme-scopes.mjs after upgrades. */\n' +
    blocks.join('\n'),
);
