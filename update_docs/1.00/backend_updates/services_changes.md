## 2025-02-10 — Zone, Booking & Finance Services
- `services/zoneService.js` validates GeoJSON (via `@turf`), computes centroids/bounding boxes, persists PostGIS-ready geometry, and orchestrates analytics snapshots for downstream dashboards.
- `services/bookingService.js` centralises booking state machine logic (SLA timers, assignments, bids, disputes) with transactional safeguards and metadata updates required by admin/provider workflows.
- `services/financeService.js` introduces commission/tax/multi-currency calculations with environment-driven rates, surfacing totals/metadata for reconciliation.

## 2025-10-13 — Feature Toggle Service & Audit Trail
- Added `services/featureToggleService.js` to load toggle manifests from Secrets Manager, cache results, validate updates, and write audit records to `feature_toggle_audits`. Exposes helper utilities for cache resets, client overrides (tests), and cache version introspection.

## 2025-10-17 — Inventory & Rental Services
- Introduced `services/inventoryService.js` encapsulating stock CRUD, ledger entry persistence, reconciliation workflows, alert lifecycle management, and transactional quantity adjustments (reservations, checkout, returns, write-offs, restock) with automated low-stock alert updates.
- Added `services/rentalService.js` implementing rental agreement lifecycle (request → approval → checkout → return/inspection → settlement/cancellation), deposit handling, partial return reconciliation, damage assessments, dispute escalation, and alert propagation tied to inventory availability.

## 2025-10-18 — Compliance & Marketplace Services
- Added `services/complianceService.js` to manage document submissions, validation, status transitions (submitted/approved/rejected/expired/suspended), insured seller application evaluation, badge visibility toggles, and suspension logging, updating `Company` compliance snapshots atomically.
- Created `services/marketplaceService.js` to enforce insured seller eligibility during listing creation, orchestrate moderation decisions (approve/reject/suspend), expose moderation queue data, and provide feed-ready listing projections with compliance hold filters.
- Updated `services/feedService.js` to use compliance-aware marketplace retrieval, projecting curated payloads (compliance summary, company metadata, review timestamps) and limit handling for frontend consumption.

## 2025-10-19 — Campaign Service
- Introduced `services/campaignService.js` encapsulating campaign creation/update workflows, insured seller eligibility enforcement, targeting validation, and lifecycle status transitions with transactional writes to campaigns, flights, targeting rules, invoices, and pacing metrics.
- Service ingests daily pacing payloads, enforces overspend thresholds with automatic pause + resume, calculates burn forecasts, and generates invoices with configurable due dates and currency defaults surfaced to finance dashboards.
- Added helper utilities for summarising campaign health (delivery ratio, overspend streaks, outstanding invoices) consumed by controllers/tests to keep API responses production-ready.

## 2025-10-20 — Campaign Analytics & Fraud Services
- Extended `campaignService.js` with analytics export outbox management (`CampaignAnalyticsExport` upserts, pending fetch, failed requeue), CTR/CVR/anomaly scoring, spend target derivation, and fraud signal lifecycle (`CampaignFraudSignal` create/update/resolve).
- Metrics ingestion normalises amounts, persists spend targets/CTR/CVR/anomaly scores, emits fraud signals for overspend/underspend/CTR/CVR/delivery gap/no spend scenarios, and produces summary aggregates for dashboards and finance operations.
- Added helper exports (`fetchPendingAnalyticsExports`, `markAnalyticsExportAttempt`, `requeueFailedAnalyticsExports`, `getCampaignSummary`) powering the new background job and API endpoints for analytics warehousing and fraud remediation flows.

## 2025-10-22 — Communications Service
- Added `services/communicationsService.js` encapsulating conversation lifecycle (create/update, participant enrolment, message threading) with transactional guards ensuring participants and deliveries stay consistent across sqlite/Postgres.
- Service manages AI assist suggestions by delegating to configured provider or deterministic heuristics, merges results into message drafts, and records provenance metadata alongside quiet-hour suppression windows.
- Introduced helpers to mint Agora session tokens, record delivery acknowledgements, enforce quiet-hour checks with overrides/escalations, and stream audit events used by notification centre dashboards and Flutter clients.

## 2025-10-24 — Analytics Event Service & Emitters
- Added `services/analyticsEventService.js` housing immutable event catalogue, metadata validation, tenant inference, actor normalisation, and batch helper to persist governed analytics envelopes with optional transaction support.
- Updated zone, booking, rental, campaign, and communications services to call the helper during lifecycle events (creation, status transitions, assignment creation, dispute raises, inspections, campaign metric ingestion/fraud detection, message delivery suppression) so telemetry remains consistent across domains.
- Emitters pass correlation IDs, actor/channel hints, and required metadata (SLA expiry, assignment IDs, inspection charges, fraud signal severity, quiet-hour reason) ensuring downstream ETL and dashboards receive production-grade context.

## 2025-10-26 — Analytics Ingestion Helpers & Communications Telemetry
- Extended `analyticsEventService` with ingestion lifecycle utilities (pending fetch, mark success/failure, purge expired events, backfill acceleration) plus retention calculations so warehouse delivery jobs can coordinate retries and cleanup without duplicating logic.
- Adjusted `communicationsService` delivery creation to stage suppressed-delivery analytics until after transaction commit, enrich metadata with `deliveryId`, and surface post-commit promises so API responses only resolve once telemetry persistence has been scheduled/awaited.
- Batch recording helper now supports array ingestion (`recordAnalyticsEvents`) without logging noise, ensuring analytics pipelines remain performant while complying with transaction boundaries.

## 2025-10-28 — Analytics Pipeline Control Service
- Added `services/analyticsPipelineService.js` to evaluate ingestion enablement (env overrides + Secrets Manager toggles), cache control state, record `AnalyticsPipelineRun` audits, and expose pause/resume helpers that update feature toggles while logging control metadata.
- Service summarises pipeline backlog/failure streak metrics for the new administration API, normalises metadata persisted to run history (domain/entity summary, purge counts, warnings), and guards pause/resume inputs with actor/ticket validation to keep audit trails production-ready.
- Updated ingestion job to rely on the service for state evaluation and run logging, enabling skip logging, structured warnings, and deterministic retention of last-error context for dashboards/runbooks.
