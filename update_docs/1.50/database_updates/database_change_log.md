## 2025-02-21 – User & Company PII Encryption
- Added migration `20250306000000-encrypt-user-company-pii.js` to backfill encrypted payloads for user/customer records and drop plaintext columns.
- Introduced deterministic hash indexes (`email_hash`, `contact_email_hash`) to preserve query performance while removing cleartext uniqueness constraints.

## 2025-03-28 – Compliance & Region Governance
- Added migration `20250320000000-compliance-data-governance.js` establishing the `regions` catalogue, GDPR request ledger, finance transaction history, message history, and storefront revision log tables.
- Backfilled existing orders, users, escrows, disputes, rentals, messages, and storefront records with default region assignments to maintain referential integrity.
- Created retention indexes on finance/message/storefront history tables and introduced cascade-friendly foreign keys for compliance-safe purges.

## 2025-04-08 – Data Subject Request SLA Indexing
- Added migration `20250323000000-enhance-data-subject-requests.js` introducing a nullable `due_at` column with composite index (`status`, `due_at`) to accelerate SLA and due-soon analytics.
- Populated existing requests with SLA-aligned `due_at` values based on the configurable `requestSlaDays` setting to avoid null gaps in historical reporting.
- Migration is idempotent and includes a down script removing the column/index while restoring the previous schema for rollback rehearsals.
