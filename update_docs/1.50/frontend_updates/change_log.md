# Frontend Change Log – Version 1.50

## 2025-03-18 – Consent Experience & Legal Copy Refresh
- Added `ConsentProvider`, hook (`useConsent`), and banner component orchestrating consent snapshot retrieval, acknowledgement, and verification with anonymous subject persistence.
- Wired the provider into `App.jsx`/`main.jsx`, updated API clients, and refreshed `uk_terms.json` + `privacy_policy_content.json` to surface the revised legal copy from the consent ledger.
- Introduced `consentClient` with typed error handling plus ESLint clean-up across existing API utilities to keep shared fetch helpers warning-free.

## 2025-03-28 – Compliance Portal Experience
- Created `frontend-reactjs/src/pages/CompliancePortal.jsx` delivering data subject submission, filtering, export, and status management workflows with responsive layout and dark theme styling.
- Added `frontend-reactjs/src/api/complianceClient.js` providing typed fetch helpers for GDPR request CRUD/export endpoints with abort support and error parsing.
- Integrated the portal route into `App.jsx` navigation, surfaced PropTypes on shared status badges, and ensured lint coverage across new components.

## 2025-03-30 – Warehouse Operations Console
- Extended the compliance portal with a warehouse export panel supporting dataset/region filters, manual trigger controls, run state badges, download links, and retention countdowns aligned with backend metadata.
- Updated `complianceClient` with `listWarehouseExportRuns` and `createWarehouseExportRun` helpers, adding defensive parsing for NDJSON bundle metadata and long-running job polling.
- Added operator-focused empty states, error toasts, and contextual documentation links within the portal so compliance and platform security teams can diagnose export health without leaving the UI.

## 2025-04-08 – GDPR Metrics Dashboard & SLA Filters
- Enhanced `CompliancePortal.jsx` with metrics cards visualising backlog, overdue counts, completion rates, and percentile timings plus a due-date column on the request table.
- Extended the filter panel with subject email search, date range pickers, and region/request-type selectors that drive both request listings and the new metrics API calls.
- Added Vitest coverage (`src/pages/__tests__/CompliancePortal.test.jsx`) asserting metrics rendering, refresh behaviour, and filter-driven API interactions to keep the dashboard regression-safe.

## 2025-04-09 – Finance Alert Escalations & Retry Telemetry
- Updated `FinanceOverview.jsx` to surface escalation ribbons, Slack/Opsgenie delivery state, retry counters, and acknowledgement controls so finance operators can triage SLA breaches directly from the dashboard.
- Extended the finance client with alert acknowledgement, escalation filters, and retry metadata normalisation to keep the React UI aligned with the fan-out job payloads.
- Added Vitest coverage (`src/pages/__tests__/FinanceOverview.test.jsx`) validating severity theming, retry indicators, and manual refresh flows against mocked `/api/finance/alerts` responses.
## 2025-04-09 – Creation Studio Wizard & Navigation Entry
- Added `creationStudioClient` with blueprint fetching, draft autosave, publish submission, and slug validation helpers, wiring the new `/api/creation-studio` endpoints into the React application.
- Introduced `CreationStudioWizard` page with blueprint selection cards, stepper, autosave feedback, compliance checklist validation, and publish flow plus integrated the route and navigation entry into the solutions mega menu.
- Localised new copy across all supported locales and added Vitest coverage for the creation studio reducer to protect state transitions, autosave, and serialization logic.

## 2025-04-11 – Explorer Ranking & Demand Heuristics
- Implemented demand-aware ranking inside `explorerUtils.js`, combining zone demand, compliance telemetry, availability preferences, and pricing signals so search results prioritise compliant providers and rentable stock in high-demand regions.
- Updated explorer unit tests to cover the new ranking heuristics and exported scorers, ensuring Vitest verifies ordering across services and marketplace items with demand, compliance, and availability permutations.
- Hardened search utilities by surfacing reusable scoring helpers for downstream dashboards and adding documentation to explorer pages updates covering demand-weighted listings and compliance-driven ordering.
