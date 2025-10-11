# Telemetry Dashboard Enablement — Version 1.00

## Overview
The telemetry dashboard operationalises the UI preference ingestion work delivered on 2 Feb by pairing the backend summary endpoint with a production-ready admin console at `/admin/telemetry`. The page aligns with dashboard drawings in `web_application_design_update/version_1.00_update/Dashboard Designs.md` and mirrors operations copy and tone captured in `Screen_text.md` and `Design_Change_log.md`. It provides design, product, and data engineering teams a governed, zero-config way to monitor adoption ahead of the Looker deployment.

## Objectives
- **Surface governed telemetry metrics:** expose total events, leading theme share, density preferences, and marketing variant adoption using the aggregated API response.
- **Operationalise freshness SLAs:** warn administrators when no events land for 120 minutes and surface next-refresh timing so incidents can be triaged.
- **Accelerate analytics hand-off:** ship CSV export, deterministic selectors, and sample dataset tooling to unblock QA, Looker backfill, and automated regression coverage.

## Experience Summary
- **Header & Navigation:** Added a telemetry action to the admin dashboard header and created a dedicated PageHeader with breadcrumbs, runbook shortcut, and metadata summarising the current aggregation window and latest event timestamp.
- **Range Controls:** Segmented control toggles `1d`, `7d`, and `30d` windows. Under the hood a new `useTelemetrySummary` hook manages fetch lifecycles, auto-refresh, visibility handling, and error states.
- **KPI Cards:** Three cards report event volume, leading theme (with comparison delta vs. runner-up), and freshness status. Status pills follow the component system defined in `component_catalogue_expansion.md`.
- **Trend Visualisation:** `TrendChart` renders smoothed totals per day with CSV export for data engineering. Tooltip, axis, and skeleton treatments reuse the analytics widget catalogue.
- **Breakdown Panels:** Theme, density, and marketing variant modules show counts and percentage share with gradient progress bars tied to theme token colours from `theme_personalisation_toolkit.md`.
- **Operations Summary:** A final card translates API fields into statements operations can use during incident response, reinforcing runbook guidance.

## Data & Instrumentation
- Fetches `GET /api/telemetry/ui-preferences/summary` with optional tenant filtering (ready for multi-tenant follow-on work).
- Auto-refresh interval set to five minutes, pausing when the document is hidden to minimise unnecessary load.
- CSV export emits range metadata, totals, and theme counts for Looker backfill validation.
- Non-production builds expose a sample dataset loader to let designers/QA evaluate layouts without live data.
- `data-qa` attributes cover range controls, summary cards, chart, and breakdown lists. QA scenario recorded in `docs/design/handoff/ui-qa-scenarios.csv`.

## Accessibility & Compliance
- Segmented control and export buttons reuse accessible UI primitives. Spinner conveys live updates with `aria-label` messaging.
- Staleness copy clarifies when action is required and mirrors compliance tone from `Screen_text.md`.
- CSV export button includes keyboard focus styles and ARIA labelling inherited from the button component.

## Next Steps
1. ✅ Connect Looker dashboards to the `ui_preference_telemetry_snapshot` table and rehearse Slack alert flow with analytics/ops ahead of the 12 Feb review — `/api/telemetry/ui-preferences/snapshots` now exposes governed pagination for ingestion, and rehearsal checklist updated in QA scenarios.
2. Extend the dashboard with tenant filtering once multi-tenant analytics launches (Version 1.01).
3. Capture Chromatic baselines for the telemetry screen alongside Theme Studio (including alert banners) to enable automated visual regression.
