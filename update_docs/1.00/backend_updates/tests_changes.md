# Test Suite Changes — 2025-02-09

- Added `tests/serviceRoutes.test.js` covering authorised service creation, purchase success paths, and chaos-induced escrow failures with rollback assertions.
- Added `tests/services.contract.test.js` leveraging Zod to enforce response contracts for `GET /api/services`, protecting downstream consumers against schema drift.
- Introduced `vitest.config.js` and `vitest.setup.js` to run suites in single-threaded sqlite mode with JWT/env bootstrapping.
