# Frontend Change Log — Version 1.00

## 2025-02-03 — Telemetry Dashboard Operationalisation
- Added `/admin/telemetry` route (`frontend-reactjs/src/App.jsx`) and navigation shortcut from the admin dashboard (`frontend-reactjs/src/pages/AdminDashboard.jsx`).
- Delivered telemetry dashboard UI (`frontend-reactjs/src/pages/TelemetryDashboard.jsx`) with KPI cards, trend chart export, and breakdown panels powered by new telemetry components and `useTelemetrySummary` hook.
- Updated telemetry runbook/QA artefacts alongside deterministic selectors to support automation and operations workflows.

## 2025-02-09 — Theme Telemetry Regression Automation
- Added Vitest/jsdom configuration and setup files to support component-level testing (`vitest.config.js`, `vitest.setup.js`).
- Authored `src/providers/__tests__/ThemeProvider.test.jsx` to assert DOM dataset updates, telemetry beacon fallbacks, and local storage persistence for theme personalisation.
- Updated `package.json`/lockfile to include Testing Library, jsdom, and new test scripts so CI can execute the regression harness.

## 2025-10-14 — Telemetry Coverage Gates & CI Hooks
- Tightened Vitest configuration to focus coverage on ThemeProvider, telemetry utilities, and theme tokens with thresholds (lines/statements 80%, functions 85%, branches 50%) mirrored in CI Quality Gates.
- Updated `package.json` test script to run coverage-enabled Vitest and added `@vitest/coverage-v8@^2.1.4`, aligning local developer workflows with CI enforcement.
- CI Quality Gates upload LCOV artefacts for React runs, feeding the rollback playbook and QA compliance evidence chain.
