# User Phone App Change Log – Version 1.50

## 2025-03-17 – Secure Session Vault & Biometric Unlock
- Added hardened credential storage using `flutter_secure_storage` with platform-specific encryption defaults to hold access/refresh tokens offline.
- Introduced a Riverpod-driven session controller that hydrates credentials from secure storage, enforces biometric unlock before exposing tokens, and clears state on logout.
- Delivered an `AuthSessionApi` capable of login, refresh, and logout orchestration against the backend `/api/auth` endpoints to support production authentication flows.

## 2025-03-18 – Consent Overlay & Legal Surfaces
- Implemented `ConsentApi`, models, controller, and full-screen overlay that enforce ledger-backed consent acceptance before unlocking authenticated navigation.
- Synced legal typography, policy cards, and ledger timestamps with the shared design tokens so copy matches the refreshed React experience.
- Captured Opsgenie escalation metadata on booking creation responses to prepare for future in-app trust alerts.

## 2025-03-28 – Compliance Portal Parity
- Added the compliance Data Requests domain (models, repository, controller, screen) enabling GDPR submissions, exports, and status updates directly from the user app.
- Integrated the navigation card within the profile legal pane featuring real-time counts, latest submission timestamps, and retry affordances.
- Wired controller providers to preload compliance metrics so cross-screen widgets stay responsive even with intermittent connectivity.

## 2025-03-30 – Warehouse Export Operations View
- Expanded the compliance screen with a warehouse export tab summarising the latest CDC runs, dataset/region filters, and retention timers aligned with backend metadata.
- Added repository/controller methods to call `listWarehouseExportRuns` and to fire manual export triggers with optimistic state, error surface mapping, and analytics instrumentation.
- Surfaced toast/snackbar messaging plus inline documentation links guiding operators through DPIA evidence capture when runs complete or error, ensuring parity with the web portal experience.
