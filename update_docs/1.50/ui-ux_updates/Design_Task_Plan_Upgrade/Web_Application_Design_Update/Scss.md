# SCSS Architecture

- **File Structure:**
  - `base/_reset.scss`, `base/_typography.scss`, `base/_utilities.scss`.
  - `layout/_grid.scss`, `layout/_navigation.scss`, `layout/_panels.scss`.
  - `components/_cards.scss`, `_buttons.scss`, `_tables.scss`, `_modals.scss`, `_forms.scss`.
  - `themes/_light.scss`, `_dark.scss` to override token maps.
- **Variables & Maps:** Centralise tokens in `_variables.scss` with maps for colours, spacing, shadows, and z-index. Provide helper functions `color($name, $mode: light)` and `space($step)`.
- **Mixins:**
  - `@mixin breakpoint($size)` for consistent media queries.
  - `@mixin focus-ring($color)` to apply accessible outlines.
  - `@mixin elevation($level)` to map to shadow tokens.
  - `@mixin truncated($lines)` for multi-line ellipsis in cards.
- **Extensibility:** Use `@use`/`@forward` for modular imports; avoid global namespace clashes.
- **Theming:** Generate CSS variables via SCSS loops for light/dark; maintain parity with mobile design tokens.
- **Build Integration:** Compile with source maps for design QA, enable linting (stylelint) with SCSS-specific rules.
