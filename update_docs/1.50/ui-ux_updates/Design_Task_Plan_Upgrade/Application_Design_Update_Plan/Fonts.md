# Typography System

## Font Families
- **Primary UI font:** Inter (weights 400, 500, 600) for body copy, labels, buttons, and small headings.
- **Secondary display font:** Manrope (weights 600, 700) for large headings, KPI metrics, and hero text.
- **Monospace:** JetBrains Mono 500 for code snippets, transaction IDs, and logs within support tools.
- Fallback stack: `"Inter", "Manrope", "Helvetica Neue", "Helvetica", "Arial", sans-serif` to ensure consistency across platforms.

## Type Scale
| Token | Size | Line Height | Usage |
| --- | --- | --- | --- |
| `font.display.lg` | 32px | 40px | Hero banners, celebratory states |
| `font.heading.md` | 24px | 32px | Screen titles, primary section headers |
| `font.heading.sm` | 20px | 28px | Card titles, modal headings |
| `font.body.lg` | 18px | 26px | High-emphasis content blocks |
| `font.body.md` | 16px | 24px | Standard body text |
| `font.body.sm` | 14px | 20px | Secondary copy, helper text |
| `font.caption` | 12px | 16px | Labels, timestamps, chart axes |

## Usage Guidelines
- Limit uppercase text to buttons and metadata; use sentence case for headings for readability.
- Maintain consistent letter spacing: 0 for body, 0.2px for uppercase labels, -0.2px for large display text.
- Ensure at least 24px line height for paragraphs to improve legibility on mobile screens.

## Accessibility
- Support dynamic type scaling up to 130%; ensure layout reflows gracefully and truncation occurs with ellipsis + tooltip if necessary.
- Provide high contrast between text and backgrounds; verify with design tokens defined in `Colours.md`.
- Screen reader semantics should reflect visual hierarchy (e.g., `h1` for screen title, `h2` for section headings).

## Localization Considerations
- Test with extended characters (é, ñ, ö), right-to-left scripts, and long German strings.
- When localised fonts required, ensure fallback fonts maintain similar metrics to avoid layout shifts.
