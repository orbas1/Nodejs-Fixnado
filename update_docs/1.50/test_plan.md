# Test Plan Addendum – Version 1.50

## Gateway Hardening Regression Coverage
- **Automated:** Added `tests/securityGateway.test.js` to verify health telemetry, origin rejection, and rate limit enforcement within Vitest. The suite consumes in-memory SQLite to keep the pipeline hermetic.
- **Manual:** Staging checklist updated to include cURL validation of `/healthz`, cross-origin browser probe from an allowed and disallowed domain, and burst testing from load-generator IP pools.
- **Monitoring Hooks:** Health endpoint output is wired into observability dashboards; failures must raise alerts through existing Slack webhook integrations.

## PII Encryption Validation
- **Automated:** Introduced `tests/piiEncryption.test.js` to confirm AES-256-GCM storage, hashed email lookups, and company contact redaction operate end-to-end under Vitest.
- **Manual:** Run migration dry-runs in staging with dummy keys before promoting production rotations; verify seeded admin accounts remain accessible post-migration.
- **Monitoring Hooks:** Add metrics/alerts tracking failed decryptions or hash mismatches; integrate with security incident response runbooks.

## Session Integrity & Token Rotation
- **Automated:** Added `tests/sessionService.test.js` validating refresh-token hashing, JWT issuance, cookie policies, and rotation persistence to guarantee hardened session behaviour.
- **Manual:** Verify browser login flows receive secure/httpOnly cookies while Flutter builds ingest bearer tokens; confirm biometric unlock gating on devices with Face ID/Touch ID and passcode fallback for those without biometrics.
- **Monitoring Hooks:** Track session creation, rotation, and revocation metrics; alert when refresh failures spike or cookie issuance deviates from expected secure/httpOnly flags.

## Consent Ledger Validation
- **Automated:** `tests/consentService.test.js` covers subject resolution, required-policy enforcement, stale consent detection, and metadata persistence to ensure the ledger behaves predictably.
- **Manual:** Exercise consent banner (web) and overlay (Flutter) flows to confirm anonymous subject provisioning, acceptance, and withdrawal events all persist and refresh correctly.
- **Monitoring Hooks:** Capture consent decision rates, stale-policy counts, and audit trail emissions; alert on spikes in withdrawals or failed ledger writes.

## Scam Detection Heuristic Coverage
- **Automated:** `tests/scamDetectionService.test.js` verifies heuristic scoring thresholds, Opsgenie escalation toggles, AI enrichment fallbacks, and risk metadata serialization during booking creation.
- **Manual:** Execute booking creation scenarios (low/medium/high risk) via API client to confirm risk annotations appear in analytics and Opsgenie notifications trigger when configured.
- **Monitoring Hooks:** Track scam detection latency, AI enrichment timeouts, and escalation volumes to ensure heuristics remain performant and actionable in production.
