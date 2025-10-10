# Responsive Breakpoint Behaviour — Web Application v1.00

## Breakpoint Definitions
- **XL (≥1440px)**: Desktop wide monitors. Full navigation, 12-column grid, sidebar expanded.
- **LG (1280–1439px)**: Standard desktop. Sidebar collapsible, gutters reduce to 20px.
- **MD (1024–1279px)**: Small desktop/tablet landscape. Sidebar collapses to icon rail (88px), map/list splits vertical.
- **SM (768–1023px)**: Tablet portrait. Navigation via hamburger drawer, 8-column grid.
- **XS (480–767px)**: Large mobile. 4-column grid, bottom nav introduced.
- **XXS (<480px)**: Small mobile. Single column, condensed typography.

## Header Adjustments
- Height transitions: 72px (XL/LG), 64px (MD/SM), 56px (XS/XXS).
- Logo reduces from 160px width to 120px at SM, 96px at XS.
- Search condenses to icon button at XS triggering full-screen search modal.

## Sidebar & Navigation
- <1280px: Sidebar collapses; show toggle icon top-left.
- <1024px: Sidebar hidden; hamburger opens drawer width 320px.
- <768px: Drawer full width with `safe-area` padding bottom 24px; include close button 24px.

## Grid & Cards
- Cards adapt from 4 per row (XL) to 3 (LG), 2 (MD/SM), 1 (XS/XXS).
- KPI tiles reduce height from 160px to 140px at SM, 128px at XS.
- Tables transform into card stacks at XS, showing key fields with expand/collapse for more details.

## Typography Scaling
- Use `clamp()` functions: e.g., hero heading `clamp(32px, 4vw + 16px, 48px)`.
- Body text remains 16px until XS where `clamp(15px, 3vw, 16px)` to maintain readability.

## Map & Chart Resizing
- Explorer map height `calc(100vh - header)` (min 480px). On SM, map reduces to 50vh and stacks above list.
- Charts re-render with smaller padding and hide gridlines on XS to reduce clutter.

## Forms & Modals
- Form columns collapse to single column at SM.
- Modals full-screen at XS/XXS; show close icon top-left plus sticky action bar bottom.

## Performance Considerations
- Lazy-load heavy assets on XS using `IntersectionObserver` (e.g., hero Lottie animations disabled below 768px).
- Reduce parallax effects on XS/XXS to conserve CPU.

## Testing Plan
- Validate breakpoints on Chrome devtools responsive, Safari iPad, Firefox mobile.
- Run automated visual regression for each breakpoint in Chromatic.
