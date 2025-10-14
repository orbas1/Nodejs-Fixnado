## 2025-02-21 – User & Company PII Encryption
- Added migration `20250306000000-encrypt-user-company-pii.js` to backfill encrypted payloads for user/customer records and drop plaintext columns.
- Introduced deterministic hash indexes (`email_hash`, `contact_email_hash`) to preserve query performance while removing cleartext uniqueness constraints.
