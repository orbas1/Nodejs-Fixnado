# Web Page Delivery Plan — Version 1.00

## Timeline
| Sprint | Focus | Dependencies | Notes |
| --- | --- | --- | --- |
| 1 | Landing, Explorer, Navigation Shell | Mapbox GL theming, design tokens | Build responsive grid + header/footer |
| 2 | Consumer Dashboard & Bookings | Auth shell, table components | Implement KPI cards, bookings table |
| 3 | Marketplace & Provider Profile | CMS data, imagery | Build card grids, hero sections |
| 4 | Provider Dashboard, Bidding Console | GraphQL analytics endpoints | Develop kanban board, quick actions |
| 5 | Compliance, Settings, Shared Overlays | Document storage, notification APIs | Finalize modals, forms, error states |

## Component Priorities
1. **Layout primitives**: `Grid`, `Stack`, `Sidebar`, `Topbar`.
2. **Data Visuals**: KPI cards, charts, progress rings.
3. **Data Tables**: Sortable headers, inline filters, bulk actions.
4. **Kanban Board**: Drag-and-drop interactions using `@dnd-kit`.
5. **Forms**: Controlled inputs with validation, stepper wizard.

## Asset Delivery
- Hero photography due Sprint 1 Day 4 (Marketing).
- Map overlays + vector tiles from GIS Day 3.
- Icons & illustrations exported Sprint 1 Day 2.
- ECharts theme JSON delivered Sprint 2 Day 1.

## QA Gates
- **Design QA**: Visual diff via Chromatic per page.
- **Accessibility**: Axe + manual keyboard pass each sprint.
- **Performance**: Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95 on desktop.

## Risks & Mitigation
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Mapbox style delays | Explorer blocked | Provide static map fallback images |
| Data table performance | Lag on large datasets | Implement virtualized table using `react-window` |
| Drag-and-drop accessibility | Keyboard support risk | Use `@dnd-kit/accessibility` utilities, provide alternative action menus |

## Success Metrics
- Bounce rate reduction 20% on landing page.
- Booking conversion +8% from web channel.
- Provider daily active usage +15% for dashboard after release.
