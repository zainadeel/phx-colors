# Contributing to @ds-phx/colors

Thanks for helping. This package ports the Motive webapp's Phoenix color tokens into a standalone npm package. Tokens are authored directly in CSS — there is no Figma/JSON round-trip for this package.

## How it works

```
src/colors.css → dist/ (copied as-is) + dist/index.{mjs,cjs,d.ts} (TS constants)
```

`scripts/build.mjs` copies CSS files into `dist/` and runs `generate-ts-constants.mjs` to emit TypeScript constants derived from the CSS custom property names.

## Adding or updating tokens

1. Edit `src/colors.css` directly.
2. Preserve the `--phx-ref-color-*` / `--phx-web-color-*` naming — these mirror the webapp's Phoenix library for drop-in compatibility. Do not rename to a different scheme.
3. Run the build:
   ```bash
   npm run build
   ```
4. Regenerate the docs if UI-relevant:
   ```bash
   npm run build:docs
   ```
5. Open a PR.

## Scope

**In `@ds-phx/colors`** — Phoenix color primitives only (reference, semantic background/content/stroke, data viz). Light-only.

**Not here** — dimensions, typography, effects, dark theme. Those belong in `@ds-mo/tokens` or future packages.

## Build

```bash
npm run build          # full build
npm run dev            # rebuild on file changes
npm run build:docs     # regenerate the GH Pages token browser
```

## Versioning

This package uses [release-please](https://github.com/googleapis/release-please) driven by Conventional Commits.

| Commit type | Version bump |
|---|---|
| `feat:` | minor |
| `fix:` / `perf:` | patch |
| `feat!:` / `BREAKING CHANGE:` | major (minor pre-1.0) |
| `ci:` / `chore:` / `build:` / `test:` / `style:` / `docs:` / `refactor:` | no release |
