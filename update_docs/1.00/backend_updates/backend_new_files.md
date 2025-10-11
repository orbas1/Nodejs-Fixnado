# New Backend Files — 2025-02-09

- `tests/serviceRoutes.test.js` — Vitest + Supertest suite validating service creation/purchase flows with chaos rollback coverage.
- `tests/services.contract.test.js` — Contract validation harness using Zod to enforce service list payload schema.
- `vitest.config.js` & `vitest.setup.js` — Vitest configuration enabling sqlite-backed, single-threaded execution within CI.
## 2025-02-10 — Added Files
- `src/controllers/zoneController.js`
- `src/controllers/bookingController.js`
- `src/services/zoneService.js`
- `src/services/bookingService.js`
- `src/services/financeService.js`
- `src/routes/zoneRoutes.js`
- `src/routes/bookingRoutes.js`
- `src/jobs/zoneAnalyticsJob.js`
- `src/models/booking.js`
- `src/models/bookingAssignment.js`
- `src/models/bookingBid.js`
- `src/models/bookingBidComment.js`
- `src/models/zoneAnalyticsSnapshot.js`
- `tests/zoneRoutes.test.js`
- `tests/bookingRoutes.test.js`

## 2025-10-13 — Added Files
- `src/services/featureToggleService.js`
- `src/controllers/featureToggleController.js`
- `src/database/migrations/20250215000000-feature-toggle-audit.js`
- `scripts/bootstrap-postgis.mjs`
- `tests/featureToggleService.test.js`
