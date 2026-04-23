/**
 * Generates machine-readable JSON token files from the CSS source files.
 *
 * Output:
 *   dist/tokens.json       — all tokens in one file
 *   dist/json/colors.json  — color tokens only
 *
 * Format (W3C Design Tokens Community Group compatible):
 *   { "token-name": { "$type": "color", "$value": "..." } }
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');
const DIST_DIR = path.join(PKG_ROOT, 'dist');

function parseCssCustomProperties(cssContent) {
  const properties = [];
  const regex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = regex.exec(cssContent)) !== null) {
    const name = `--${match[1]}`;
    const value = match[2].trim();
    properties.push({ name, value });
  }

  return properties;
}

function inferType(name) {
  if (name.startsWith('--color-')) return 'color';
  return 'other';
}

function toDesignTokens(properties) {
  const tokens = {};
  for (const { name, value } of properties) {
    tokens[name] = { $type: inferType(name), $value: value };
  }
  return tokens;
}

function generateForFile(filename) {
  const filepath = path.join(SRC_DIR, filename);
  const css = readFileSync(filepath, 'utf8');
  const properties = parseCssCustomProperties(css);
  return toDesignTokens(properties);
}

const categories = {
  colors: 'colors.css',
};

mkdirSync(path.join(DIST_DIR, 'json'), { recursive: true });

const allTokens = {};

for (const [category, filename] of Object.entries(categories)) {
  const tokens = generateForFile(filename);
  Object.assign(allTokens, tokens);

  const outputPath = path.join(DIST_DIR, 'json', `${category}.json`);
  writeFileSync(outputPath, JSON.stringify(tokens, null, 2), 'utf8');

  const count = Object.keys(tokens).length;
  console.log(`    ${category}: ${count} tokens → dist/json/${category}.json`);
}

writeFileSync(path.join(DIST_DIR, 'tokens.json'), JSON.stringify(allTokens, null, 2), 'utf8');

const totalCount = Object.keys(allTokens).length;
console.log(`    total: ${totalCount} tokens → dist/tokens.json`);
