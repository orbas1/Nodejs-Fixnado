# Configuration Changes

## Security Namespaces Added to `src/config/index.js`
- Introduced a `security` configuration branch with sub-namespaces for `cors`, `bodyParser`, `rateLimiting`, and `health` so operational policies can be expressed via environment variables and audited centrally.
- Expanded the `security` namespace with a `shutdown.timeoutMs` control feeding graceful shutdown timers to match load balancer drain windows and `/readyz` transitions.
- Added intelligent parsers (`boolFromEnv`, `listFromEnv`, etc.) to safely consume comma-separated allowlists and human-readable booleans while defaulting to production-safe values.
- Normalised trusted proxy and client IP header handling, enabling reverse proxies/CDNs to be configured without code changes.

## Defaults Tuned for Production Gateways
- JSON and URL-encoded payload sizes now default to `1mb` but can be restricted per-environment via `REQUEST_JSON_LIMIT` and `REQUEST_URLENCODED_LIMIT`.
- Rate limiting defaults to a 1-minute window and 120 requests per client, with overrides for header behaviour and success skipping, preparing us for burst management once environment load profiles are known.
- Database health checks expose a configurable timeout (`HEALTHCHECK_DB_TIMEOUT_MS`) ensuring slow replicas are caught during readiness probes.

## PII Configuration Visibility
- Added a `security.pii` namespace exposing whether the encryption and hash keys are present, alongside optional rotation identifiers.
- Application startup now fails fast if the encryption or hash keys are missing, preventing plaintext persistence in misconfigured environments.

## Data Governance Retention Controls
- Introduced a `dataGovernance` configuration branch exposing retention windows for exports, message history, and finance events plus the scheduler cadence (`DATA_GOVERNANCE_SWEEP_MINUTES`).
- Defaults retain access exports for two years, message histories for one year, and finance transactions for seven years, aligning with GDPR and accounting obligations while remaining overrideable per environment.
- Retention values are validated for sensible minimums to avoid accidental short-lived purges during configuration mistakes.

### SLA & Metrics Windows
- Added `dataGovernance.requestSlaDays` and `dataGovernance.dueSoonWindowDays` configuration keys (overrideable via `DATA_GOVERNANCE_REQUEST_SLA_DAYS` and `DATA_GOVERNANCE_DUE_SOON_WINDOW_DAYS`) to drive due-date assignments and dashboard due-soon calculations.
- Configuration defaults align with legal’s 30-day SLA and a five-day due-soon warning window; both values feed the upgraded metrics endpoint and UI KPI messaging.
- Vitest and Supertest suites stub these values during tests to ensure analytics remain deterministic under different SLA policies.

## Database TLS & Rotation Defaults
- Production and staging environments now enforce database TLS by default; `DB_SSL` defaults to `true` with optional CA configuration via `DB_SSL_CA_FILE` or `DB_SSL_CA_BASE64`, and the service refuses to boot if TLS is disabled in these environments.
- Added a `database.rotation` namespace capturing rotation enablement, secret ARN, intervals, AWS region, and TLS enforcement; the credential rotation job consumes this configuration to manage password changes.
- Secrets Manager refreshes after rotation update in-process configuration (`sequelize.config.password`) ensuring new connections immediately use the rotated credential set.

## Data Warehouse Export Controls
- Added a `dataWarehouse` configuration branch exposing export root, interval, batch size, dataset configuration overrides, and default region lists to drive CDC scheduling.
- Dataset configuration accepts per-dataset lookback windows, minimum run spacing, and region scoping, letting operators tune export cadence without redeploying the service.
- Exports default to writing under `storage/warehouse-exports/<REGION>/<dataset>` but can be redirected via `DATA_WAREHOUSE_EXPORT_ROOT` for S3 or persistent volume mounts.
