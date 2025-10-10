# Styling System Guidelines — Web Application v1.00

## Spacing & Sizing
- Base spacing unit: **8px**. Use multiples for margin/padding (8, 12, 16, 20, 24, 32, 40, 48, 64).
- Minimum tap target: **44×44px** on touch devices.
- Border radius scale: `4px` (chips), `8px` (inputs), `12px` (buttons), `16px` (cards), `24px` (modals), `32px` (hero search).
- Layout max width: **1280px** content container for text-heavy pages; map/dashboards stretch full width.

## Layering & Elevation
| Layer | Usage | Elevation | Shadow Token |
| --- | --- | --- | --- |
| 0 | Base page background | none | — |
| 1 | Cards, tiles | 1 | `0 8px 24px rgba(12,18,32,0.08)` |
| 2 | Sticky headers, drawers | 2 | `0 16px 40px rgba(12,18,32,0.12)` |
| 3 | Modals, toasts | 3 | `0 24px 64px rgba(12,18,32,0.18)` |
| 4 | Command palette, lightboxes | 4 | `0 32px 72px rgba(12,18,32,0.22)` + blur 12px |

## Colour Application
- Primary backgrounds use `--color-neutral-050`. Sections differentiate with `--color-neutral-100` overlays at 8%.
- Card surfaces `--color-surface` (#FFFFFF) with subtle gradient overlay `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,247,251,0.96) 100%)` for depth.
- Use accent gradients only for hero, CTA sections, analytics highlight cards. Limit to 3 per page to avoid overload.
- Danger/warning states include 4px left border with token `--color-danger-500` or `--color-warning-500` plus tinted background (`rgba(232,90,90,0.08)`).

## Typography Styling
- Headings uppercase? only for overlines; maintain sentence case for readability.
- Use `font-weight` tokens: headings 600/700, body 400, emphasis 500.
- Line-height ratio 1.25 for headings, 1.5 for body. Use `letter-spacing: 0.2px` for uppercase labels.

## Iconography & Imagery
- Icon size increments: 16, 20, 24, 32, 48, 64px. Stroke icons default 1.75px stroke, filled icons for statuses.
- Photo assets use 16:9 or 4:3 ratios; apply `border-radius: 16px` to match card corners.
- Illustrations align to baseline grid; maximum width 520px on text pages.

## Borders & Dividers
- Default border: `1px solid rgba(15,23,42,0.12)`.
- Focus border: `2px solid #0EA5E9` with `outline-offset: 2px`.
- Section dividers use `height: 1px`, `background: rgba(148,163,184,0.3)`, 100% width.

## Motion Principles
- Duration: 160–320ms depending on context (short for hover, longer for overlays).
- Easing: use `cubic-bezier(0.22, 1, 0.36, 1)` for entrances, `cubic-bezier(0.4, 0, 0.2, 1)` for simple transitions.
- Micro-animations should not displace layout; use opacity/scale rather than positional shifts where possible.

## Responsive Strategy
- Use CSS `clamp()` for typography and spacing where fluid scaling beneficial (`clamp(24px, 2vw, 32px)` for hero heading).
- Define container queries for cards to adjust layout inside grid (3 columns >1120px, 2 columns 768–1120px, 1 column <768px).
- Mobile overlays full screen with slide-up transitions; ensure bottom safe area padding 24px.

## Theming Support
- Dark mode uses tokens: surfaces `#0F172A`, text `#E2E8F0`, borders `rgba(226,232,240,0.16)`. Shadows replaced with layered gradients.
- High-contrast mode toggles to emphasise outlines: border width increases to 2px, remove drop shadows.
- Provide CSS variables for theme toggling and allow per-user overrides stored via `data-theme` attribute.

## Implementation Notes
- Apply styles via `styled-components` using token imports from `@fixnado/design-tokens`.
- Shared mixins defined in `Scss.md` to support legacy SCSS modules.
- Document design decisions in Figma with tokens mirrored in code to ensure parity.
