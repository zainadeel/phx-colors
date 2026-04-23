# @ds-phx/colors

Phoenix color tokens as CSS custom properties and TypeScript constants.

This package ports the Motive webapp's Phoenix color system into a standalone, drop-in package. Token names are preserved verbatim (`--phx-ref-color-*`, `--phx-web-color-*`) so the webapp can migrate component-by-component without a find-and-replace.

> Related: `@ds-mo/tokens` ships the forward-looking full token set (colors, dimensions, typography, effects). `@ds-phx/colors` scopes to Phoenix colors only, light-only, and is intended as a compatibility shim.

## Install

```bash
npm install @ds-phx/colors
```

## Usage

### CSS

```css
/* All color tokens */
@import '@ds-phx/colors';
/* or explicitly */
@import '@ds-phx/colors/colors';

/* Optional: base styles (font loading, reduced-motion) */
@import '@ds-phx/colors/globals';

/* Optional: CSS reset */
@import '@ds-phx/colors/reset';

/* Optional: utility classes */
@import '@ds-phx/colors/utilities';
```

### JS / TypeScript (via bundler)

```ts
import '@ds-phx/colors';

// Type-safe token name constants
import { phxWebColorBackgroundPrimary } from '@ds-phx/colors/ts';
// value is the CSS variable name string: '--phx-web-color-background-primary'
element.style.setProperty(phxWebColorBackgroundPrimary, 'red');
```

## Token groups

| Group | Prefix | Purpose |
|---|---|---|
| Reference | `--phx-ref-color-*` | Raw palette — hue + step (1–90) and alpha scales. Source of truth. |
| Semantic | `--phx-web-color-background-*`, `--phx-web-color-content-*`, `--phx-web-color-stroke-*` | Intent-driven aliases for UI surfaces, text, and borders. |
| Data | `--phx-web-color-data-*` | Data-visualization palettes — categorical, sequential, diverging, score scales. |

## Dev

```bash
npm run build         # full build (colors.css → dist/ + TS constants)
npm run dev           # watch mode
npm run build:docs    # regenerate the GitHub Pages token browser
```

## License

MIT
