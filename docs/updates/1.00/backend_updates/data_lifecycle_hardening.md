# Data lifecycle hardening (Version 1.00)

## Summary
We introduced transactional finance and communications migrations, hashed notification targets, and retention-aware QA seeds so the platform can satisfy PCI/privacy obligations during Version 1.00 launch rehearsals.

## Details
- **Finance orchestration tables** now run inside a single transaction, replace cascade deletes with soft-delete metadata, enforce positive amount/currency checks, and record retention expiries for payments, payout requests, invoices, webhook events, and transaction histories.【F:backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js†L1-L327】
- **Webhook retention evidence** includes a dedicated `finance_webhook_event_attempts` audit table and SHA-256 digests to de-duplicate events while preserving per-attempt response telemetry.【F:backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js†L200-L284】
- **Communications inbox schema** supports multi-region tenants, explicit audit columns, role validation, and partial indexes for enabled entry points, ensuring routing parity across EU/US footprints.【F:backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js†L1-L176】
- **Notification recipients** store normalised contact hashes with channel checks and consent metadata so GDPR erasure and duplication safeguards can run automatically.【F:backend-nodejs/src/database/migrations/20250330001000-create-customer-notification-recipients.js†L1-L84】
- **Deterministic QA seed data** provisions a London coverage zone, finance webhook evidence, and quick replies for release war rooms, enabling downstream dashboards/tests to rely on stable fixture IDs.【F:backend-nodejs/src/database/seeders/20250530000000-qa-reference-data.js†L1-L167】

## Operational guidance
- Finance payloads referencing customer PII must populate `metadata_encryption_key_id` and `retention_expires_at`; compliance scripts can rely on these fields to schedule archival/deletion jobs.
- Notification ingestion should normalise and hash targets before persistence. Hash mismatches indicate drift from the deterministic QA dataset.
- QA teams can re-run the reference seeder between environments to guarantee consistent zone IDs and webhook digests for contract tests.
