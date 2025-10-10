# Card Library — Web Application v1.00

## General
- Border radius 16px, padding 24px desktop (20px tablet, 16px mobile).
- Shadow levels defined in `Colours.md`.
- Use CSS variable `--card-padding` for responsiveness.

## Card Types
### KPI Card
- Width 280px, height 160px. Icon 32px top-left, value `numeric-lg`, label `overline` uppercase.
- Optional trend chip showing +/− value with arrow icon.

### Provider Result Card
- 360×180px. Image left 120×120px, rating badge top-left. Info column includes name `heading-sm`, badges row, description, CTA buttons bottom (primary + ghost).

### Campaign Card
- 280×360px background image with gradient overlay. Title `heading-sm` white, summary text `body-sm` white 70% opacity. CTA button bottom full width.

### Task Card (Kanban)
- 320×140px. Header row with status pill, due date. Body text `body-sm`. Footer with avatars of assignees.

### Alert Card
- 100% width, height 120px. Left border 4px (colour based on severity). Contains icon 32px, title `heading-sm`, body `body-sm`, action button.

### Table Row Card (Mobile)
- For responsive tables: card 100% width, padding 20px, stacks key-value pairs with labels `overline` and values `body-md`.

## States
- Hover: shadow level +1, translateY(-2px).
- Selected: border 2px `#1445E0`.
- Disabled: opacity 0.4.

## Accessibility
- Cards acting as buttons include `role="button"` and keydown handlers for Enter/Space.
- Provide alt text for background imagery via overlay `aria-label` when card clickable.
