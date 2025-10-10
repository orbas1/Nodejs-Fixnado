# CSS Implementation Blueprint — Web Application v1.00

## Architecture
- Use **CSS-in-JS (`styled-components`)** for new components with design tokens consumed from `@fixnado/design-tokens`.
- Legacy modules in `/frontend-reactjs/apps/web/styles` remain SCSS; gradually migrate using shared token variables exported as CSS custom properties.
- Establish global stylesheet `globals.css` containing resets, typography base, CSS variables, and utility classes.

## CSS Variables
- Defined in `:root` and `[data-theme="dark"]` scopes.
- Naming: `--color-primary-500`, `--space-16`, `--font-heading-lg-size`.
- Provide fallback values for Safari by including default values in components.

## Layout Utilities
- `.grid-12` sets `display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 24px;`.
- `.stack-24` sets flex column with `gap: 24px`.
- `.scroll-y` for scrollable panels with `overflow-y:auto; scrollbar-gutter:stable;` custom scrollbar styling.

## Responsive Breakpoints
```css
@media (max-width: 1439px) { /* lg */ }
@media (max-width: 1279px) { /* md */ }
@media (max-width: 1023px) { /* sm */ }
@media (max-width: 767px)  { /* xs */ }
@media (max-width: 479px)  { /* xxs */ }
```
- Use mobile-first approach. Define base styles for mobile, enhance for larger screens.

## Accessibility Rules
- Focus outlines defined globally: `:focus-visible { outline: 3px solid var(--color-info-500); outline-offset: 3px; }`.
- Provide `prefers-reduced-motion` guard: reduce animation durations to 1ms and disable parallax.
- Respect `prefers-contrast: more` by increasing border widths and removing gradients.

## Performance Optimisations
- Use `content-visibility: auto` on large sections (e.g., long forms) to defer rendering.
- Prefetch hero backgrounds using `<link rel="preload" as="image">`.
- Minify CSS bundle via Next.js SWC; ensure unused styles removed through tree-shaking.

## Naming Conventions
- Utility classes follow `u-` prefix (e.g., `u-text-center`, `u-pt-24`).
- Component-scoped styles use `ComponentName__element` pattern when not using styled-components.
- Data-state attributes used to toggle CSS states: `[data-state="open"]` etc.

## Print Styles
- Provide print stylesheet `@media print` to convert backgrounds to white, text black, hide navigation.
- Ensure tables convert to simple layout; show key columns only.

## Linting & Quality
- Enforce stylelint config `@fixnado/stylelint-config` with rules for BEM naming, nesting depth <= 3.
- Integrate Prettier plugin for consistent formatting.
- CSS variables documented in Storybook `Tokens` page.
