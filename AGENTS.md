# AGENTS.md

Guide for AI agents (and humans) working on **phx-colors** (`@ds-phx/colors`). Follows the [agents.md](https://agents.md) convention — tool-agnostic. `CLAUDE.md` points here.

Keep this file as the single source of truth for project conventions. Update it when you change the pipeline or release flow.

---

## What this project is

phx-colors is an npm package (`@ds-phx/colors`) that ships **Phoenix color tokens** as:

- CSS custom properties (the primary deliverable — one `colors.css`)
- TypeScript constants for all token names (`dist/index.mjs` / `.cjs` / `.d.ts`)
- Reset, global, utility CSS, and an optional `themes/light.css` stub

It is a **drop-in compatibility package** for the Motive webapp's existing Phoenix color system. Token names mirror the webapp's SCSS verbatim (`--phx-ref-color-*`, `--phx-web-color-*`) so adopting this package is an import swap, not a find-and-replace.

**Light-only.** No dark theme, no JSON round-trip, no Figma export pipeline. Tokens are hand-authored in `src/colors.css`.

---

## Directory map

```
src/
  colors.css           # All Phoenix color tokens — authored directly
  globals.css          # Optional global styles (font, reduced-motion)
  reset.css            # CSS reset
  utilities.css        # Utility classes
  themes/
    light.css          # color-scheme: light stub
  index.css            # Barrel import (just @imports colors.css)
scripts/
  build.mjs                     # Orchestrates the build — copies CSS + runs TS gen
  generate-ts-constants.mjs     # Parses colors.css → dist/index.{mjs,cjs,d.ts}
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
release-please-config.json      # Release Please config
.release-please-manifest.json   # Pinned current version
```

---

## Commands

```bash
npm run build          # Full build — copies src CSS to dist/ + generates TS constants
npm run build:docs     # Rebuild docs/index.html (GH Pages browser)
npm run build:ts       # TS constants only
npm run dev            # Watch mode — rebuilds on src changes
npm run clean          # Remove dist/
```

No separate test/lint commands — validation is done by the Build workflow on every PR.

---

## Build pipeline

1. **Clean** — nuke `dist/`, recreate `dist/themes/`.
2. **Copy CSS** — `src/*.css` and `src/themes/light.css` copied verbatim to `dist/`.
3. **Generate TypeScript** — `generate-ts-constants.mjs` parses `src/colors.css` and emits `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` with a named constant for every `--phx-*` CSS variable (camelCase form → CSS var string).

That's it. No JSON generation, no Figma import, no theme overrides.

---

## Adding or updating tokens

1. Edit `src/colors.css` directly.
2. **Preserve the `--phx-ref-color-*` / `--phx-web-color-*` naming** — this is the whole point of the package. Do not rename to `--color-*` or any other scheme.
3. Run `npm run build`.
4. If the change is UI-relevant, regenerate docs: `npm run build:docs`.

---

## Commit & PR conventions

**Conventional Commits**, enforced by `.github/workflows/pr-title.yml`:

```
<type>(<optional-scope>): <lowercase subject>

types: feat | fix | perf | revert | docs | style | refactor | test | build | ci | chore
```

Subject must **start with a lowercase letter**. Scope is optional — common ones: `colors`, `docs`, `build`.

**Version-bumping types:**
- `feat:` → minor bump
- `fix:` / `perf:` → patch bump
- `feat!:` or `BREAKING CHANGE:` footer → major bump (pre-1.0: bump minor instead)
- `ci:` / `chore:` / `build:` / `test:` / `style:` / `docs:` / `refactor:` → no release

**Branch naming:** `type/short-kebab-description` (e.g. `feat/add-brand-colors`, `fix/teal-70-hex`).

**PR flow:** always via feature branch + PR to `main`.

---

## Release flow

**Automated path (normal case):**

1. Land a `feat:` or `fix:` commit on `main` via PR.
2. `release-please.yml` fires → opens (or updates) a release PR that bumps `package.json`, updates `CHANGELOG.md`, and updates `.release-please-manifest.json`.
3. Review and merge the release PR.
4. Release Please tags `vX.Y.Z`, creates the GitHub Release, and the `publish` job publishes to npm with `--provenance` via **OIDC Trusted Publisher**.

**Forcing a specific version:** push an empty commit with a `Release-As: X.Y.Z` trailer (use merge-commit strategy so the trailer survives).

**Never** run `npm publish` manually — it bypasses provenance and the tag/release/changelog dance.

---

## npm Trusted Publisher setup

Must be done manually by the package owner once (first publish may require a manual bootstrap publish to create the package on npm before the Trusted Publisher UI is available):

1. Go to https://www.npmjs.com/package/@ds-phx/colors/access
2. **Trusted Publishers** → **Add a publisher**
3. Publisher: `GitHub Actions`
4. GitHub org/user: `zainadeel`
5. Repository: `phx-colors`
6. Workflow filename: `release-please.yml`
7. Environment: _(leave blank)_
8. Save.

---

## CI workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `build.yml` | PR to main | `npm ci` + build + verify dist + verify `src/` not mutated |
| `pr-title.yml` | PR opened/edited | Enforce conventional-commit PR titles (lowercase subject) |
| `codeql.yml` | Push/PR to main, weekly Sunday | CodeQL JS/TS security scan |
| `release-please.yml` | Push to main | Open release PR; publish to npm via OIDC on release PR merge |
| `deploy.yml` | Push to main, manual | Build + deploy token browser to GitHub Pages |
| `dependabot.yml` | Monthly | Bump github-actions + npm devDependencies |

---

## Things not to do

- **Do not edit `dist/`** — regenerate with `npm run build`.
- **Do not edit `docs/index.html`** — regenerate with `npm run build:docs`.
- **Do not hand-bump `package.json` version** during normal work — let release-please do it.
- **Do not rename tokens to a non-Phoenix scheme** (e.g. `--color-*`). The drop-in-for-webapp property is load-bearing.
- **Do not re-introduce** dark theme files, JSON pipeline, or dimension/typography/effect tokens. Out of scope for this package.
- **Do not commit `NPM_TOKEN`** — publishing uses OIDC, no secrets required.

---

## Quick reference: where things live

| Need to change... | Edit this |
|---|---|
| Color token values | `src/colors.css` |
| Build orchestration | `scripts/build.mjs` |
| TypeScript constant format | `scripts/generate-ts-constants.mjs` |
| Token browser styling | `scripts/docs-template.html` |
| Token browser grouping/sorting | `scripts/build-docs.mjs` |
| Release changelog sections | `release-please-config.json` |
| PR title rules | `.github/workflows/pr-title.yml` |
