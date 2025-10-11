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

## 2025-10-17 — Inventory & Rental Lifecycle Enablement
- Added Sequelize domain models (`inventoryItem.js`, `inventoryLedgerEntry.js`, `inventoryAlert.js`, `rentalAgreement.js`, `rentalCheckpoint.js`) and migration `20250217000000-create-inventory-and-rentals.js` to persist stock balances, ledger history, alert lifecycle, rental agreements, inspection checkpoints, deposit governance, and audit metadata.
- Implemented inventory and rental services/controllers/routes orchestrating reservation locking, approvals, checkout, returns (full + partial), inspection outcomes, settlement, dispute escalation, and automated alert reconciliation (`services/inventoryService.js`, `services/rentalService.js`, `controllers/inventoryController.js`, `controllers/rentalController.js`, `routes/inventoryRoutes.js`, `routes/rentalRoutes.js`).
- Expanded Vitest coverage (`tests/inventoryRoutes.test.js`, `tests/rentalRoutes.test.js`) validating reservation constraints, inspection variance handling, alert acknowledgement/escalation, rental settlement, and cancellation flows; Vitest setup extended with Secrets Manager and turf mocks to keep sqlite execution deterministic.
