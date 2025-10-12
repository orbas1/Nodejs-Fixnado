# Provider Dashboard Changes — Version 1.00

## 2025-10-23 — Operational Dashboard & Navigation Alignment
- `frontend-reactjs/src/pages/ProviderDashboard.jsx` now hydrates headline KPIs, weekly revenue trend, inventory health, campaign performance, compliance queues, and fraud alerts sourced from `/api/provider/dashboard`. Skeleton loaders, aria-live error banners, and token-aware messaging guard the experience when auth tokens are missing (`fx-auth-token`).
- Metric tiles (`MetricTile`), `TrendChart`, and `AnalyticsWidget` components render revenue, SLA breach, deposit exposure, and marketing insights using production number/date formatting with deterministic layout tokens matching `dashboard_drawings.md`.
- The dashboard actions rail links to business fronts (`/providers/metro-power-services`), communications workspace, inventory ledger, and campaign manager, aligning with navigation flows in `menu_drawings.md` and enabling cross-squad QA selectors (`data-qa="provider-dashboard-*"`).
- Documentation updates (change log, task tracker, design artefacts) capture telemetry IDs, localisation/accessibility notes, and pending follow-ups for Subtask 4.5 audits and Flutter parity instrumentation.
