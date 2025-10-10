# Styling Guidelines

## Layout & Spacing
- 12-column grid on desktop (min width 1200px) with 24px gutters and 64px outer margins; collapse to 8-column grid with 16px gutters on tablet and 4-column 12px gutters on mobile.
- Base spacing unit **8px**; vertical rhythm uses multiples of 24px for section separation. Provide responsive spacing tokens (`space-1`…`space-8`).
- Sticky regions: top nav (64px height), sub-nav (48px), filter bar (56px). Ensure box shadows differentiate stacked layers.

## Surfaces & Elevation
- Elevation scale: `level-0` (flat surfaces), `level-1` (cards, nav drawers), `level-2` (modals, context panels), `level-3` (full-screen overlays). Each level pairs with consistent shadow tokens in CSS/SCSS.
- Card radius 12px, modal radius 16px, pill radius 999px for chips. Border weight 1px default, 2px for focus states.

## Motion & Feedback
- Motion duration 150ms (micro), 250ms (standard), 400ms (complex). Use easing: `cubic-bezier(0.4, 0, 0.2, 1)` for entrance, `cubic-bezier(0.2, 0, 0, 1)` for exit.
- Provide reduced-motion alternative by disabling parallax, scaling, and gradient animations when `prefers-reduced-motion` is true.
- Hover: 2% scale and 8dp shadow for interactive cards; focus: 2px outline (#1ABC9C) offset by 2px. Active states darken backgrounds by 6%.

## Imagery & Iconography
- Hero imagery uses gradient overlays to ensure contrast with white text (#FFFFFF, 90% opacity). Icons align to 24px grid; use filled icons for primary actions, outlined for secondary.
- Use compliance and safety icons from vector library; ensure `aria-hidden=false` for icons conveying meaning.

## Accessibility
- Minimum contrast ratio 4.5:1 for text, 3:1 for large type and essential icons.
- Provide keyboard focus order matching visual layout; ensure trap-free modals with skip links.
- Tooltips appear on hover/focus and remain accessible on keyboard (triggered by focus, dismissed with ESC).
