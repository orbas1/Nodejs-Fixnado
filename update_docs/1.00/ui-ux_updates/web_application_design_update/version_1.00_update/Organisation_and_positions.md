# Layout Organisation — Web Application v1.00

## Grid & Spacing
- 12-column responsive grid. Desktop margin 96px, gutter 24px. Tablet margin 64px, gutter 20px. Mobile 16px margin, 16px gutter.
- Vertical spacing increments 8px multiples (8, 16, 24, 32, 48, 64).

## Header & Navigation
- Top bar height 72px desktop, 64px tablet, 56px mobile. Contains logo (160px), search (flex), notification and user menu icons (40px buttons).
- Sidebar width 264px; collapses to 88px icon rail <1280px; hidden on mobile replaced by hamburger menu (drawer width 320px).

## Content Regions
- Dashboard uses main area (span 8 columns) + aside (span 4). On tablet, stack with aside below; on mobile, single column.
- Explorer map uses CSS grid `grid-template-columns: 3fr 2fr`. On tablet `1fr` map top, list bottom.
- Marketplace card grid `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`.

## Forms & Panels
- Form width limited to 720px for readability. Use 24px vertical spacing between sections.
- Panel padding 24px desktop, 20px tablet, 16px mobile.
- Sticky action bars height 64px with shadow level 1.

## Modals & Drawers
- Modal alignment centered, max width 960px, min 480px. Provide 32px padding.
- Drawers anchored right, width 420px desktop, 360px tablet, full width mobile.

## Responsive Breakpoints
- `xl`: ≥1440px, `lg`: 1280–1439, `md`: 1024–1279, `sm`: 768–1023, `xs`: <768.
- At `sm`, hide sidebar, convert table to stacked cards.
- At `xs`, convert hero text to center-aligned, reduce font sizes.

## Motion
- Use `transition: 180ms ease-out` for hover/active states.
- Drawer slide `transform: translateX(100%) → 0` over 320ms.
- Map/list transition fade between states 240ms.

## Accessibility & Focus
- Maintain logical tab order: header > sidebar > main > aside.
- Provide skip link top-left (position absolute, show on focus).
- Ensure focus outlines not clipped (use `outline-offset: 4px`).
