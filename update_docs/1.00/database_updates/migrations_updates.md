## 2025-10-13 — Feature Toggle Audit Table
- Added `20250215000000-feature-toggle-audit.js` migration creating `feature_toggle_audits` with rollout states, actor, ticket, and timestamp columns plus indexes on `toggle_key` and `changed_at` for reporting.
- Updated existing bootstrap migration to use `Sequelize.UUIDV4` defaults so Postgres and sqlite environments share the same UUID strategy without MySQL-specific literals.

## 2025-10-17 — Inventory & Rental Tables
- Added `20250217000000-create-inventory-and-rentals.js` migration establishing `inventory_items`, `inventory_ledger_entries`, `inventory_alerts`, `rental_agreements`, and `rental_checkpoints` with foreign key relationships, partial indexes on alert status/severity, and composite indexes for ledger lookups (itemId + occurredAt) to support health dashboards and reconciliation exports.
- Migration seeds default enumerations (alert statuses, rental statuses, checkpoint types) and enforces cascading deletes/updates so rental agreement closures reconcile outstanding ledger reservations, keeping sqlite test runs consistent with production Postgres semantics.

## 2025-10-18 — Compliance & Marketplace Moderation Tables
- Added `20250218000000-compliance-and-marketplace-moderation.js` creating `ComplianceDocument`, `InsuredSellerApplication`, `MarketplaceModerationAction`, and extending `Company`/`MarketplaceItem` with insured status columns, moderation metadata, compliance holds, and JSON snapshots.
- Migration backfills enums for compliance/marketplace statuses, adds composite index on `(entity_type, entity_id)` for moderation queries, and drops enum types during rollback for Postgres parity while remaining sqlite-compatible.

## 2025-10-19 — Campaign Manager Tables
- Added `20250219000000-create-campaign-manager.js` establishing `ad_campaigns`, `campaign_flights`, `campaign_targeting_rules`, `campaign_invoices`, and `campaign_daily_metrics` with foreign keys, partial indexes for active flights, invoice due-date indexes, and JSONB targeting payload snapshots.
- Migration seeds targeting type enum values (`GEO_RADIUS`, `CATEGORY`, `AUDIENCE_SEGMENT`, `SLOT_TYPE`), normalises currency defaults, and implements rollback to drop tables/enums + restore previous targeting enum values to keep migrations reversible across environments.

## 2025-10-20 — Analytics Outbox & Fraud Signal Extensions
- Updated `20250219000000-create-campaign-manager.js` to append `campaign_analytics_exports` (warehouse outbox with payload JSON, status, retry metadata) and `campaign_fraud_signals` (anomaly catalogue with severity, resolution notes) plus related indexes for status lookups.
- Added Postgres-specific enum teardown for the new tables during rollback and documented export/fraud schema relationships so downstream ingestion jobs and fraud ops dashboards can rely on governed data contracts.
