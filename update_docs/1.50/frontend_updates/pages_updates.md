# Pages & Shell Updates – Version 1.50

## Consent Surfaces
- `App.jsx` now renders the global `ConsentBanner` directly beneath the routing shell, ensuring required policies block access until acknowledged.
- `main.jsx` registers the `ConsentProvider` alongside existing providers so downstream routes/components can request consent verification before executing privileged flows.
- Legal content JSON refresh aligns in-app copy with the latest policy versions emitted from the consent ledger service.

## Compliance Portal
- Added the `CompliancePortal` route with hero context, request submission form, filter chips, and actionable cards for exports/status management.
- Leveraged shared typography and card tokens to align with the dark themed compliance workspace and support enterprise screen widths.
- Introduced reusable `StatusBadge` styling with PropTypes validation to keep list views consistent and lint-clean.
- Embedded a Warehouse Operations panel featuring dataset toggles, region selectors, manual trigger drawer, and streaming progress meter so compliance operators can monitor CDC exports without leaving the page.
- Configured optimistic UI updates and toast feedback for manual triggers while polling the backend for run completion, surfacing download links and retention countdowns inline with the run list.
- Added contextual documentation footers linking to DPIA resources and warehouse runbooks, providing just-in-time guidance for operations and legal stakeholders.
- Introduced compliance workload snapshot metrics with refresh controls, backlog/overdue KPI tiles, percentile completion messaging, and a due-date column alongside SLA badges for each request row.
- Wired advanced filter form inputs (region, request type, date range, subject email) to both request listings and metrics refresh flows, ensuring the dashboard reflects the same subset operators are triaging.
- Added loading/empty/error states for the metrics cards and ensured screen reader announcements cover refresh progress so accessibility conformance holds for the new telemetry section.

## Finance Overview
- Rebuilt the escalation panel with grouped alert ribbons that highlight breach severity, upstream webhook retries, and last fan-out targets, matching the backend escalation feed.
- Added acknowledgement controls, responder assignments, and retry countdown timers tied to `/api/finance/alerts` metadata so finance leads can coordinate Slack/Opsgenie follow-ups without leaving the page.
- Memoised chart/tile derivations and introduced manual refresh plus auto-polling fallback states to protect render performance while keeping alerts current in long-lived dashboard sessions.
