# New Backend Files — 2025-02-09

- `tests/serviceRoutes.test.js` — Vitest + Supertest suite validating service creation/purchase flows with chaos rollback coverage.
- `tests/services.contract.test.js` — Contract validation harness using Zod to enforce service list payload schema.
- `vitest.config.js` & `vitest.setup.js` — Vitest configuration enabling sqlite-backed, single-threaded execution within CI.
