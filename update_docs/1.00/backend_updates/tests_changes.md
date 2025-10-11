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
