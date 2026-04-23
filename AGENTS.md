# AGENTS.md

Guide for AI agents (and humans) working on **phx-colors** (`@ds-phx/colors`). Follows the [agents.md](https://agents.md) convention — tool-agnostic. `CLAUDE.md` points here.

Keep this file as the single source of truth for project conventions. Update it when you add pipelines, token categories, or change the release flow.

---

## What this project is

phx-colors is an npm package (`@ds-phx/colors`) that ships **Phoenix color tokens** as:

- CSS custom properties (the primary deliverable — one `colors.css` file + a combined index)
- Light/dark theme files (`dist/themes/light.css`, `dist/themes/dark.css`)
- A machine-readable JSON blob (`dist/tokens.json` + `dist/json/colors.json`)
- TypeScript constants for all token names (`dist/index.mjs` / `.cjs` / `.d.ts`)
- Reset, global, and utility CSS (optional)

It's the color-only counterpart to `@ds-mo/tokens` — scoped specifically to the Phoenix color system so the Motive webapp can migrate color usage component-by-component without pulling in the full forward-looking token set. It is Figma-first: raw token JSON is exported from Figma variables and dropped into `src/json/colors/`, then build scripts generate the distributable artifacts.

---

## Directory map

```
src/
  colors.css           # Color token CSS (generated from JSON sources)
  globals.css          # Optional global styles (font, reduced-motion, theme-transition guards)
  reset.css            # CSS reset
  utilities.css        # Utility classes
  themes/
    light.css          # Light theme token overrides
    dark.css           # Dark theme token overrides
  index.css            # Barrel import
  json/
    colors/
      reference/       # Figma-exported reference palette JSON
      semantic/        # Figma-exported semantic tokens (light + dark)
      data/            # Figma-exported data-viz tokens (light + dark)
scripts/
  build.mjs                     # Orchestrates the full build
  generate-color-tokens.mjs     # JSON → colors.css
  generate-json-tokens.mjs      # src CSS → dist/tokens.json + dist/json/colors.json
  generate-ts-constants.mjs     # Generates TypeScript constants from token names
  build-docs.mjs                # Regenerates docs/index.html (GH Pages token browser)
  docs-template.html            # Template for the token browser
docs/
  index.html            # Built GitHub Pages browser (do NOT edit by hand — regenerate)
dist/                   # Generated — do not edit directly
.github/
  workflows/
    build.yml          # PR: npm ci, build, verify artifacts + src unchanged
    codeql.yml         # JS/TS security scan — PR + push + weekly Sunday cron
    pr-title.yml       # Lints PR titles as conventional commits
    release-please.yml # Opens release PRs on feat/fix; auto-publishes to npm on merge (OIDC)
    deploy.yml         # Builds + deploys the GH Pages token browser
  dependabot.yml       # Monthly bumps for github-actions + npm
release-please-config.json      # Release Please config (node, changelog sections)
.release-please-manifest.json   # Pinned current version
```

---

## Commands

```bash
npm run build          # Full build — CSS + JSON + TypeScript
npm run build:colors   # Color tokens only (fast iteration)
npm run build:docs     # Rebuild docs/index.html (GH Pages browser)
npm run dev            # Watch mode — rebuilds on src changes
npm run clean          # Remove dist/
```

No separate test/lint commands — validation is done by the Build workflow on every PR (it re-runs the build and asserts `src/` was not mutated).

---

## Build pipeline (what `npm run build` does)

1. **Clean** — nuke `dist/`, recreate subdirs (`dist/themes/`, `dist/json/`).
2. **Generate CSS** — `generate-color-tokens.mjs` reads `src/json/colors/**/*.json` (Figma export) and produces `src/colors.css`, which is then copied to `dist/colors.css`.
3. **Copy static CSS** — `src/*.css` files that are not generated (themes, reset, utilities, globals, index) are copied verbatim to `dist/`.
4. **Generate JSON** (`generate-json-tokens.mjs`) — parses `src/colors.css` into `dist/tokens.json` + `dist/json/colors.json`.
5. **Generate TypeScript** (`generate-ts-constants.mjs`) — emits `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` with named constants for every token name.

---

## Theming

Light/dark theming is **CSS-only** — no JavaScript. Consuming apps toggle the `data-theme` attribute on `:root` (or a container element):

```html
<html data-theme="dark">
```

All token values are defined as CSS custom properties. Theme files override them for the relevant mode.

---

## Adding or updating tokens

### From a Figma export

1. Export Figma variables as JSON (one file per collection: reference, semantic light, semantic dark, data light, data dark).
2. Drop the JSON files into `src/json/colors/{reference,semantic,data}/` replacing the existing files.
3. Run `npm run build` to regenerate `dist/`.
4. Verify the token browser: `npm run build:docs`, then open `docs/index.html`.

### Editing a token directly

1. Edit the JSON file in `src/json/colors/**/*.json` for that group.
2. Run `npm run build` (or `npm run build:colors` for color-only changes).
3. Do **not** edit generated CSS in `dist/` — your changes will be overwritten on the next build.

---

## Commit & PR conventions

**Conventional Commits**, enforced by `.github/workflows/pr-title.yml`:

```
<type>(<optional-scope>): <lowercase subject>

types: feat | fix | perf | revert | docs | style | refactor | test | build | ci | chore
```

Subject must **start with a lowercase letter** (workflow enforced). Scope is optional — common ones here: `colors`, `docs`, `build`.

**Version-bumping types** (trigger a release PR via release-please):
- `feat:` → minor bump
- `fix:` / `perf:` → patch bump
- `feat!:` or `BREAKING CHANGE:` footer → major bump (pre-1.0: bump minor instead)
- `ci:` / `chore:` / `build:` / `test:` / `style:` / `docs:` / `refactor:` → **do not trigger a release** (most hidden in changelog; `docs` is visible)

See `release-please-config.json` for the type → changelog section mapping.

**Branch naming:** `type/short-kebab-description` (e.g. `feat/add-phx-reference-colors`, `ci/add-release-workflow`, `docs/agent-onboarding`).

**PR flow:** always via feature branch + PR to `main`. Direct pushes to `main` are blocked.

---

## Versioning

Pre-1.0: breaking token renames ship as **minor** bumps. Once we hit `1.0.0`, renames go behind majors.

Current version lives in:
- `package.json` `"version"`
- `.release-please-manifest.json` `"."`

Release-please handles both automatically when it opens a release PR.

---

## Release flow

**Automated path (normal case):**

1. Land a `feat:` or `fix:` commit on `main` via PR.
2. `release-please.yml` fires → opens (or updates) a release PR that bumps `package.json`, updates `CHANGELOG.md`, and updates `.release-please-manifest.json`.
3. Review and merge the release PR.
4. Release Please tags `vX.Y.Z`, creates the GitHub Release, and the `publish` job in the same workflow publishes to npm with `--provenance` via **OIDC Trusted Publisher** (no long-lived `NPM_TOKEN` — configured in npm under Package Settings → Trusted Publishers).

**Forcing a specific version (`Release-As:` escape hatch):**

Push an empty commit with a `Release-As: X.Y.Z` trailer in the commit message body to `main`:

```bash
git commit --allow-empty -m "chore: release as X.Y.Z

Release-As: X.Y.Z"
```

**Merge strategy:** use "Create a merge commit" (not squash) when merging a `Release-As:` commit so the trailer survives.

**Never** run `npm publish` manually for a normal release — it bypasses provenance and skips the tag/release/changelog dance.

---

## npm Trusted Publisher setup

Must be done manually by the package owner once:

1. Go to https://www.npmjs.com/package/@ds-phx/colors/access
2. Scroll to **Trusted Publishers** → **Add a publisher**
3. Publisher: `GitHub Actions`
4. GitHub org/user: `zainadeel`
5. Repository: `phx-colors`
6. Workflow filename: `release-please.yml` (no path prefix)
7. Environment: _(leave blank)_
8. Click **Save** and reload to confirm.

---

## CI workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `build.yml` | PR to main | `npm ci` + build + verify dist artifacts + verify `src/` not mutated |
| `pr-title.yml` | PR opened/edited | Enforce conventional-commit PR titles (lowercase subject) |
| `codeql.yml` | Push/PR to main, weekly Sunday | GitHub CodeQL JS/TS security scan |
| `release-please.yml` | Push to main | Open release PR on feat/fix; publish to npm via OIDC when release PR merges |
| `deploy.yml` | Push to main, manual | Build + deploy token browser to GitHub Pages |
| `dependabot.yml` | Monthly | Bump github-actions + npm devDependencies |

---

## Things not to do

- **Do not edit `dist/`** — it's generated. Edit `src/` or scripts, then run `npm run build`.
- **Do not edit `docs/index.html`** — regenerate with `npm run build:docs`.
- **Do not hand-bump `package.json` version** during normal work — let release-please do it.
- **Do not `git push` to `main`** — always branch + PR.
- **Do not delete a token from `src/json/colors/` without explicit user confirmation** — even if a Figma re-export omits it; it might be a Figma filter accident.
- **Do not commit `NPM_TOKEN` or any npm auth** — publishing uses OIDC, no secrets required.
- **Do not re-introduce dimension / typography / effect tokens here.** Those live in `@ds-mo/tokens`. phx-colors is color-only by design.

---

## Quick reference: where things live

| Need to change... | Edit this |
|---|---|
| Reference color values | `src/json/colors/reference/color.reference.tokens.json` |
| Semantic color values (light) | `src/json/colors/semantic/color.semantic.light.tokens.json` |
| Semantic color values (dark) | `src/json/colors/semantic/color.semantic.dark.tokens.json` |
| Data-viz color values (light) | `src/json/colors/data/color.data.light.tokens.json` |
| Data-viz color values (dark) | `src/json/colors/data/color.data.dark.tokens.json` |
| Color CSS generation logic | `scripts/generate-color-tokens.mjs` |
| Build orchestration | `scripts/build.mjs` |
| TypeScript constant format | `scripts/generate-ts-constants.mjs` |
| Token browser styling | `scripts/docs-template.html` + `scripts/build-docs.mjs` |
| Release changelog sections | `release-please-config.json` |
| PR title rules | `.github/workflows/pr-title.yml` |
| Theme CSS (light/dark) | `src/themes/light.css`, `src/themes/dark.css` |
