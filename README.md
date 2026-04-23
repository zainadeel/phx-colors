# @ds-phx/colors

Phoenix color tokens as CSS custom properties, JSON, and TypeScript constants.

This package is the **color-token counterpart** to the legacy Phoenix (webapp) color system, published in the same Figma-first pipeline as `@ds-mo/tokens`. It exposes reference, semantic, and data-visualization color tokens — light + dark — that the Motive webapp can migrate to component-by-component.

> Related: `@ds-mo/tokens` ships the forward-looking full token set (colors, dimensions, typography, effects). `@ds-phx/colors` scopes to Phoenix colors only.

## Install

```bash
npm install @ds-phx/colors
# or
pnpm add @ds-phx/colors

# Local development (no npm publish needed):
pnpm add file:../path/to/phx-colors
```

## Usage

### CSS

```css
/* All color tokens */
@import '@ds-phx/colors';
/* or explicitly */
@import '@ds-phx/colors/colors';

/* Optional: base styles (font loading, reduced-motion, theme-transition guards) */
@import '@ds-phx/colors/globals';

/* Optional: CSS reset */
@import '@ds-phx/colors/reset';
```

### JS / TypeScript (via bundler)

```ts
import '@ds-phx/colors';

// Type-safe token name constants
import { colorBackgroundPrimary } from '@ds-phx/colors/ts';
// value is just the CSS variable name string: '--color-background-primary'
element.style.setProperty(colorBackgroundPrimary, 'red');
```

### JSON (for tooling, plugins, etc.)

```ts
import tokens from '@ds-phx/colors/json';
import colors from '@ds-phx/colors/json/colors';
```

## Theming

Light/dark theme is controlled via a `data-theme` attribute on `<html>`:

```ts
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-theme', 'light');
```

Light is the default. No JS required — pure CSS variable overrides.

## Token groups

| Group | Prefix | Purpose |
|---|---|---|
| Reference | `--color-reference-*` | Raw palette — named hue + lightness/alpha steps. Source of truth. |
| Semantic | `--color-background-*`, `--color-foreground-*`, `--color-border-*`, … | Intent-driven aliases for UI. Resolves to reference values. |
| Data | `--color-data-*` | Data-visualization palettes — categorical, diverging, sequential, win/loss. |

## Updating tokens from Figma

1. Export updated variable JSON from Figma.
2. Drop files into `src/json/colors/{reference,semantic,data}/`.
3. Run the build:

```bash
npm run build
```

## Dev

```bash
npm run build         # full build (colors.css + tokens.json + TS constants)
npm run dev           # watch mode
npm run build:docs    # regenerate the GitHub Pages token browser
```

## License

MIT
