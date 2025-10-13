# Test Suite Changes — 2025-02-09

- Added `tests/serviceRoutes.test.js` covering authorised service creation, purchase success paths, and chaos-induced escrow failures with rollback assertions.
- Added `tests/services.contract.test.js` leveraging Zod to enforce response contracts for `GET /api/services`, protecting downstream consumers against schema drift.
- Introduced `vitest.config.js` and `vitest.setup.js` to run suites in single-threaded sqlite mode with JWT/env bootstrapping.
## 2025-02-10 — Vitest Coverage Expansion
- Added `tests/zoneRoutes.test.js` validating zone CRUD, polygon validation failures, analytics snapshot generation, and list responses.
- Added `tests/bookingRoutes.test.js` covering booking creation, provider assignments, bid lifecycle, dispute escalation, and validation guardrails.

## 2025-10-13 — Feature Toggle Governance Tests
- Introduced `tests/featureToggleService.test.js` exercising Secrets Manager interactions (mocked client), override fallbacks, cache lifecycle, and audit logging to ensure feature rollout changes remain verifiable in CI.

## 2025-10-17 — Inventory & Rental Regression Suites
- Extended `/api/inventory` Vitest coverage with reservation rollback, reconciliation, alert acknowledgement/escalation, and ledger export scenarios using sqlite transaction harnesses and deterministic mocks (`tests/inventoryRoutes.test.js`).
- Added `tests/rentalRoutes.test.js` executing rental lifecycle permutations (approval, checkout, partial return, inspection variance, settlement, cancellation) plus alert propagation, deposit handling, and audit metadata assertions to lock production behaviour.

## 2025-10-18 — Compliance & Marketplace Tests
- Added `tests/complianceMarketplace.test.js` validating end-to-end insured seller governance: blocking unverified listings, approving multiple document types, moderation queue responses, feed suppression after document expiry, badge toggles, and suspension gating.
- Test suite exercises new `/api/compliance` + `/api/marketplace` endpoints with sqlite-backed migrations, ensuring document expiry auto-marks records, compliance evaluation updates `Company` snapshots, and moderation actions persist audit metadata.

## 2025-10-19 — Campaign Manager Tests
- Added `tests/campaignRoutes.test.js` covering campaign creation, flight allocation, daily pacing ingestion, overspend pause enforcement, invoice generation, and summary retrieval while asserting targeting validation and insured seller gating.
- Test harness seeds sqlite with campaign configuration defaults, mocks invoice clock to verify due date offsets, and validates overspend multiplier handling to guarantee parity with production Postgres execution.
- Extended the suite to assert analytics export outbox creation, fraud signal emission/resolution, and KPI summary calculations so warehouse integration and anomaly monitoring stay regression-proof.

## 2025-10-20 — Campaign Analytics Exporter Job Tests
- Introduced `tests/campaignAnalyticsJob.test.js` with mocked warehouse endpoint + service layer to verify background exporter retries failed payloads, honours configured API key headers, and updates export records with `sent`/`failed` status and error messaging.
- Exercised missing-endpoint and non-200 response paths to confirm logger error instrumentation, requeue invocation, and failure back-off compliance with `campaigns.failedRetryMinutes` settings.
- Ensured tests guard header construction and interval scheduling so production job cadence (export interval seconds) remains under regression coverage when configuration values change.

## 2025-10-22 — Communications Regression Suite
- Added `tests/communicationsRoutes.test.js` covering conversation creation, participant enrolment, AI-assisted message sends, quiet-hour suppression, override acknowledgements, delivery reconciliation, and Agora session token generation with deterministic sqlite fixtures.
- Mocked AI assist HTTP client to simulate success, timeout, and failure responses while asserting heuristic fallback copy, provenance metadata, and audit logging.
- Verified quiet-hour enforcement returns 409 warnings, override endpoint captures actor/reason/duration, and Agora credentials missing/expired paths surface actionable 503 errors with telemetry breadcrumbs.

