# New Backend Files

| File | Purpose |
|------|---------|
| `backend-nodejs/tests/securityGateway.test.js` | Vitest suite validating the `/healthz` diagnostics, CORS rejection flow, and rate limiting enforcement introduced in Version 1.50. |
| `backend-nodejs/tests/piiEncryption.test.js` | Regression coverage ensuring encrypted persistence, hash lookups, and company contact redaction for PII storage. |
| `backend-nodejs/src/utils/security/fieldEncryption.js` | Shared AES-256-GCM + HMAC helper providing encrypt/decrypt/hash utilities for models and migrations. |
| `backend-nodejs/src/database/migrations/20250306000000-encrypt-user-company-pii.js` | Transactional migration migrating legacy plaintext PII to encrypted columns with hashed indices. |
| `backend-nodejs/src/database/migrations/20250320000000-compliance-data-governance.js` | Builds the regions catalogue, GDPR request ledger, finance/message/storefront history tables, and supporting indexes. |
| `backend-nodejs/src/models/region.js` | Sequelize model exposing regional metadata consumed by compliance, finance, and messaging records. |
| `backend-nodejs/src/models/dataSubjectRequest.js` | Tracks GDPR data requests with status enums, audit log, metadata, and region references. |
| `backend-nodejs/src/models/financeTransactionHistory.js` | Persists immutable finance ledger events linked to orders, escrows, disputes, and regions. |
| `backend-nodejs/src/models/messageHistory.js` | Captures historical versions of conversation messages for compliance exports and audit replay. |
| `backend-nodejs/src/models/storefrontRevisionLog.js` | Records storefront revision metadata including region, actor, and snapshot payloads for export transparency. |
| `backend-nodejs/src/services/dataGovernanceService.js` | Service orchestrating data subject request submission, export generation, and retention-safe cleanup. |
| `backend-nodejs/src/jobs/dataGovernanceRetentionJob.js` | Scheduled job purging aged exports and history rows according to configurable retention windows. |
