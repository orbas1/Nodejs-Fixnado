# Database Pre-Update Evaluation (v1.00)

## Functionality
- The payments orchestration migration creates four new tables plus nine foreign-key columns in one shot without transactional guards, so a partial failure leaves dangling FKs and enum types. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Communications inbox tables assume each tenant has a single configuration (unique `tenant_id`), which conflicts with multi-region requirements captured elsewhere in the roadmap. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- Customer notification recipients have no uniqueness constraint on `(account_setting_id, channel, target)`, so duplicate destinations will be inserted freely and spam the same contact. (`backend-nodejs/src/database/migrations/20250330001000-create-customer-notification-recipients.js`).
- Core payment tables cascade deletes to users, orders, and services; removing an account or order obliterates the full financial history instead of preserving immutable ledgers for audit. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Usability & Operability
- Enum types created during migrations are never versioned or namespaced (e.g., `enum_finance_webhook_events_status`), complicating future ALTER TYPE operations and rollbacks. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- The migrations import and use `randomUUID()` to seed audit rows; that adds non-determinism to every migration run, making schema drift analysis harder between environments. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- There is no seeding strategy for communications quick replies or escalation rules, forcing operators to populate large JSON payloads manually before going live. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- Payment metadata defaults to `{}` everywhere without schema documentation, so operators will have to reverse-engineer what payloads downstream services expect. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Errors & Recovery
- `initDatabase()` tries to `CREATE EXTENSION` for PostGIS and topology without checking privileges; when it fails, the readiness state flips to `error` and the process throws, leaving no automated retry. (`backend-nodejs/src/app.js`).
- Down migrations drop enum types unconditionally but do not wrap them in `IF EXISTS` for the finance module, so re-running down migrations on partially rolled back environments will raise errors. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Communications migration drops tables but does not clean up indices explicitly; while Postgres handles dependent indexes, other dialects would leak metadata—highlighting the lack of cross-dialect testing. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- The unique `fingerprint` constraint on `payments` lacks any conflict-handling strategy, so legitimate gateway retries will error out during backfills instead of upserting, making recovery jobs fragile. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- `finance_webhook_events` never enforces uniqueness on `(provider, event_type, order_id/payment_id)`, so replayed webhook deliveries generate duplicate rows that downstream processors must dedupe manually. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Integration & Data Contracts
- The finance migration writes a bootstrap row into `finance_transaction_histories` even though downstream analytics expect only live events, skewing KPIs. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Communications schema references `CommunicationsInboxConfiguration` but the application layer has no guard ensuring configuration rows exist before inserting entry points, causing referential failures under load. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- New finance tables rely on `Region` references but do not enforce cascading deletes or default fallbacks, so deleting a region will cascade and remove historic financial records. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- `payments.gateway_reference` is nullable and lacks uniqueness, so duplicate webhooks from a PSP will generate conflicting ledger entries with no idempotency key to deduplicate. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Security & Compliance
- Storing `allowed_roles` as plain JSON without schema validation in the communications escalation table opens the door to arbitrary role injection unless the app performs strict runtime validation. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- Payment metadata is stored as unencrypted JSONB with no size limits; sensitive gateway payloads could leak if applications accidentally persist tokens. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Customer notification targets allow 320-character strings without normalization, enabling accidental storage of multiple emails separated by commas—raising privacy and opt-in compliance risks. (`backend-nodejs/src/database/migrations/20250330001000-create-customer-notification-recipients.js`).
- Finance tables expose operational metadata (`metadata` JSONB) without any masking or encryption hooks, so PCI-scoped fields could be written in clear text. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Webhook payloads and last-error columns persist full PSP responses indefinitely with no retention policy, so sensitive financial data and error strings remain in primary storage without redaction. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Alignment & Roadmap Fit
- Heavy finance schema expansion contradicts the stated focus on communications improvements for this update; migrating finance and communications together increases deployment risk. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Single-configuration communications design does not align with the roadmap’s multi-tenant multi-brand ambitions, so we should revisit cardinality before locking the schema. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- Lack of seed data for notification settings slows QA sign-off, clashing with the update goal of accelerating evaluations. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).

## Performance & Scalability
- Finance tables default to JSONB metadata without compression or pruning, so write amplification will grow rapidly as payment providers append large payloads. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Webhook events only index `(status, next_retry_at)` and omit `provider`, forcing sequential scans when replaying failures for a single PSP. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Communications entry points rely on string primary keys but lack partial indexes for `enabled = true`, hurting query performance for storefront rendering where disabled records should be filtered. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- The `payout_requests` table never indexes `provider_id`, so finance dashboards filtering by provider will trigger table scans as volume grows. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Observability & Auditing
- The bootstrap insert into `finance_transaction_histories` omits actor metadata, making it impossible to trace who executed migrations in audit trails. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Communications escalation rules store `allowed_roles` JSON blobs without created-by attribution, so later reviews cannot determine who granted privileged escalations. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).
- There is no structured logging or history table for webhook retries, making forensic analysis difficult when PSP callbacks fail repeatedly. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Finance tables omit `created_by`/`updated_by` columns even though migrations inject synthetic records, erasing the provenance of ledger changes for audits. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).

## Data Quality & Controls
- Amount columns accept negative values and there are no CHECK constraints enforcing currency codes or sane precision, so a bad deploy could write nonsense data that downstream accounting systems cannot reconcile. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- Communications escalation settings allow arbitrary JSON arrays for `allowed_roles` with no validation of role names, inviting typos that silently disable escalation. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`).

## Recommendations
- Wrap migrations in `sequelize.transaction()` and split finance and communications changes into separately deployable units.
- Add unique constraints and check constraints on recipient targets, allowed roles, and metadata payload sizes.
- Provide seed scripts or fixtures so QA can validate communications workflows without manual database edits.
- Extend indexing strategies (provider + status) and add audit columns to track migration actors and escalation owners.
- Introduce database-level validation (CHECK constraints, provider indexes, immutable history tables) before the ledger stores production payments.
