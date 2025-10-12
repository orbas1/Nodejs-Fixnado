# Frontend Change Log — Version 1.00

## 2025-02-03 — Telemetry Dashboard Operationalisation
- Added `/admin/telemetry` route (`frontend-reactjs/src/App.jsx`) and navigation shortcut from the admin dashboard (`frontend-reactjs/src/pages/AdminDashboard.jsx`).
- Delivered telemetry dashboard UI (`frontend-reactjs/src/pages/TelemetryDashboard.jsx`) with KPI cards, trend chart export, and breakdown panels powered by new telemetry components and `useTelemetrySummary` hook.
- Updated telemetry runbook/QA artefacts alongside deterministic selectors to support automation and operations workflows.

## 2025-02-09 — Theme Telemetry Regression Automation
- Added Vitest/jsdom configuration and setup files to support component-level testing (`vitest.config.js`, `vitest.setup.js`).
- Authored `src/providers/__tests__/ThemeProvider.test.jsx` to assert DOM dataset updates, telemetry beacon fallbacks, and local storage persistence for theme personalisation.
- Updated `package.json`/lockfile to include Testing Library, jsdom, and new test scripts so CI can execute the regression harness.

## 2025-10-21 — Explorer Search & Map Overlays
- Refactored the explorer page (`frontend-reactjs/src/pages/Search.jsx`) to deliver MapLibre-powered zone overlays, demand-aware filters, and analytics-driven result cards consuming `/api/search` and `/api/zones` contracts.
- Introduced explorer component suite (`components/explorer/*`) providing filter shell, map legend, skeleton loading, and zone insight panel plus geometry-aware API client (`src/api/explorerClient.js`) and data utilities (`src/pages/explorerUtils.js`).
- Added Vitest coverage for filtering/bounds logic (`src/pages/__tests__/explorerUtils.test.js`), imported MapLibre CSS, and expanded package dependencies (`maplibre-gl`, `@turf/bbox`, `@turf/helpers`) to support production-ready mapping without Mapbox tokens.

## 2025-10-22 — Communications Workspace Delivery
- Added `/communications` route and navigation entry (`frontend-reactjs/src/App.jsx`) exposing the new communications workspace for admin/provider roles.
- Delivered production-grade communications page (`src/pages/Communications.jsx`) composed of conversation rail, message canvas, AI assist sidebar, quiet-hour banner, and Agora launcher components (`src/components/communications/*`) orchestrated via `communicationsClient.js` with retry/backoff and auth propagation.
- Implemented deterministic tests for `MessageComposer` covering AI assist requests, token usage display, quiet-hour prompts, attachment validation, and keyboard shortcuts, ensuring regressions surface before release.

## 2025-10-23 — Business Fronts & Role Dashboards Integration
- Routed provider and enterprise personas to live dashboards by adding `/provider/dashboard`, `/enterprise/panel`, and `/providers/:slug` entries in `src/App.jsx` alongside a dashboards mega-menu in `components/Header.jsx` that respects accessibility, hover/focus, and click-outside behaviour.
- Hardened panel pages (`src/pages/ProviderDashboard.jsx`, `EnterprisePanel.jsx`) with skeleton states, trend charts, analytics widgets, fraud/follow-up rails, and compliance queues sourced from the new panel APIs, including token-aware error messaging for missing auth (`panelClient.js`).
- Enhanced `src/pages/BusinessFront.jsx` with slug-driven routing, testimonial/service package rendering, operations metrics, and support channel surfacing; fallback data ensures empty states remain production-ready while telemetry/QA selectors document coverage.
- Refreshed update artefacts and QA selectors to capture dashboards navigation, persona breadcrumbs, and localisation/accessibility follow-ups ahead of Subtask 4.5.
- Added Vitest aliases/stubs for Turf helpers (`src/testStubs/turfBbox.js`, `turfHelpers.js`) so geometry utilities remain testable without bundler dependencies, keeping explorer regression suites deterministic in CI.
