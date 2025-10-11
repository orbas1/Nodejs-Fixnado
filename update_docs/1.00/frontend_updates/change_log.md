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