## 2025-10-24 — Analytics Event Assertions
- Extended zone, booking, rental, campaign, and communications route tests to assert analytics event persistence alongside functional outcomes. Suites now verify event count, domain/entity metadata, tenant inference, and key payload fields (e.g., SLA expiry, assignment IDs, inspection totals, fraud signal severity, quiet-hour reason).
- Added helper expectations ensuring timestamp normalisation and actor attribution behave consistently across sqlite/Postgres by stubbing `Date` values and comparing persisted metadata snapshots.
- Regression harness now fails fast when new emitters are introduced without catalogue definitions, preventing undocumented events from reaching warehouse ingestion.

## 2025-10-26 — Analytics Ingestion Job Regression Suite
- Added `tests/analyticsIngestionJob.test.js` covering happy-path delivery, retry/backoff when the warehouse is unavailable, retention purge, and backfill acceleration by exercising new helpers (`fetchPendingAnalyticsEvents`, `markEventIngestionSuccess/Failure`, `purgeExpiredAnalyticsEvents`, `ensureBackfillCoverage`).
- Test harness mocks `fetch` to assert request payload composition, API key header injection, request timeout handling, and structured logger output for both success and failure branches.
- Updated `vitest.setup.js` to seed Agora environment defaults so communications suites continue to run hermetically after analytics ingestion job tests reset modules during dependency injection.

## 2025-10-28 — Analytics Pipeline Control Tests
- Added `tests/analyticsPipelineRoutes.test.js` exercising the new `/api/analytics/pipeline` endpoints: status responses (backlog counts, failure streak, last success/error timestamps, run summaries) and pause/resume control flows.
- Tests seed sqlite with pending events and pipeline runs, verify pause/resume audit entries (`AnalyticsPipelineRun` metadata), validate actor payload requirements, and ensure pipeline state toggles propagate through the control service without polling actual Secrets Manager.
- Extended `tests/analyticsIngestionJob.test.js` to cover pipeline disablement logging and audit recording so skip scenarios remain regression-proof when toggles gate ingestion.

## 2025-10-29 — Persona Dashboard Aggregation Tests
- Added `tests/analyticsDashboards.test.js` seeding users, companies, service zones, bookings, rentals, campaign metrics, fraud signals, inventory alerts, compliance docs, and conversations to validate admin, provider, serviceman, and enterprise persona responses end-to-end.
- Suite asserts overview KPI calculations, trend deltas, pipeline columns, compliance tables, metadata formatting, and export URL wiring while confirming CSV downloads include persona/window headers and escaped values for ingestion jobs.
- Fixtures mirror sqlite/Postgres schema (including UUID validation) and exercise validation errors (invalid persona → 404, malformed query → 422) so regression coverage protects controller/service logic and export serialization.

## 2025-10-30 — Regression Execution Evidence
- Ran `npm test` under `backend-nodejs/` to execute analytics dashboard suites with staging-like fixtures; confirmed 13 files / 33 tests pass, including persona aggregation/export cases, and captured spinner overflow to be resolved by enforcing CI reporters.【3d3b31†L1-L38】
- Recorded requirement to add CI-friendly reporter defaults (`CI=1`, `--reporter=dot`/`junit`) so audit logs remain reviewable when analytics suites expand with enterprise drill-down coverage.

## 2025-11-03 — Performance Harness Orchestration
- Added k6-based load harness executed through `npm run load:test`, which invokes `scripts/run-load-tests.mjs` to validate prerequisites, hydrate profile-defined environment variables, and stream deterministic summary exports for audit trails.
- Baseline profile `performance/profiles/baseline.json` encodes arrival stages, persona concurrency, and thresholds referenced by `performance/k6/main.js`; the harness now measures booking/chat/escrow/analytics/campaign flows with custom Trends/Rates/Counters for Task 6.3 evidence.
- Load drill not executed in CI due to missing k6 binary within the container; execution guidance captured in `performance/README.md` for staging rehearsals.
