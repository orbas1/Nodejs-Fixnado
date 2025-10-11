# Backend Change Log — 2025-02-09 Automation Uplift

- Introduced sqlite-aware Sequelize configuration so Vitest suites run deterministically without external services (`src/config/database.js`).
- Hardened service purchase flow with transactional order + escrow creation and rollback semantics, preventing orphaned orders during chaos injection (`src/controllers/serviceController.js`).
- Added high-fidelity API regression suites for service creation/purchase plus Zod-based contract validation to guard consumer payloads (`tests/serviceRoutes.test.js`, `tests/services.contract.test.js`).

## 2025-02-10 — Geo-Zonal & Booking Engine Delivery
- Shipped zone microservice with GeoJSON validation, centroid/bounding box enrichment, analytics snapshots, and REST endpoints ready for explorer overlays (`services/zoneService.js`, `routes/zoneRoutes.js`, `controllers/zoneController.js`, `jobs/zoneAnalyticsJob.js`).
- Implemented booking orchestration covering assignments, bids, disputes, and finance calculations through new services/models/controllers/routes and environment-driven SLA/commission/tax configuration.
- Added Vitest regression suites for zones and bookings ensuring geometry validation, SLA timers, currency calculations, assignment/bid flows, and dispute handling remain production-safe.
