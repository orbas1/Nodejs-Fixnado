# New Backend Files

| File | Purpose |
|------|---------|
| `backend-nodejs/tests/securityGateway.test.js` | Vitest suite validating the `/healthz` diagnostics, CORS rejection flow, and rate limiting enforcement introduced in Version 1.50. |
| `backend-nodejs/tests/piiEncryption.test.js` | Regression coverage ensuring encrypted persistence, hash lookups, and company contact redaction for PII storage. |
| `backend-nodejs/src/utils/security/fieldEncryption.js` | Shared AES-256-GCM + HMAC helper providing encrypt/decrypt/hash utilities for models and migrations. |
| `backend-nodejs/src/database/migrations/20250306000000-encrypt-user-company-pii.js` | Transactional migration migrating legacy plaintext PII to encrypted columns with hashed indices. |
