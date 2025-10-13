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

## 2025-10-25 — Panel Fetch Hardening & Build Fix
- Replaced the stubbed panel fetcher with a cache-aware client (`src/api/panelClient.js`) providing abortable requests, TTL-governed sessionStorage persistence, and schema normalisers that guarantee dashboards/business fronts render even when the API is offline.
- Reimplemented provider and enterprise dashboards (`src/pages/ProviderDashboard.jsx`, `EnterprisePanel.jsx`) with production-grade KPI tiles, revenue and incident summaries, refresh controls, and error banners that surface cached snapshots when live requests fail.
- Rebuilt `src/pages/BusinessFront.jsx` to unblock `/providers` builds, adding hero storytelling, curated packages, testimonials, compliance badges, concierge contacts, and CTA wiring with slug-aware fetch + cache fallback behaviour.
- Updated documentation and QA selectors to highlight the regression fix and cache strategy so Subtask 4.5 accessibility/localisation sweeps can validate new banners, skeletons, and aria-live patterns.

## 2025-10-27 — Accessibility, Localisation & Panel Performance Sweep
- Introduced `LocaleProvider` context (`src/providers/LocaleProvider.jsx`), persisted preference hook (`src/hooks/useLocale.js`), and translation catalogues under `src/i18n/*` that update `<html lang>`/`dir`, expose analytics instrumentation, and hydrate Suspense fallbacks across routes.
- Refined navigation, dashboards, and business fronts to consume localisation helpers: `components/Header.jsx` now surfaces bilingual language selector + skip-link focus handling, `components/Footer.jsx` renders translated compliance/support columns, and `components/accessibility/SkipToContent.jsx` exposes a visible focus state per WCAG guidance.
- Updated provider/enterprise dashboards and business fronts (`src/pages/ProviderDashboard.jsx`, `EnterprisePanel.jsx`, `BusinessFront.jsx`) to translate copy decks, announce cache refreshes via aria-live toasts, and share Intl number/date formatting so cached snapshots remain comprehensible in Spanish.
- Refreshed `src/App.jsx` Suspense boundaries and skip-link targets, added QA selectors (`data-qa="language-picker"`, `data-qa="skip-nav"`, `data-qa="locale-toast"`), and documented pseudo-locale stress process across trackers to keep Task 4.5 accessibility/localisation sign-off auditable.

## 2025-10-29 — Persona Analytics Dashboard Integration
- Replaced stubbed persona dashboards with live analytics hydration in `src/pages/RoleDashboard.jsx`. The page now fetches `/api/analytics/dashboards/:persona`, manages timezone-aware query params, handles loading/error states, exposes refresh/export actions, and passes dynamic navigation data into updated dashboard components.
- Added `src/api/analyticsDashboardClient.js` for fetch helpers, export URL builders, and retry logic while restructuring `components/dashboard/DashboardLayout.jsx` with search, persona switcher, skeletons, error handling, refresh/export controls, and telemetry-friendly metadata. `src/constants/dashboardConfig.js` now carries persona descriptors only, deferring data to the API.
- Surfaced CSV export CTA and refresh controls with aria-live announcements, skeleton loaders, and offline fallbacks; Vitest coverage (`src/pages/__tests__/RoleDashboard.test.jsx`) asserts data formatting, error messaging, and export URL wiring so analytics parity remains regression-safe.

## 2025-10-30 — Persona Dashboard Verification & QA Follow-Up
- Exercised `RoleDashboard.jsx` against staging analytics payloads to confirm timezone query handling, retry flows, skeleton/empty states, and CSV CTA alignment with export governance; refreshed dashboard layout copy to surface export limits and last-refresh metadata for operators.【F:frontend-reactjs/src/pages/RoleDashboard.jsx†L1-L78】
- Validated `analyticsDashboardClient.js` query composition and CSV download helper by running Vitest suites with `CI=1` reporters, ensuring filename parsing and error propagation behave predictably ahead of Looker ingestion rehearsal.【F:frontend-reactjs/src/api/analyticsDashboardClient.js†L1-L39】【152a08†L1-L10】
- Documented QA backlog item to enforce non-interactive Vitest reporters in package scripts after spinner overflow cluttered manual test logs during verification runs.【152a08†L1-L10】

## 2025-10-31 — Persona Dashboard Feature Toggle Gating
- Implemented Secrets Manager-backed feature toggle provider/client (`src/providers/FeatureToggleProvider.jsx`, `src/api/featureToggleClient.js`) and wrapped the React tree in `src/main.jsx` so dashboards can read toggle manifests, persist cohort assignments, and expose refresh hooks for ops.
- Added `DashboardAccessGate.jsx` and toggle summary treatments in `components/dashboard/DashboardLayout.jsx` to surface owner/ticket metadata, rollout percentages, and request-access CTAs when `analytics-dashboards` is disabled or pilot-only, matching design drawings.
- Updated `RoleDashboard.jsx` to respect toggle evaluation before fetching data, reuse toggle metadata for telemetry/export instrumentation, and deliver Vitest coverage (`src/pages/__tests__/RoleDashboard.test.jsx`) for both enabled and gated scenarios.
