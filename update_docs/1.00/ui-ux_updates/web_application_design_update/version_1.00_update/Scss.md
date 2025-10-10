# SCSS Structure & Mixins — Web Application v1.00

## Directory Layout
```
/frontend-reactjs/apps/web/styles/
├── abstracts/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _functions.scss
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   ├── _utilities.scss
├── components/
│   ├── _buttons.scss
│   ├── _forms.scss
│   ├── _cards.scss
├── layouts/
│   ├── _app-shell.scss
│   ├── _grid.scss
└── pages/
    ├── _explorer.scss
    ├── _dashboard.scss
    └── _settings.scss
```

## Variable Mapping
- Import CSS variables into SCSS using `:root` definitions via `@use 'sass:map';` and fallback maps.
- Example: `$color-primary-500: var(--color-primary-500, #1445E0);`
- Spacing map `$space: (8: 0.5rem, 16: 1rem, 24: 1.5rem, 32: 2rem);` ensures rem conversion.

## Mixins
```scss
@mixin card($padding: 24px, $radius: 16px) {
  background: var(--color-surface, #fff);
  border-radius: $radius;
  padding: $padding;
  box-shadow: var(--shadow-level-1);
}

@mixin responsive-font($min, $max) {
  font-size: clamp($min, calc($min + 1vw), $max);
}

@mixin focus-ring($color: var(--color-info-500)) {
  outline: 3px solid $color;
  outline-offset: 3px;
}
```

## Functions
```scss
@function rem($px) {
  @return ($px / 16) * 1rem;
}

@function shade($color, $percentage) {
  @return mix(#000, $color, $percentage);
}
```

## Theming
- Dark mode styles nested under `[data-theme="dark"] { ... }` using same mixins with alternate variables.
- High contrast accessible by toggling `[data-contrast="high"]` body attribute; increase border width and remove gradients via mixin overrides.

## Compilation Strategy
- Use Next.js built-in Sass support with `sassOptions.includePaths` pointing to `styles/`.
- Enable CSS Modules for page-specific SCSS (`Explorer.module.scss`). Share mixins by `@use '../abstracts/mixins' as *;`.
- Generate source maps in development for debugging (`sassOptions.sourceMap: true`).

## Linting
- Stylelint plugin `stylelint-scss` to restrict nesting depth to 3, avoid `@extend` usage.
- Run `npm run lint:styles` before commits.

## Migration Notes
- Gradually replace SCSS variable usage with CSS custom properties; keep SCSS as syntactic sugar.
- Document any remaining SCSS-only patterns for backlog removal in v1.1.
