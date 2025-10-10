# Component Types Catalogue — Web Application v1.00

## Buttons
- **Primary**: Height 52px, padding 16px 28px, radius 12px, gradient `#1445E0 → #1C62F0`, text `Manrope 16/24`.
- **Secondary**: Border 1px `#1445E0`, background `transparent`, hover fill `rgba(20,69,224,0.08)`.
- **Tertiary**: Text-only link style `#1445E0`, underline on hover.
- **Icon Button**: 40×40px, circular, background `rgba(12,18,32,0.08)`.

## Navigation
- **Sidebar Item**: Height 48px, icon 20px left, label `Inter 15/22`. Active state background `rgba(20,69,224,0.12)` with 3px left border.
- **Top Bar Menu**: Buttons 44px height, icon 20px, uses dropdown `Menu` component with shadow `0 12px 36px rgba(12,18,32,0.12)`.
- **Bottom Navigation (mobile)**: Height 64px, icons 24px, label `Inter 12/16`.

## Cards
- **Metric Card**: 280×160px, radius 16px, background white, drop shadow `0 12px 32px rgba(12,18,32,0.08)`. Value `IBM Plex Mono 28/32`.
- **Provider Card**: 360×180px, image 120×120px, includes rating badge, CTA buttons.
- **Campaign Card**: 280×360px, overlay gradient `rgba(12,18,32,0.6)`, CTA button bottom.
- **Task Card**: 320×140px with status pill top-right.

## Tables
- Header row background `#F5F7FB`, text `Manrope 14/20` uppercase, letter spacing 0.08em.
- Row height 72px, zebra striping `rgba(20,69,224,0.04)`.
- Inline actions rendered as icon buttons 32×32px.

## Forms
- Input height 48px, border 1px `#CBD5F5`, focus border `#1445E0` 2px.
- Textarea min height 128px.
- Select dropdown uses custom `Combobox` with search.
- Date picker uses inline calendar with 44px cells.

## Modals & Drawers
- Modal width 480–960px depending on content, radius 16px, shadow `0 24px 64px rgba(12,18,32,0.24)`.
- Drawer width 420px, slides from right with backdrop `rgba(12,18,32,0.4)`.

## Charts
- ECharts theme: background transparent, axis label `#4B5563`, primary line `#1445E0`, secondary `#1BBF92`.
- Tooltip uses card style with drop shadow.

## Map Elements
- Markers 32px with gradient fill. Cluster markers scale 40–64px with numeric overlay.
- Zone polygons 2px stroke, 32% opacity fill (see `Colours.md`).
- Control buttons (zoom, geolocate) 44×44px, radius 12px.

## Feedback
- Toast: 360×56px, background `#111827`, icon 20px.
- Snackbar (mobile) anchored bottom center, 100% width minus 32px margin.
- Inline validation text `Inter 13/18`, colour `#E74C3C`.

## Accessibility
- All interactive elements focusable, outline 3px `#0EA5E9`.
- Provide ARIA roles for tabs, tables, modals.
- Ensure keyboard navigation for drag-and-drop via alternative action menus.
