/**
 * Generates TypeScript constants for token names.
 *
 * Output: dist/index.mjs, dist/index.cjs, dist/index.d.ts
 *
 * Usage in consuming apps:
 *   import { phxWebColorBackgroundPrimary } from '@ds-phx/colors/ts';
 *   // phxWebColorBackgroundPrimary === '--phx-web-color-background-primary'
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PKG_ROOT, 'dist');

function parseTokenNames(cssContent) {
  const names = new Set();
  const regex = /--([a-zA-Z0-9-]+)\s*:/g;
  let match;

  while ((match = regex.exec(cssContent)) !== null) {
    names.add(`--${match[1]}`);
  }

  return [...names];
}

function toCamelCase(cssVarName) {
  return cssVarName
    .replace(/^--/, '')
    .replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

const tokenFiles = ['colors.css'];
const allNames = [];

for (const file of tokenFiles) {
  const filepath = path.join(PKG_ROOT, 'src', file);
  const css = readFileSync(filepath, 'utf8');
  allNames.push(...parseTokenNames(css));
}

const uniqueNames = [...new Set(allNames)].sort();

const esmLines = uniqueNames.map(
  name => `export const ${toCamelCase(name)} = '${name}';`
);
writeFileSync(path.join(DIST_DIR, 'index.mjs'), esmLines.join('\n') + '\n', 'utf8');

const cjsLines = uniqueNames.map(
  name => `exports.${toCamelCase(name)} = '${name}';`
);
writeFileSync(path.join(DIST_DIR, 'index.cjs'), cjsLines.join('\n') + '\n', 'utf8');

const dtsLines = uniqueNames.map(
  name => `export declare const ${toCamelCase(name)}: '${name}';`
);
writeFileSync(path.join(DIST_DIR, 'index.d.ts'), dtsLines.join('\n') + '\n', 'utf8');

console.log(`    TypeScript: ${uniqueNames.length} token constants → dist/index.{mjs,cjs,d.ts}`);
