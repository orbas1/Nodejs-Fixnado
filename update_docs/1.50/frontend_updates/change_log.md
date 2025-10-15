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
