## 2025-10-24 — Analytics Event Catalogue Rollout
- Established `analyticsEventService` catalogue with governed event names covering zones (`zone.created`, `zone.updated`, `zone.deleted`), bookings (`booking.created`, `booking.status_transition`, `booking.assignment.created`, `booking.dispute.raised`), rentals (`rental.requested`, `rental.status_transition`, `rental.inspection.completed`), ads (`ads.campaign.metrics_recorded`, `ads.campaign.fraud_signal`), and communications (`communications.message.sent`, `communications.delivery.suppressed`).
- Each definition specifies domain, entity type, required metadata keys, and tenant resolution hints so emitting services automatically infer tenancy and enforce payload completeness before persistence.
- Metadata validation rejects missing/undefined keys, sanitises undefined values, and normalises timestamps; actor context supports string shorthand or structured `{ type, id, label }` input with fallbacks for system emitters.
- Zone, booking, rental, campaign, and communications services now call `recordAnalyticsEvent(s)` during lifecycle transitions, passing correlation IDs, channel/source hints, and domain-specific metadata (e.g., booking SLA expiry, rental inspection charges, campaign metric tallies, communications quiet-hour reasons) aligned with dashboards and warehouse models.
- Event catalogue exposed via `analyticsEventCatalog` + `getAnalyticsEventDefinition` so downstream tooling (ETL/backfills, QA harnesses) can programmatically inspect required metadata when introducing new emitters.

## 2025-10-26 — Ingestion Lifecycle & Suppression Telemetry
- Analytics events now persist ingestion governance metadata (`ingestedAt`, `ingestionAttempts`, `lastIngestionError`, `nextIngestAttemptAt`, `retentionExpiresAt`) to support retry cadence, retention policies, and warehouse reconciliation.
- Background ingestion job batches pending events by `nextIngestAttemptAt`, POSTs to configurable warehouse endpoints, records success/failure state via `markEventIngestionSuccess/Failure`, accelerates backfill windows, and purges expired rows to honour GDPR retention.
- Quiet-hour suppression analytics capture `deliveryId` alongside reason metadata and are buffered until the surrounding transaction commits; post-commit promises ensure API responses only return once suppression telemetry has been enqueued for ingestion.

## 2025-10-31 — Zone Service Coverage Events
- Added `zone.service.attached`, `zone.service.updated`, and `zone.service.detached` catalogue entries with required metadata (coverageId, zoneId, serviceId, companyId, coverageType) so coverage lifecycle is captured alongside core zone events.【F:backend-nodejs/src/services/analyticsEventService.js†L1-L120】
- Zone service synchronisation now emits the new events when providers attach/update/detach coverage, propagating actor metadata and replace deletions via batch analytics emission helpers.【F:backend-nodejs/src/services/zoneService.js†L321-L515】
