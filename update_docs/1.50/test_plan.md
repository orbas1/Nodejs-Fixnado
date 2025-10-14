# Test Plan Addendum – Version 1.50

## Gateway Hardening Regression Coverage
- **Automated:** Added `tests/securityGateway.test.js` to verify health telemetry, origin rejection, and rate limit enforcement within Vitest. The suite consumes in-memory SQLite to keep the pipeline hermetic.
- **Manual:** Staging checklist updated to include cURL validation of `/healthz`, cross-origin browser probe from an allowed and disallowed domain, and burst testing from load-generator IP pools.
- **Monitoring Hooks:** Health endpoint output is wired into observability dashboards; failures must raise alerts through existing Slack webhook integrations.

## PII Encryption Validation
- **Automated:** Introduced `tests/piiEncryption.test.js` to confirm AES-256-GCM storage, hashed email lookups, and company contact redaction operate end-to-end under Vitest.
- **Manual:** Run migration dry-runs in staging with dummy keys before promoting production rotations; verify seeded admin accounts remain accessible post-migration.
- **Monitoring Hooks:** Add metrics/alerts tracking failed decryptions or hash mismatches; integrate with security incident response runbooks.

## Secrets Vault, Consent, and Session Assurance
- **Automated:** Added `tests/secretVaultService.test.js`, `tests/sessionTokenService.test.js`, and `tests/consentService.test.js` to validate vaulted key hydration, refresh session rotation, and consent receipt persistence. `tests/securityHardeningMigration.test.js` exercises the new migration in both directions to guard against rollback regressions.
- **Manual:** Run AWS Secrets Manager smoke tests in staging (list/get secret), rotate the JWT secret, and confirm cache invalidation via the `/healthz` diagnostics before deploying to production.
- **Monitoring Hooks:** Extend audit dashboards with cache hit/miss metrics, consent logging volumes, and rotation alerts triggered when vault credentials change without corresponding runtime cache flushes.
