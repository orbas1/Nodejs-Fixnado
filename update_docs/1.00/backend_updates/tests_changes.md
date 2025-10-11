# Test Suite Changes — 2025-02-09

- Added `tests/serviceRoutes.test.js` covering authorised service creation, purchase success paths, and chaos-induced escrow failures with rollback assertions.
- Added `tests/services.contract.test.js` leveraging Zod to enforce response contracts for `GET /api/services`, protecting downstream consumers against schema drift.
- Introduced `vitest.config.js` and `vitest.setup.js` to run suites in single-threaded sqlite mode with JWT/env bootstrapping.
## 2025-02-10 — Vitest Coverage Expansion
- Added `tests/zoneRoutes.test.js` validating zone CRUD, polygon validation failures, analytics snapshot generation, and list responses.
- Added `tests/bookingRoutes.test.js` covering booking creation, provider assignments, bid lifecycle, dispute escalation, and validation guardrails.

## 2025-10-13 — Feature Toggle Governance Tests
- Introduced `tests/featureToggleService.test.js` exercising Secrets Manager interactions (mocked client), override fallbacks, cache lifecycle, and audit logging to ensure feature rollout changes remain verifiable in CI.
