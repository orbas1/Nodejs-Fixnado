# SCSS Architecture Plan

## Structure
```
scss/
  abstracts/
    _variables.scss
    _mixins.scss
    _functions.scss
  base/
    _reset.scss
    _typography.scss
  layout/
    _grid.scss
    _header.scss
  components/
    _buttons.scss
    _cards.scss
    _tables.scss
  pages/
    _dashboard.scss
    _marketplace.scss
  themes/
    _light.scss
    _dark.scss
```

## Guidelines
- Use mixins for responsive breakpoints and box shadows.
- Keep nesting to max three levels.
- Compile to CSS modules via build pipeline; autoprefix for cross-browser support.

## Maintenance
- Document dependencies between partials; update `_variables.scss` when tokens change.
- Run Stylelint on SCSS files and include in CI pipeline.
