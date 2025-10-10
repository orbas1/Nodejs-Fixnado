# Typography — Web Application v1.00

## Font Stack
- Primary: `Manrope`, fallback `"Segoe UI", "Helvetica Neue", sans-serif` for headings and CTAs.
- Body: `Inter`, fallback `"Helvetica Neue", Arial, sans-serif`.
- Numeric: `IBM Plex Mono` for tables and analytics.

## Type Scale (Desktop)
| Token | Font | Size/Line | Usage |
| --- | --- | --- | --- |
| `display-xl` | Manrope 700 | 48 / 60 | Landing hero |
| `display-lg` | Manrope 600 | 40 / 52 | Section intros |
| `heading-xl` | Manrope 600 | 32 / 40 | Page titles |
| `heading-lg` | Manrope 600 | 28 / 36 | Card headers |
| `heading-md` | Manrope 600 | 24 / 32 | Section headings |
| `heading-sm` | Manrope 600 | 20 / 28 | Table titles |
| `body-lg` | Inter 400 | 18 / 28 | Body paragraphs |
| `body-md` | Inter 400 | 16 / 24 | Standard text |
| `body-sm` | Inter 400 | 14 / 22 | Captions, table cell text |
| `overline` | Inter 600 | 12 / 16 | Overlines, badge labels |
| `numeric-lg` | IBM Plex Mono 600 | 32 / 40 | Dashboard metrics |
| `numeric-md` | IBM Plex Mono 500 | 18 / 24 | Table numbers |

## Responsive Adjustments
- Tablet: reduce headings by 2px, maintain line height.
- Mobile: limit headings to 28px max; use `body-md` 16/24 for paragraphs.

## Implementation
- Define CSS custom properties for each token (e.g., `--font-heading-lg-size`).
- Use `clamp()` for responsive scaling where appropriate.
- Ensure `font-feature-settings: 'tnum'` on numeric text for alignment.

## Accessibility
- Maintain minimum 16px text except legal footnotes (14px). Avoid text set below 12px.
- Provide high contrast between text and background as defined in `Colours.md`.
