## 2025-10-13 — Postgres/PostGIS Platform Migration
- Terraform now provisions Amazon RDS PostgreSQL 15 with PostGIS and pg_stat_statements enabled, replacing the former MySQL instance while retaining subnet/KMS hardening.
- Backend bootstrap (`src/app.js`) creates PostGIS, topology, and `uuid-ossp` extensions on start-up and aborts with actionable errors when privileges are missing.
- Added `feature_toggle_audits` table for Secrets Manager updates, ensuring feature rollout changes are journaled with actor, rollout, and ticket metadata.

## 2025-10-17 — Inventory & Rental Schema Expansion
- Migration `20250217000000-create-inventory-and-rentals.js` adds `inventory_items`, `inventory_ledger_entries`, `inventory_alerts`, `rental_agreements`, and `rental_checkpoints` tables with UUID PKs, deposit/insurance fields, inspection metadata, audit timestamps, and indexes on foreign keys + alert status to support health queries and queue dashboards.
- Established cascading associations and transactional constraints so inventory reservations/ledger entries update atomically with rental agreements, preventing orphaned rental records or inconsistent stock counts across sqlite/Postgres environments.

## 2025-10-18 — Compliance & Marketplace Moderation Schema
- Migration `20250218000000-compliance-and-marketplace-moderation.js` introduces `ComplianceDocument`, `InsuredSellerApplication`, and `MarketplaceModerationAction` tables plus new columns on `Company` and `MarketplaceItem` to persist document submissions, review status, badge visibility, compliance hold windows, and moderation audit trails.
- Added enums and JSON columns compatible with Postgres + sqlite for document status tracking, required document snapshots, and moderation metadata; seed indexes support fast moderation queue lookups and company compliance summary queries.

## 2025-10-19 — Campaign Manager Schema
- Migration `20250219000000-create-campaign-manager.js` creates `ad_campaigns`, `campaign_flights`, `campaign_targeting_rules`, `campaign_invoices`, and `campaign_daily_metrics` tables with UUID primary keys, spend/impression indexes, enum governance, and cascading constraints tying campaigns to companies and finance ledgers.
- Rollback path drops enum types and dependent indexes cleanly for Postgres while maintaining sqlite compatibility, and the migration seeds targeting type enums plus invoice status defaults to keep staging/prod aligned.

## 2025-10-20 — Monetisation Analytics Outbox & Fraud Signals
- Extended migration `20250219000000-create-campaign-manager.js` with governed `campaign_analytics_exports` and `campaign_fraud_signals` tables capturing warehouse outbox payloads, retry metadata, anomaly classifications, and resolution notes. Foreign keys cascade with campaign + flight deletions to avoid orphan telemetry.
- Added indexes for export status and fraud signal lookup plus Postgres enum teardown in the down migration (`enum_CampaignFraudSignal_*`, `enum_CampaignAnalyticsExport_status`) so schema rollback clears type dependencies without manual intervention across environments.

## 2025-10-22 — Communications Schema
- Migration `20250221000000-create-communications.js` creates `conversations`, `conversation_participants`, `conversation_messages`, and `message_deliveries` tables with UUID primary keys, role enums, AI assist metadata JSON, quiet-hour window columns, and delivery receipt tracking.
- Added indexes on `(conversationId, sentAt)` and `(participantId, readAt)` plus foreign keys to `Company`/`User` tables to support fast thread retrieval, unread counts, and audit queries for compliance.
- Down migration drops enums and dependent tables in dependency order to keep sqlite/Postgres parity; retention window column defaults align with communications config for consistent clean-up jobs.

## 2025-10-24 — Analytics Events Schema
- Migration `20250223000000-create-analytics-events.js` introduces `analytics_events` with UUID primary key, event name, domain, schema version, entity identifiers, tenant ID, actor metadata, source/channel fields, occurred timestamp, and JSONB metadata column.
- Added compound index on (`tenantId`, `domain`, `occurredAt DESC`) plus GIN index on `metadata` for Postgres to accelerate warehouse ingestion filters; sqlite fallback uses partial indexes for test determinism.
- Down migration drops indexes before table removal to maintain Postgres/sqlite parity; retention guidance references 400-day default with retention overrides tracked in analytics governance runbook.

## 2025-10-26 — Analytics Ingestion & Retention Metadata
- Migration `20250224000000-augment-analytics-events.js` augments `analytics_events` with ingestion governance columns (`ingestedAt`, `ingestionAttempts`, `lastIngestionError`, `nextIngestAttemptAt`, `retentionExpiresAt`) and supporting indexes on `nextIngestAttemptAt` and `retentionExpiresAt` to accelerate retry scheduling and purge queries.
- Backfills existing rows with default attempt counts and schedules immediate ingestion for legacy events, ensuring the new background job can resume without manual intervention.
- Down migration removes added columns/indexes while preserving base analytics event data so prior pipelines remain functional if rollback is required.
