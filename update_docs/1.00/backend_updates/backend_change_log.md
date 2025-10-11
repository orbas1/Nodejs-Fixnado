# Backend Change Log — 2025-02-09 Automation Uplift

- Introduced sqlite-aware Sequelize configuration so Vitest suites run deterministically without external services (`src/config/database.js`).
- Hardened service purchase flow with transactional order + escrow creation and rollback semantics, preventing orphaned orders during chaos injection (`src/controllers/serviceController.js`).
- Added high-fidelity API regression suites for service creation/purchase plus Zod-based contract validation to guard consumer payloads (`tests/serviceRoutes.test.js`, `tests/services.contract.test.js`).

## 2025-02-10 — Geo-Zonal & Booking Engine Delivery
- Shipped zone microservice with GeoJSON validation, centroid/bounding box enrichment, analytics snapshots, and REST endpoints ready for explorer overlays (`services/zoneService.js`, `routes/zoneRoutes.js`, `controllers/zoneController.js`, `jobs/zoneAnalyticsJob.js`).
- Implemented booking orchestration covering assignments, bids, disputes, and finance calculations through new services/models/controllers/routes and environment-driven SLA/commission/tax configuration.
- Added Vitest regression suites for zones and bookings ensuring geometry validation, SLA timers, currency calculations, assignment/bid flows, and dispute handling remain production-safe.

## 2025-10-13 — Shared Infrastructure & Feature Toggle Governance
- Refactored Sequelize configuration to default to PostgreSQL with pooled connections, SSL toggles, and dialect-specific options; startup now verifies PostGIS/topology/UUID extensions and surfaces precise diagnostics (`src/config/database.js`, `src/app.js`).
- Created Secrets Manager–backed feature toggle service with admin endpoints, validation rules, caching, and audit logging to the new `feature_toggle_audits` table (`src/services/featureToggleService.js`, `src/controllers/featureToggleController.js`, `src/routes/adminRoutes.js`, `src/database/migrations/20250215000000-feature-toggle-audit.js`).
- Added bootstrap tooling for PostGIS enablement and updated Vitest suites to cover toggle reads/writes so infrastructure drift and rollout regressions are caught in CI (`scripts/bootstrap-postgis.mjs`, `tests/featureToggleService.test.js`).

## 2025-10-14 — CI Coverage Thresholds & Governance Hooks
- Updated `vitest.config.js` to scope coverage to booking, toggle, finance, and zone services plus routes/middleware with minimum thresholds (lines/statements 75%, functions 80%, branches 48%) enforced in both local and CI runs.
- Bumped `package.json` test script to `vitest run --coverage` and added `@vitest/coverage-v8@^2.1.4` so backend developers receive identical gating locally and in CI.
- CI Quality Gates upload LCOV artefacts from backend runs, feeding QA/compliance evidence and rollback workflows documented in `docs/ops/ci-rollback-playbook.md`.
