# Dashboard Information Architecture — Web Application v1.00

## Module Placement (Desktop)
| Column Span | Module | Description |
| --- | --- | --- |
| 1–8 | Primary metrics area | KPI cards, charts, maps |
| 9–12 | Secondary column | Activity feed, tasks, alerts |
| Full width | Announcement bar | System notices, release notes |

## Content Prioritisation
1. **Summary Snapshot** — Top row (metrics, next actions) to deliver situational awareness within 5 seconds.
2. **Work Queue** — Task/alert modules to highlight required actions.
3. **Performance Trends** — Charts and analytics for deeper analysis.
4. **Support & Resources** — Knowledge links, contact quick actions.

## Widget Groupings
- Group widgets by persona: Consumer (Bookings, Recommendations, Support), Provider (Jobs, Earnings, Compliance), Admin (Zones, Providers, Incidents).
- Each grouping separated by section header with `heading-sm` and description text.

## Navigation & Filters
- Global filter bar (span full width) includes zone selector (dropdown width 240px), date range picker (320px), role switcher (segmented control 3 buttons 120px each).
- Sticky to top when scrolling beyond 120px.
- Provide "Reset filters" ghost button.

## Responsiveness
- Tablet: modules reflow to 2 columns (span 4 each). Activity feed drops below metrics.
- Mobile: stack modules, convert chart legends to dropdown above chart.

## Personalisation
- Allow users to pin modules (star icon). Pinned modules appear top of stack and persisted via `PATCH /dashboard/preferences`.
- Provide default layout per persona; restore defaults button resets order.

## Accessibility
- Section headings use `<h2>` for top-level modules, `<h3>` for nested content.
- Keyboard reordering via "Move up/down" buttons when focus on module (use `aria-grabbed`).
- Provide region landmarks (`role="region" aria-labelledby="module-..."`).

## Data Refresh Strategy
- Soft refresh indicator on modules older than 5 minutes (pill `Data refreshed 6m ago`).
- Manual refresh icon (24px) per module with tooltip.
- Auto-refresh intervals: metrics 60s, charts 120s, activity feed 30s.

## Error & Empty States
- Empty state cards with illustration 120px, message, CTA to action (e.g., "Create your first campaign").
- Error modules show inline error with retry button and knowledge base link.

## Integration Points
- Dashboard layout stored in `user_preferences` table; API returns `modules: [{ id, span, order }]`.
- Module definitions stored in configuration file `dashboard-modules.json` consumed by front-end to render dynamic modules.
