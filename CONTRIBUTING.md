# Contributing to @ds-phx/colors

Thanks for helping. This is a Figma-first color token package — the source of truth lives in Figma variables, and this repo translates them into usable CSS, JSON, and TypeScript.

## How it works

```
Figma variables → JSON export → generator scripts → CSS → dist
```

The `src/json/colors/` directories hold raw Figma variable exports. `scripts/generate-color-tokens.mjs` reads them and produces `src/colors.css`. The build compiles everything into `dist/`.

## Adding or updating tokens from Figma

1. **Export from Figma** — use the Figma Variables Export plugin or the Figma API to export variables as JSON.
2. **Drop the JSON** into the appropriate directory:
   - `src/json/colors/reference/` — reference palette (raw hue + scale)
   - `src/json/colors/semantic/` — semantic tokens (intent-driven aliases)
   - `src/json/colors/data/` — data-visualization colors
3. **Run the build**:
   ```bash
   npm run build
   ```
4. **Review the diff** in `src/colors.css` to confirm the changes look right.
5. **Open a PR** — release-please will handle the version bump based on your commit type.

## Naming conventions

Token names mirror Figma variable names exactly. The CSS custom property name is derived by:

- Taking the full Figma variable path (e.g. `color/background/primary`)
- Replacing `/` with `-`
- Prefixing with `--` (e.g. `--color-background-primary`)

If a Figma token is renamed, the CSS token name changes too — **this is a breaking change** and requires a major version bump (minor pre-1.0).

## What belongs here vs elsewhere

**In `@ds-phx/colors`** — pure color primitives only:
- Reference, semantic, and data-viz colors
- Light + dark theme overrides

**Not here** — dimensions, typography, effects. Those live in `@ds-mo/tokens`.

## Running the build

```bash
npm run build          # full build (CSS + JSON + TypeScript constants)
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

## Code style

No linting setup — just keep generator scripts consistent with the existing style. Comments should explain *why*, not *what*.
