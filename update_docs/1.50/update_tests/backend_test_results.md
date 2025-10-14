# Backend Test Execution – Version 1.50

## 2025-03-01 Regression Attempt
- **Command:** `npm test`
- **Result:** Failing – Vitest halts on an existing parse error in `src/services/panelService.js`, preventing the legacy route suites from executing. The failure replicates across all route-focused specs and predates the vault changes. 【bee1ba†L1-L40】

## Targeted Secrets & Consent Coverage
- **Command:** `npx vitest run tests/secretVaultService.test.js tests/sessionTokenService.test.js tests/consentService.test.js tests/securityHardeningMigration.test.js`
- **Result:** Passing – Confirms vault hydration, session token rotation, consent logging, and migration rollback behaviour while the broader suite remains blocked on the panel service debt. 【47c3d5†L1-L15】

> **Follow-up:** Unblock `panelService.js` parsing to restore full-suite execution; once resolved, re-run `npm test` to capture a passing baseline.
