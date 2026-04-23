/**
 * build-docs.mjs
 *
 * Generates a fully self-contained docs/index.html by:
 *   1. Reading scripts/docs-template.html
 *   2. Inlining color token CSS
 *   3. Parsing token data from dist/colors.css
 *   4. Writing docs/index.html — no external assets needed
 *
 * Run after `npm run build`:
 *   npm run build && npm run build:docs
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const docsDir = join(root, 'docs');

mkdirSync(docsDir, { recursive: true });

// ── Read dist CSS files ─────────────────────────────────────────────────────

const colorsCss = readFileSync(join(distDir, 'colors.css'), 'utf8');

// ── Inline token CSS (for live CSS variable resolution in browser) ──────────

const TOKEN_CSS = colorsCss;

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseVars(css) {
  const lightSection = css.split(':root[data-theme')[0];
  const result = [];
  for (const [, name, value] of lightSection.matchAll(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*;/gm)) {
    result.push({ name, value: value.trim().replace(/\s+/g, ' ') });
  }
  return result;
}

// ── Color tokens ─────────────────────────────────────────────────────────────

function getColorGroup(name) {
  if (name.startsWith('--color-reference-')) return 'reference';
  if (name.startsWith('--color-data-'))      return 'data';
  return 'semantic';
}

function getColorCategory(name) {
  if (name.startsWith('--color-divider-')) return 'divider';
  if (name.startsWith('--color-driver-status-background-')) return 'driver-status-background';

  if (name.startsWith('--color-data-')) {
    const rest = name.slice('--color-data-'.length);
    if (rest.startsWith('category-'))  return 'data-category';
    if (rest.startsWith('diverging-')) return rest.replace(/-\d+-\d+$/, '').replace(/^/, 'data-');
    if (rest.startsWith('sequence-'))  return rest.replace(/-\d+-\d+$/, '').replace(/^/, 'data-');
    if (rest.startsWith('win-loss-'))  return 'data-win-loss';
    if (rest.startsWith('misc-'))      return 'data-misc';
  }

  const parts = name.replace(/^--color-/, '').split('-');
  const scalePattern = /^(\d+|l\d+|c\d+|faint|medium|bold|strong|dark|light)$/;
  while (parts.length > 2 && scalePattern.test(parts[parts.length - 1])) {
    parts.pop();
  }
  if (parts[0] === 'reference' && (parts[1] === 'dark' || parts[1] === 'light')) {
    parts.splice(1, 1);
  }
  const top = parts[0];
  if (top !== 'reference' && parts.length > 1) {
    parts.pop();
  }
  return parts.join('-');
}

function getDataSubgroup(name) {
  const m = name.match(/^--color-data-(?:diverging-[a-z-]+?|sequence-[a-z-]+?)-(\d+)-\d+$/);
  return m ? m[1] : null;
}

function getColorShade(name) {
  const parts = name.replace(/^--color-/, '').split('-');
  if (parts[0] !== 'reference') return null;
  if (parts[1] === 'dark' || parts[1] === 'light') return parts[1];
  return null;
}

function getColorHueKey(name) {
  if (name.startsWith('--color-reference-black')) return -1000;
  if (name.startsWith('--color-reference-white')) return -900;
  if (name.startsWith('--color-reference-grey'))  return -800;
  const m = name.match(/^--color-reference-(?:dark|light)-[a-z]+-(\d{2,3})-/);
  if (m) return -parseInt(m[1], 10);
  return Infinity;
}

function getShadeOrder(name) {
  if (/^--color-reference-dark-/.test(name))  return 0;
  if (/^--color-reference-light-/.test(name)) return 1;
  return 0;
}

function getVariantOrder(name) {
  if (/^--color-reference-grey/.test(name)) {
    const m = name.match(/-l(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  if (/-faint$/.test(name))  return 0;
  if (/-medium$/.test(name)) return 1;
  if (/-bold$/.test(name))   return 2;
  if (/-strong$/.test(name)) return 3;
  const m = name.match(/-l(\d+)/);
  return m ? 100 + parseInt(m[1], 10) : 999;
}

function getAlphaPercent(name) {
  const m = name.match(/^--color-reference-(?:black|white)-(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

const rawColors = parseVars(colorsCss).map(({ name }) => ({
  name,
  group: getColorGroup(name),
  category: getColorCategory(name),
  shade: getColorShade(name),
  subgroup: getDataSubgroup(name),
  label: name.slice(2),
  _hue: getColorHueKey(name),
  _shade: getShadeOrder(name),
  _variant: getVariantOrder(name),
  _alpha: getAlphaPercent(name),
}));

const referenceTokens = rawColors
  .filter(t => t.group === 'reference')
  .sort((a, b) =>
    (a._hue - b._hue)
    || (a._alpha - b._alpha)
    || (a._shade - b._shade)
    || (a._variant - b._variant)
  );

const semanticCategoryFirstSeen = new Map();
rawColors.forEach((t, i) => {
  if (t.group === 'semantic' && !semanticCategoryFirstSeen.has(t.category)) {
    semanticCategoryFirstSeen.set(t.category, i);
  }
});
for (const prefix of ['foreground', 'background']) {
  const order = [`${prefix}-strong`, `${prefix}-bold`, `${prefix}-medium`, `${prefix}-faint`];
  const anchor = Math.min(
    ...order.map(cat => semanticCategoryFirstSeen.get(cat)).filter(v => v != null)
  );
  if (Number.isFinite(anchor)) {
    order.forEach((cat, i) => {
      if (semanticCategoryFirstSeen.has(cat)) {
        semanticCategoryFirstSeen.set(cat, anchor + i * 0.001);
      }
    });
  }
}
const RANK_QUALIFIERS = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3 };
function semanticRankWithinCategory(name) {
  const last = name.split('-').pop();
  return RANK_QUALIFIERS[last] ?? 99;
}
const semanticTokens = rawColors
  .map((t, i) => ({ t, i }))
  .filter(({ t }) => t.group === 'semantic')
  .sort((a, b) =>
    (semanticCategoryFirstSeen.get(a.t.category) - semanticCategoryFirstSeen.get(b.t.category))
    || (semanticRankWithinCategory(a.t.name) - semanticRankWithinCategory(b.t.name))
    || (a.i - b.i)
  )
  .map(({ t }) => t);

const DATA_CATEGORY_ORDER = [
  'data-category',
  'data-diverging-blue-orange',
  'data-sequence-blue',
  'data-win-loss',
  'data-misc',
];
function dataCategoryRank(cat) {
  const i = DATA_CATEGORY_ORDER.indexOf(cat);
  return i === -1 ? 999 : i;
}
function dataTokenIndex(name) {
  const m = name.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}
const dataTokens = rawColors
  .filter(t => t.group === 'data')
  .sort((a, b) =>
    (dataCategoryRank(a.category) - dataCategoryRank(b.category))
    || ((a.subgroup ? parseInt(a.subgroup, 10) : 0) - (b.subgroup ? parseInt(b.subgroup, 10) : 0))
    || (dataTokenIndex(a.name) - dataTokenIndex(b.name))
  );

const colors = [...referenceTokens, ...semanticTokens, ...dataTokens]
  .map(({ _hue, _shade, _variant, _alpha, ...rest }) => rest);

console.log(`  ✓ colors        (${colors.length} tokens)`);

const TOKEN_DATA_JS =
  `const TOKEN_DATA = ${JSON.stringify({ colors })};`;

// ── Generate HTML ─────────────────────────────────────────────────────────────

let html = readFileSync(join(__dirname, 'docs-template.html'), 'utf8');
html = html.replace('/* @@TOKEN_CSS@@ */',  TOKEN_CSS);
html = html.replace('/* @@TOKEN_DATA@@ */', TOKEN_DATA_JS);

writeFileSync(join(docsDir, 'index.html'), html);

const kbSize = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
console.log(`  ✓ docs/index.html  (${kbSize}KB, self-contained)\n\nDocs ready → docs/index.html`);
