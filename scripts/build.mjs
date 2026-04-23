/**
 * Build script for @ds-phx/colors
 *
 * 1. Copies all CSS token files to dist/
 * 2. Generates TypeScript constants for token names
 */
import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');
const DIST_DIR = path.join(PKG_ROOT, 'dist');

const isWatch = process.argv.includes('--watch');

function clean() {
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true });
  }
}

function build() {
  const startTime = Date.now();
  console.log('\n🔨 Building @ds-phx/colors...\n');

  clean();
  mkdirSync(DIST_DIR, { recursive: true });
  mkdirSync(path.join(DIST_DIR, 'themes'), { recursive: true });

  console.log('  → Copying CSS token files to dist/...');
  const cssFiles = [
    'index.css',
    'colors.css',
    'reset.css',
    'globals.css',
    'utilities.css',
  ];

  for (const file of cssFiles) {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(DIST_DIR, file);
    if (existsSync(src)) {
      cpSync(src, dest);
    } else {
      console.warn(`  ⚠ Missing: ${file}`);
    }
  }

  const themeFiles = ['light.css'];
  for (const file of themeFiles) {
    const src = path.join(SRC_DIR, 'themes', file);
    const dest = path.join(DIST_DIR, 'themes', file);
    if (existsSync(src)) {
      cpSync(src, dest);
    }
  }

  console.log('  → Generating TypeScript constants...');
  execSync('node scripts/generate-ts-constants.mjs', { cwd: PKG_ROOT, stdio: 'inherit' });

  const elapsed = Date.now() - startTime;
  console.log(`\n✅ @ds-phx/colors built in ${elapsed}ms\n`);
}

build();

if (isWatch) {
  console.log('👀 Watching for changes...\n');

  const { watch } = await import('chokidar');

  const watcher = watch([path.join(SRC_DIR, '**/*.css')], {
    ignoreInitial: true,
  });

  let debounceTimer = null;
  const rebuild = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log('♻️  Change detected, rebuilding...');
      build();
    }, 200);
  };

  watcher.on('change', rebuild);
  watcher.on('add', rebuild);
  watcher.on('unlink', rebuild);
}
