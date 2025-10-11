# Controller Changes — 2025-02-09

- `serviceController.purchaseService` now executes within a Sequelize transaction, rolling back order creation when escrow persistence fails and returning consistent 500 responses for operational chaos drills.
- Finder queries are transaction-scoped to prevent dirty reads during concurrent purchases and align with new Vitest rollback assertions.
## 2025-02-10 — Zone & Booking Controllers
- Added `zoneController.js` to translate service validation errors into HTTP responses, expose CRUD/list/snapshot endpoints, and support analytics toggles.
- Added `bookingController.js` encapsulating booking lifecycle endpoints (create, status updates, assignments, bids, comments, disputes) while preserving audit metadata.

## 2025-10-13 — Feature Toggle Administration
- Introduced `featureToggleController.js` with read (`getToggles`, `getToggle`) and update (`updateToggle`) handlers guarded by express-validator; PATCH requests enforce allowed states, rollout bounds, and respond with enriched metadata for admin UI consumption.

## 2025-10-17 — Inventory & Rental Controllers
- Added `inventoryController.js` exposing CRUD, ledger, health, reconciliation, and alert acknowledgement endpoints with pagination, validation, and structured error handling aligned to provider/admin console expectations.
- Added `rentalController.js` orchestrating rental request intake, approvals, contract signing, checkout/return status transitions, inspection checkpoint updates, settlement, cancellation, and escalation responses with audit metadata for compliance workflows.

## 2025-10-18 — Compliance & Marketplace Controllers
- Added `complianceController.js` handling document submission, review decisions, insured badge toggles, suspensions, and evaluation endpoints; controllers return structured 409 responses for ineligible sellers and bubble audit metadata for moderation logs.
- Introduced `marketplaceController.js` for listing creation, review submission, moderation approvals/rejections/suspensions, moderation queue retrieval, and approved listings feed, wiring request query parsing (limits/offsets) into new service layer filters.

## 2025-10-19 — Campaign Manager Controller
- Added `campaignController.js` orchestrating campaign CRUD, flight creation/update, pacing metric ingestion, overspend pause/resume, invoice generation, and status transitions with deterministic validation + config-driven defaults surfaced in responses for admin/provider UI.
- Controller normalises targeting validation errors into 422 payloads, surfaces pacing/invoice summaries for dashboards, and coordinates transactional writes so company-level budget checks and insured seller gating remain consistent across requests.

## 2025-10-20 — Campaign Analytics & Fraud Controller Enhancements
- Extended `campaignController.js` with targeting rule upsert handler, fraud signal listing/resolution endpoints, and KPI summary responses exposing aggregate impressions/clicks/conversions/ROI for dashboards.
- Metrics ingestion now returns persisted CTR/CVR/anomaly scores, while fraud resolution API accepts remediation notes and returns resolved timestamps to power finance/compliance workflows.
