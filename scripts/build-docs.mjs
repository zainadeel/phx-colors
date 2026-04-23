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

const colorsCss = readFileSync(join(distDir, 'colors.css'), 'utf8');
const TOKEN_CSS = colorsCss;

function parseVars(css) {
  const result = [];
  for (const [, name, value] of css.matchAll(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*;/gm)) {
    result.push({ name, value: value.trim().replace(/\s+/g, ' ') });
  }
  return result;
}

function getColorGroup(name) {
  if (name.startsWith('--phx-ref-color-'))        return 'reference';
  if (name.startsWith('--phx-web-color-data-'))   return 'data';
  return 'semantic';
}

const REF_HUE_ORDER = [
  'grey', 'blue', 'purple', 'magenta', 'red', 'orange', 'yellow', 'green', 'teal',
  'black', 'white', 'gradient', 'transparent',
];

function getColorCategory(name) {
  if (name.startsWith('--phx-ref-color-')) {
    const rest = name.slice('--phx-ref-color-'.length);
    for (const hue of REF_HUE_ORDER) {
      if (rest === hue || rest.startsWith(`${hue}-`)) return `ref-${hue}`;
    }
    return 'ref-other';
  }
  if (name.startsWith('--phx-web-color-background')) return 'background';
  if (name.startsWith('--phx-web-color-content'))    return 'content';
  if (name.startsWith('--phx-web-color-stroke'))     return 'stroke';
  if (name.startsWith('--phx-web-color-data-')) {
    const rest = name.slice('--phx-web-color-data-'.length);
    if (rest.startsWith('catagorical-'))  return 'data-catagorical';
    if (rest.startsWith('score-safety-')) return 'data-score-safety';
    if (rest.startsWith('score-fuel-'))   return 'data-score-fuel';
    // seq-<hue>-<n>-<i> / div-<hue-pair>-<n>-<i>
    const m = rest.match(/^(seq|div)-([a-z-]+?)-\d+-\d+$/);
    if (m) return `data-${m[1]}-${m[2]}`;
    return 'data-other';
  }
  return 'other';
}

function getDataSubgroup(name) {
  const m = name.match(/^--phx-web-color-data-(?:seq|div)-[a-z-]+?-(\d+)-\d+$/);
  return m ? m[1] : null;
}

const CATEGORY_LABELS = {
  'ref-grey': 'Reference · Grey',
  'ref-blue': 'Reference · Blue',
  'ref-purple': 'Reference · Purple',
  'ref-magenta': 'Reference · Magenta',
  'ref-red': 'Reference · Red',
  'ref-orange': 'Reference · Orange',
  'ref-yellow': 'Reference · Yellow',
  'ref-green': 'Reference · Green',
  'ref-teal': 'Reference · Teal',
  'ref-black': 'Reference · Black (alpha)',
  'ref-white': 'Reference · White (alpha)',
  'ref-gradient': 'Reference · Gradients',
  'ref-transparent': 'Reference · Transparent',
  background: 'Semantic · Background',
  content: 'Semantic · Content',
  stroke: 'Semantic · Stroke',
  'data-seq-blue': 'Data · Sequence · Blue',
  'data-seq-purple': 'Data · Sequence · Purple',
  'data-seq-teal': 'Data · Sequence · Teal',
  'data-div-blue-orange': 'Data · Diverging · Blue–Orange',
  'data-div-blue-red': 'Data · Diverging · Blue–Red',
  'data-div-purple-teal': 'Data · Diverging · Purple–Teal',
  'data-div-purple-yellow': 'Data · Diverging · Purple–Yellow',
  'data-catagorical': 'Data · Categorical',
  'data-score-safety': 'Data · Score · Safety',
  'data-score-fuel': 'Data · Score · Fuel',
};

const rawColors = parseVars(colorsCss).map(({ name }, i) => ({
  name,
  group: getColorGroup(name),
  category: getColorCategory(name),
  categoryLabel: CATEGORY_LABELS[getColorCategory(name)] || getColorCategory(name),
  shade: null,
  subgroup: getDataSubgroup(name),
  label: name.slice(2),
  _i: i,
}));

// Preserve source file order — already organised the way we want to display.
const colors = rawColors
  .sort((a, b) => a._i - b._i)
  .map(({ _i, ...rest }) => rest);

console.log(`  ✓ colors        (${colors.length} tokens)`);

const TOKEN_DATA_JS =
  `const TOKEN_DATA = ${JSON.stringify({ colors })};`;

let html = readFileSync(join(__dirname, 'docs-template.html'), 'utf8');
html = html.replace('/* @@TOKEN_CSS@@ */',  TOKEN_CSS);
html = html.replace('/* @@TOKEN_DATA@@ */', TOKEN_DATA_JS);

writeFileSync(join(docsDir, 'index.html'), html);

const kbSize = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
console.log(`  ✓ docs/index.html  (${kbSize}KB, self-contained)\n\nDocs ready → docs/index.html`);
