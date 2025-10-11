# Dashboard Design Specification — Web Application v1.00

## Dashboard Variants
1. **Consumer Dashboard** (Route `/dashboard/user`)
   - Hero summary 320px tall: shows upcoming booking, quick actions (Request coverage, View providers).
   - KPI row: 4 cards (Active bookings, Upcoming visits, Saved zones, Support tickets).
   - Activity feed: right column (span 4) list items 88px height with icons.
   - Quick booking widget: 3-step inline form.
2. **Provider Dashboard** (Route `/dashboard/provider`)
   - Earnings summary tile (span 8) with chart overlay.
   - Task queue (span 4) for job statuses, Kanban preview.
   - Compliance radar chart (span 4) plus document renewal list.
   - Zone coverage heatmap (span 8) with sparkline.
   - Inventory health module (span 4) aggregating on-hand vs reserved stock and surfacing low-stock CTA linking to ledger table.
   - Rental SLA tracker (span 4) showing pickup/return countdown chips referencing rental checkpoints.
3. **Admin Dashboard** (Route `/admin`)
   - Global metrics row (Bookings today, SLA compliance, Active zones, Open disputes).
   - Multi-tab analytics for zone health, provider performance, incidents.
   - Escalation list with severity badges.
   - Marketplace alert rail (span 4) aggregating fraud, overspend, and low-stock escalations with quick actions to resolve.
   - Campaign pacing board (span 8) showing spend vs budget, impressions, CTR, and predicted exhaustion date with highlight badges.

## Layout Grid
- Desktop: 12-column grid, margin 96px, gutter 24px.
- Tablet: 8-column grid, margin 64px, gutter 20px.
- Mobile: single column, margin 16px, stack modules vertically.

## Widgets & Dimensions
| Widget | Size (Desktop) | Notes |
| --- | --- | --- |
| KPI Card | 280×160px | Contains icon (32px), metric (32/40), label (14/22), optional trend chip |
| Chart Panel | 2×4 columns, height 320px | Use ECharts line/bar combos, legend top-right |
| Activity Feed | 4 columns, height flexible | Items include avatar 48px, text 14/20 |
| Task Kanban Preview | 4 columns, height 360px | Horizontal scroll columns width 220px |
| Compliance Checklist | 4 columns, height 320px | List of items with progress ring 64px |
| Inventory Health Tile | 2 columns, height 220px | Donut chart splitting On-hand/Reserved/In repair, includes CTA `Open ledger` |
| Rental SLA Tracker | 2 columns, height 220px | Timeline chips for next pickups/returns with SLA indicator (green/orange/red) |
| Campaign Pacing Board | 4 columns, height 340px | Combo chart spend vs budget, table of creatives with fraud score pill |

## Interactions
- Widgets draggable for admin persona (persist order via API `PATCH /dashboard/layout`).
- KPI cards clickable to deep links with analytics events `dashboard_kpi_clicked`.
- Charts support brushing (range selection) and tooltips triggered on hover or keyboard (arrow keys cycle data points).
- Activity feed items open drawers with details.
- Inventory tile shows inline alerts when `reserved/onHand` ratio > 0.6; clicking alert opens filtered ledger view in modal (width 960px).
- Campaign pacing board allows inline budget adjustments; editing reveals side panel (span 3) with form fields and `Update budget` CTA that posts to `/campaigns/:id/budget`.

## Theming
- Use light surface for widgets; dark mode switches to `#0F172A` with border highlight `rgba(148,163,184,0.24)`.
- Background gradient `linear-gradient(180deg, rgba(245,247,251,1) 0%, rgba(255,255,255,1) 40%)`.

## Accessibility
- Ensure charts include data table toggle for screen readers (button labelled "View data table").
- Provide summary text for KPIs ("You have 3 active bookings").
- All drag-and-drop actions have keyboard equivalent (use arrow keys with `space` to pick up widget).
- Data tables for campaigns include row-level aria labels summarising spend, pace, and fraud score to support screen reader monitoring.

## Data Sources
- KPIs from GraphQL `dashboardMetrics(role)`.
- Charts from analytics service with caching (SWR). Refresh intervals 60s.
- Activity feed from `/activities?role=` endpoint; includes pagination.
- Inventory module consumes `/inventory/health` (aggregates, low-stock list) and `/rental/agreements/upcoming` for SLA chips.
- Campaign board pulls `/campaigns/:id/pacing` plus `/campaigns/:id/fraud-insights` to display anomaly badges.

## Performance
- Lazy-load charts; show skeleton placeholder 320px height.
- Virtualise activity feed beyond 30 items using `react-window`.
- Debounce filter controls 300ms to avoid re-render thrash.
