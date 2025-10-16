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

## 2025-04-08 – GDPR Metrics & Due-Date Awareness
- Updated the compliance repository/controller to request the new metrics endpoint, exposing backlog counts, due-soon figures, and percentile completion timings to Riverpod consumers.
- Enhanced the Data Requests screen with KPI banners, due-at labels, overdue indicators, and pull-to-refresh wiring so operators can triage SLA risk from mobile.
- Added Flutter unit tests (`test/features/compliance/data_subject_request_test.dart`, `test/features/compliance/data_requests_controller_test.dart`) covering JSON parsing, overdue detection, repository error handling, and metrics propagation.

## 2025-04-09 – Finance Escalations & Alert Parity
- Extended the finance domain models, repository, and Riverpod controller to ingest webhook retry metadata, alert acknowledgement state, and Slack/Opsgenie delivery receipts exposed by the new backend fan-out service.
- Updated `FinanceDashboardScreen` with escalation trays, responder chips, retry countdown timers, and manual refresh/acknowledge actions while tuning layouts for compact devices.
- Authored Dart unit coverage (`test/features/finance/finance_models_test.dart`) validating alert parsing, escalation severity mapping, and retry countdown formatting against representative payloads.

## 2025-04-10 – Creation Studio Wizard
- Added Creation Studio repository, domain models, Riverpod controller, and widget wiring to enable blueprint discovery, draft autosave, slug validation, compliance tick-off, and publish submission directly from mobile.
- Implemented the multi-step Creation Studio screen with blueprint cards, inline autosave indicator, persona-aware defaults, compliance checklist toggles, availability inputs, and publish flow consistent with the React experience and localisation requirements.
- Wrote controller tests (`test/creation_studio_controller_test.dart`) covering blueprint load, autosave success/error, slug availability handling, and publish orchestration while documenting navigation entry, localisation copy, and parity tasks in the update trackers.

## 2025-04-11 – Explorer Ranking & Demand Heuristics
- Extended the explorer repository, filters, and view state to support zone-aware ranking inputs (company IDs, compliance scores, availability preferences) while aligning enums and cache encodings with the updated React heuristics.
- Added shared ranking utilities (`explorer_ranking.dart`) scoring services and marketplace items by demand weighting, compliance telemetry, availability, rental support, and price signals with offline fallback ordering.
- Authored Dart unit tests (`test/explorer_ranking_test.dart`) verifying service and marketplace ordering plus scoring deltas under different demand/compliance scenarios, keeping mobile explorer parity with the web experience.

## 2025-04-15 – Live Feed Streaming & Reconnection UX
- Implemented SSE streaming via `live_feed_repository.dart` with frame parsing, cancellation handling, and exponential backoff-ready controllers to replace polling in the live feed experience.
- Refactored `LiveFeedController` to manage stream state, reconnection timers, status messaging, and cached snapshot pruning while keeping existing publish/bid/message flows intact.
- Updated the live feed screen to surface connection pulses, offline banners, and filter-aware restarts plus added unit tests covering repository parsing and controller event handling.
