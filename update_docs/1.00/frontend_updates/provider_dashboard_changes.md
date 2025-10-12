# Provider Dashboard Changes — Version 1.00

## 2025-10-23 — Operational Dashboard & Navigation Alignment
- `frontend-reactjs/src/pages/ProviderDashboard.jsx` now hydrates headline KPIs, weekly revenue trend, inventory health, campaign performance, compliance queues, and fraud alerts sourced from `/api/provider/dashboard`. Skeleton loaders, aria-live error banners, and token-aware messaging guard the experience when auth tokens are missing (`fx-auth-token`).
- Metric tiles (`MetricTile`), `TrendChart`, and `AnalyticsWidget` components render revenue, SLA breach, deposit exposure, and marketing insights using production number/date formatting with deterministic layout tokens matching `dashboard_drawings.md`.
- The dashboard actions rail links to business fronts (`/providers/metro-power-services`), communications workspace, inventory ledger, and campaign manager, aligning with navigation flows in `menu_drawings.md` and enabling cross-squad QA selectors (`data-qa="provider-dashboard-*"`).
- Documentation updates (change log, task tracker, design artefacts) capture telemetry IDs, localisation/accessibility notes, and pending follow-ups for Subtask 4.5 audits and Flutter parity instrumentation.

## 2025-10-25 — Cache-Aware KPI & Pipeline Remediation
- `ProviderDashboard.jsx` now consumes the rebuilt `panelClient.js`, leveraging abortable fetches, TTL-governed cache layers, and schema normalisers so SLA/utilisation metrics, revenue summaries, upcoming bookings, and compliance watchlists remain available during API outages.
- Added refresh controls, fallback banners, and cached snapshot messaging to inform operations when live metrics cannot be retrieved while preserving the most recent data set for decision-making.
- Expanded QA selectors (`data-qa="provider-dashboard-metric-*"`, `provider-dashboard-alert-*`, `provider-dashboard-compliance-*`) and aria-live usage to support accessibility/localisation sweeps scheduled under Task 4.5.

## 2025-10-27 — Localised KPI & Accessibility Enhancements
- Adopted translation namespaces for KPI tiles, compliance alerts, and concierge messaging so `ProviderDashboard.jsx` renders Spanish copy with Intl number/date formatting while preserving cached snapshot metadata.
- Added aria-live refresh toasts (`data-qa="locale-toast"`) and pseudo-locale stress instructions to ensure cached metrics announce when live data is unavailable, aligning with `dashboard_drawings.md` accessibility notes.
- Integrated skip-navigation anchor targeting the dashboard content region and ensured focus restoration after locale toggles, matching `website_drawings.md` and `menu_drawings.md` flows.
- Recorded QA selectors for language picker, skip link, and translated alerts plus analytics instrumentation (`ui.locale.change`, `panel.metrics.loaded`) inside update trackers to evidence Task 4.5 completion.
