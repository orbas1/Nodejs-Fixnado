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

## 2025-10-18 — Insured Seller Compliance & Marketplace Moderation
- Added compliance + moderation stack spanning migration `20250218000000-compliance-and-marketplace-moderation.js`, models (`complianceDocument.js`, `insuredSellerApplication.js`, `marketplaceModerationAction.js`), and services/controllers/routes (`services/complianceService.js`, `controllers/complianceController.js`, `routes/complianceRoutes.js`) to persist document submissions, approvals, badge toggles, and suspensions with audit history.
- Hardened marketplace item lifecycle: `services/marketplaceService.js`, `controllers/marketplaceController.js`, `routes/marketplaceRoutes.js`, and updated `services/feedService.js` now gate listings on insured seller status, expose moderation queue payloads, attach compliance snapshots at approval, and ensure feed responses exclude expired/suspended sellers.
- Introduced Vitest coverage (`tests/complianceMarketplace.test.js`) exercising blocked unverified sellers, review + moderation approval/rejection flows, badge toggles, feed suppression after expiry, and suspension gating while error handler logging now emits explicit 409/403 responses for compliance breaches.

## 2025-10-19 — Campaign Manager Targeting, Pacing & Billing
- Migration `20250219000000-create-campaign-manager.js` provisions `ad_campaigns`, `campaign_flights`, `campaign_targeting_rules`, `campaign_invoices`, and `campaign_daily_metrics` with UUID PKs, enum governance, spend indexes, and cleanup of obsolete targeting enums to support ads billing reconciliations.
- New Sequelize models (`adCampaign.js`, `campaignFlight.js`, `campaignTargetingRule.js`, `campaignInvoice.js`, `campaignDailyMetric.js`) wire associations between companies, flights, invoices, and daily pacing metrics so overspend controls and eligibility checks run transactionally.
- `services/campaignService.js`, `controllers/campaignController.js`, and `routes/campaignRoutes.js` expose `/api/campaigns` CRUD, flight allocation, pacing ingestion, overspend enforcement, invoice generation, and status toggles backed by config-governed thresholds and insured seller checks.
- Vitest suite `tests/campaignRoutes.test.js` validates insured seller gating, daily metric ingestion, overspend pause automation, invoice issuance, and summary retrieval to guarantee production parity across sqlite/Postgres environments.

## 2025-10-20 — Campaign Telemetry Warehouse Mapping & Fraud Signals
- Added analytics outbox + fraud monitoring to the campaign stack: `CampaignAnalyticsExport` and `CampaignFraudSignal` models persist warehouse payloads, retry metadata, anomaly classifications, and resolution notes with associations wired through `models/index.js`.
- Extended `services/campaignService.js` with metrics ingestion, CTR/CVR/anomaly scoring, fraud signal lifecycle management, analytics export upserts, pending export fetch/requeue helpers, and KPI summary aggregation. Controller/route layer now supports targeting upserts, fraud resolution, and summary endpoints for admin/provider dashboards.
- Introduced configurable exporter job (`jobs/campaignAnalyticsJob.js`) posting payloads to `CAMPAIGN_ANALYTICS_ENDPOINT` with API key headers, interval/retry controls, and structured logging. Configuration namespace added to `config/index.js` for tolerance thresholds, delivery gap floor, export cadence, and retry minutes.
- Updated Vitest coverage (`tests/campaignRoutes.test.js`) to assert analytics export generation, fraud signal creation/resolution, and summary calculations while ensuring sqlite determinism. Pending export + fraud schema recorded in database change logs to keep analytics/data engineering in sync.
