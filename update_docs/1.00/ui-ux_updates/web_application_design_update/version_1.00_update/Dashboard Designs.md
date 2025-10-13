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

## Analytics Pipeline Control Widgets (2025-10-28)
- **Control Card:** Status chip (Active/Paused/Degraded) sits above backlog metric, oldest pending timestamp, and next retry countdown. Quick actions `Pause`/`Resume` open modal described in `Screens_Update.md`. Card uses alert palette background + border tokens and includes `data-qa="analytics-control-status"` for automation.
- **Run History Table:** 4-column span table with sticky header, zebra rows, and inline alert for failed runs. Columns: Start, Duration, Processed/Purged counts, Status pill, Failure streak, Triggered by, Ticket. Row click opens detail drawer containing response snapshot and escalation CTAs.
- **Toggle Audit Feed & Telemetry Widgets:** Right rail houses audit feed list (avatar, ticket badge, summary, timestamp), backlog sparkline (12-hour lookback), and failure streak gauge. Widgets provide tooltip definitions, accessible text, and link to ops runbook `OPS-AN-07`. Read-only variant displays disabled controls + banner when Secrets Manager toggle absent.

## Persona Analytics Dashboard Tiles & Export (2025-10-29)
- **Overview KPI Row:** Four KPI cards sized 280×168 per persona; includes metric value, delta chip, timeframe label, and tooltip describing calculation + escalation guidance. Admin emphasises SLA breach %, provider surfaces revenue + invoice backlog, serviceman shows active assignments + travel time, enterprise highlights spend variance + contract renewal status.
- **Pipeline Widgets:** Two 4-column modules track workload pipelines (bookings awaiting assignment, inspections due) and operational backlog (support tickets, disputes). Each widget lists top five items with CTA `View all` linking to relevant workspace; uses severity badges and `data-qa="dashboard-queue"` selectors.
- **Fraud/Compliance Rail:** Right column stacks cards for fraud alerts, compliance actions, and communications backlog. Cards surface counts, trend arrows, and CTA buttons; colours follow analytics palette (amber warning, red critical, teal info).
- **Export Toolbar:** Sticky toolbar above grid shows persona avatar, reporting window pill, timezone tag, refresh ghost button, and `Download CSV` primary button. Export button displays spinner + success toast anchor; keyboard hint `Shift+E` displayed for power users.
- **Export Metadata (2025-10-30):** Toolbar copy now references configured row limit (e.g., "Up to 5,000 rows per export"), displays "Last refreshed" timestamp tied to API response, and surfaces timezone abbreviation. Success toast includes filename + row count; error toast references analytics ops channel. QA note: ensure Vitest reporter swap removes spinner noise when testing export CTA states.
- **Offline/Empty States:** Offline banner spans width with icon, copy, retry CTA, and support link; uses `role="alert"`. Empty states feature illustration + persona copy (“All SLA commitments met — great work!”) with CTA to view runbooks or schedule exports.
- **Responsive Behaviour:** 12-column desktop grid collapses to 8-column (tablet) and single column (mobile). Export toolbar remains sticky with drop shadow when scrolled. Queue tables convert to stacked cards on ≤640px with horizontal scroll for metrics.

## Analytics Governance Catalogue Panel (2025-11-05)
- **Summary Card Layout:** Occupies 4 columns × 2 rows on admin dashboard. Top row includes title “Analytics Governance”, version tag (badge with monospace text), and status pill (Healthy/Pending approvals/Blocked). Second row displays last publish timestamp, next rehearsal date, and inline links `Open portal`, `Download markdown`, `OPS-AN-15 runbook`.
- **Approval Checklist:** Right column rail lists required approvers (Compliance, Legal, Data Steward) with avatar chips, status icon, and SLA countdown. Completed approvals collapse into accordion “Recent publishes” with actor + timestamp; pending items expose CTA `Nudge owner` which triggers modal prefilled with Slack channel + template copy.
- **Publish Controls:** Inline toolbar features `Preview markdown` ghost button and `Publish update` primary CTA (hotkeys `Shift+O`, `Shift+P`). Disabled state occurs when approvals stale or job running; tooltip clarifies reason and references telemetry event IDs. Error banner slot appears beneath controls for portal outages with fallback CTA `Send fallback to Slack` and link to generated markdown download.
- **Telemetry/QA Hooks:** All interactions emit governed events `analytics.catalogue.preview`, `analytics.catalogue.publish`, `analytics.catalogue.fallback` with payload metadata (actorId, previousVersion, targetVersion, transport). Panel exposes selectors `data-qa="catalogue-status-pill"`, `data-qa="catalogue-publish"`, `data-qa="catalogue-approval-list"`, `data-qa="catalogue-fallback"` plus aria-live region describing approval changes and publish outcomes for accessibility automation.
- **Responsive & Mobile Notes:** Tablet view stacks card above controls, rail becomes accordion; mobile reduces to read-only summary card with status pill, version, last publish time, and CTA to open runbook. Publish actions hidden on mobile with helper text “Use desktop to publish governed updates”.
