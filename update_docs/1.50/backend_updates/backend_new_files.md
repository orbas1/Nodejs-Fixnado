# New Backend Files

| File | Purpose |
|------|---------|
| `backend-nodejs/tests/securityGateway.test.js` | Vitest suite validating the `/healthz` diagnostics, CORS rejection flow, and rate limiting enforcement introduced in Version 1.50. |
| `backend-nodejs/tests/piiEncryption.test.js` | Regression coverage ensuring encrypted persistence, hash lookups, and company contact redaction for PII storage. |
| `backend-nodejs/tests/sessionTokenService.test.js` | Exercises issuance, rotation, and revocation of refresh sessions backed by hashed tokens and SQLite fixtures. |
| `backend-nodejs/tests/consentService.test.js` | Verifies consent receipt logging, latest consent retrieval, and paginated history queries against the new consent events table. |
| `backend-nodejs/tests/secretVaultService.test.js` | Confirms AWS Secrets Manager hydration, caching, and cache invalidation flows for vaulted secrets. |
| `backend-nodejs/tests/securityHardeningMigration.test.js` | Validates the 20250315090000 migration creates/drops all security tables with indexes and tolerates rollback retries. |
| `backend-nodejs/src/utils/security/fieldEncryption.js` | Shared AES-256-GCM + HMAC helper providing encrypt/decrypt/hash utilities for models and migrations. |
| `backend-nodejs/src/database/migrations/20250306000000-encrypt-user-company-pii.js` | Transactional migration migrating legacy plaintext PII to encrypted columns with hashed indices. |
