# CSS Guidelines

- **Variables & Tokens:** Define colour, typography, spacing, and elevation tokens in `:root` with light/dark theme wrappers. Sync with SCSS maps and expose to React via CSS custom properties.
- **Naming Convention:** Continue BEM (`.component__element--modifier`) for legacy modules while introducing utility classes for layout (`.grid-col-6`, `.gap-4`). Document mapping in implementation notes.
- **Responsive Strategy:** Use `@media` queries for breakpoints at 1440px, 1200px, 1024px, 768px, and 480px. Provide container queries for cards that adapt content density.
- **Accessibility Hooks:** Provide `.sr-only` class for assistive text, `.focus-visible` styles for keyboard navigation, and `prefers-reduced-motion` fallbacks.
- **Performance:** Adopt CSS logical properties for internationalisation, purge unused classes via build pipeline, and leverage `content-visibility: auto` for long lists.
- **Print Styles:** Create print stylesheet for booking confirmations and compliance reports with simplified layout and brand colours.
