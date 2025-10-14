# Typography Guidelines (Web)

## Primary Fonts
- **Manrope** – Headings, navigation, CTA text (weights 600/700).
- **Inter** – Body text, form labels, table content (weights 400/500).
- **JetBrains Mono** – Code snippets, IDs, CLI references.
- Fallback stack: `"Manrope", "Inter", "Helvetica Neue", Arial, sans-serif`.

## Type Scale
| Token | Size | Line Height | Usage |
| --- | --- | --- | --- |
| `display-xl` | 48px | 56px | Marketing hero headlines |
| `display-lg` | 40px | 48px | Dashboard hero titles |
| `heading-md` | 28px | 36px | Section headers |
| `heading-sm` | 22px | 30px | Card titles |
| `body-lg` | 18px | 28px | Lead paragraphs |
| `body-md` | 16px | 24px | Standard copy |
| `body-sm` | 14px | 20px | Secondary text |
| `caption` | 12px | 16px | Metadata, labels |

## Guidelines
- Use sentence case for headings; avoid all caps except in buttons.
- Maintain maximum line width ~72 characters for readability.
- Provide typographic scale adjustments for breakpoints (reduce `display` sizes on tablet/mobile).

## Accessibility
- Minimum body size 16px on desktop, 15px on mobile.
- Ensure heading hierarchy consistent (H1 per page, H2/H3 for sections).
- Support font scaling up to 200%; verify responsive layout handles reflow.
