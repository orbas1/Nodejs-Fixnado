# CSS Architecture Updates

## Approach
- Adopt CSS variables for design tokens (`color`, `font`, `space`, `radius`, `shadow`).
- Use BEM-inspired naming for legacy components while migrating to CSS modules for React components.
- Introduce utility classes for spacing and layout adjustments (`.u-margin-top-24`, `.u-flex-center`).

## File Structure
```
styles/
  tokens.css
  base.css
  layout/
    grid.css
    header.css
  components/
    card.css
    modal.css
    table.css
  utilities/
    spacing.css
    typography.css
```

## Best Practices
- Avoid deep selector nesting (>3 levels) to reduce specificity wars.
- Use `prefers-reduced-motion` media query to adjust animations.
- Implement CSS custom properties for light/dark themes and respect system preferences.

## Performance
- Purge unused CSS with build step; ensure critical CSS inlined for above-the-fold content.
- Use `content-visibility` on heavy sections to improve render performance.

## Testing
- Visual regression testing via Percy for key templates after CSS changes.
- Lint using Stylelint with custom config to enforce naming conventions and property order.
