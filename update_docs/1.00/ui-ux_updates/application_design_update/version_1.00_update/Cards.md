# Card System Specifications — Phone Application v1.00

## Global Rules
- Corner radius 20dp for elevated cards, 16dp for flat list tiles.
- Default padding 16dp vertical, 20dp horizontal unless stated.
- Use `Material` widget with elevation tokens defined in `Screen_update_Screen_colours.md`.

## Card Types
### Provider Card
- Size 328×168dp.
- Layout: hero image left 96×96dp, content column right with name (`Manrope 18/26`), rating row, badges row, description snippet `Inter 14/20` 2 lines max.
- CTA row bottom: two buttons 128×44dp each with 12dp spacing.
- Bookmark icon top-right 28dp circle.

### Metric Card
- Size 160×140dp, used for KPIs.
- Contains icon 24dp top-left, metric value `IBM Plex Mono 24/28`, label `Inter 13/18`.
- Optional sparkline overlay 112×32dp using accent colour.

### Alert Card
- Width 328dp, height 112dp.
- Left accent bar 6dp width. Title `Manrope 16/24` bold, body `Inter 14/20`.
- Action chip right aligned (ghost style) for quick resolve.

### List Tile Card
- Height 88dp.
- Icon 32dp, title `Manrope 16/24`, subtitle `Inter 14/20`, trailing chevron 24dp.
- Dividers 1dp `rgba(17,24,39,0.08)` between tiles.

### Document Tile
- Grid card 160×200dp.
- Contains file icon 48dp, filename `Inter 14/20`, status pill bottom.
- Upload progress overlay with 4dp rounded progress bar at bottom.

### Campaign Card
- 160×216dp (grid) or 328×200dp (list).
- Background image with overlay gradient. Title `Manrope 18/26` white, price `Inter 16/24` white.
- CTA pill 120×36dp bottom-right.

### Compliance Task Card
- Width 328dp, height 144dp.
- Layout: icon circle 40dp left, content column with title `Manrope 16/24`, due date `Inter 14/20`, description `Inter 13/18`.
- Progress bar 320×6dp bottom, status pill top-right.
- Upload button ghost style 120×40dp aligned right within content row.

### Chat Attachment Card
- 240×120dp inline bubble for documents. Contains file icon 32dp, filename `Inter 14/20`, size `Inter 12/16`.
- Background `#EEF3FF`, radius 18dp. Tapping opens preview.

### Error Recovery Card
- 328×140dp with illustration 80×80dp left, text right.
- Used on failure screens to provide troubleshooting steps (ordered list `Inter 14/20`).
- Primary button 144×48dp bottom-right.

## States
- Hover (dev preview) lighten background 4%.
- Pressed reduces elevation by 4dp and scales 0.98.
- Disabled: reduce opacity 40%, overlay `rgba(255,255,255,0.6)`.

## Accessibility
- Provide semantics `button` when card is fully clickable; else ensure CTA buttons accessible.
- Maintain 48dp min interactive area within card (CTA region).

## Implementation Notes
- Use `FixnadoCardTheme` to apply consistent shadows, radius, padding.
- For hero images, use `ClipRRect` radius 16dp.
- Provide `isLoading` state showing skeleton placeholders (image block, text bars) with shimmer defined earlier.
- Ensure cards expose `analyticsId` property for instrumentation. Default pattern: `{screen}_{cardType}_{index}`.
- Use `AnimatedSwitcher` for state transitions (e.g., compliance card from pending → submitted) to provide smooth updates.
