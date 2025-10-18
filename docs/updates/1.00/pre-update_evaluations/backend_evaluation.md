# Backend Pre-Update Evaluation (v1.00)

## Functionality
- The aggregated router definition duplicates imports and mounts for the same modules (`walletRoutes`, `servicemanRoutes`, `servicemanControlRoutes`) which can cause last-in definitions to override earlier ones and make route-level middleware unpredictable. The duplication also bloats startup time because the same module is evaluated multiple times. (`backend-nodejs/src/routes/index.js`).
- `authenticate` attempts to support storefront fallbacks but returns twice for the same missing-token branch, so the context-specific message is never surfaced. This is a correctness bug that hides role guidance from legitimate users. (`backend-nodejs/src/middleware/auth.js`).
- Startup hard-fails whenever `PII_ENCRYPTION_KEY` or `PII_HASH_KEY` are absent because `assertPiiConfiguration()` is executed during module evaluation. That makes it impossible to run local builds unless secrets are pre-provisioned. (`backend-nodejs/src/app.js`).
- `config/index.js` performs a top-level secrets fetch via `loadSecretsIntoEnv` without a catch block. Any transient AWS Secrets Manager error (network timeouts, IAM throttle) will crash the process during import, preventing retries or degraded boot. (`backend-nodejs/src/config/index.js`).
- `server.js` immediately invokes `start()` at module scope, so simply importing the file spins up HTTP listeners and background jobs. Test harnesses or scripts that need to configure the app prior to listening cannot intercept the boot path. (`backend-nodejs/src/server.js`).

## Usability & Operability
- The readiness API forces PostGIS extension creation and verification during `initDatabase()`. Tenants who connect with non-superuser roles will see boot loops because the migration tries to install extensions they cannot create. (`backend-nodejs/src/app.js`).
- `express-rate-limit` uses a custom `keyGenerator` that dereferences `req.headers[config.security?.clientIpHeader]` even when that value is undefined, so calling `.split()` on `undefined` throws for proxied requests unless the header name is configured. (`backend-nodejs/src/app.js`).
- Config helpers (`requireEnv`) throw synchronous errors when env vars are missing, but the application never surfaces actionable remediation guidance or defaults for local developers, reducing operability. (`backend-nodejs/src/config/index.js`).
- Graceful shutdown always ends with `process.exit(...)`, even on recoverable signals, which prevents orchestrators from deciding whether to keep the container alive for debugging. (`backend-nodejs/src/server.js`).
- The generated configuration duplicates the `finance.commissionRates` assignment, so any manual edits are silently overwritten by the second definition—masking config drift and signalling unresolved merge conflicts. (`backend-nodejs/src/config/index.js`).

## Error Handling & Reliability
- The authentication middleware logs and wraps security events, but duplicate `recordSecurityEvent` calls combined with inconsistent `metadata` assignments risk throwing if the audit service rejects duplicate payload shapes. (`backend-nodejs/src/middleware/auth.js`).
- Several migrations (for example payments orchestration) perform dozens of DDL operations sequentially without wrapping them in a transaction, so a midway failure leaves the schema partially applied and inconsistent. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- The `healthz` endpoint relies on `sequelize.query('SELECT 1')`, but failures inside `measureDatabaseHealth` swallow stack information by returning only `error.message`, complicating incident debugging. (`backend-nodejs/src/app.js`).
- When the rate limiter fires it returns JSON but omits the standard `Retry-After` header, so clients cannot back off automatically and will likely retry aggressively, turning a throttling event into a self-inflicted denial of service. (`backend-nodejs/src/app.js`).

## Integration & Data Contracts
- New finance tables insert bootstrap rows into `finance_transaction_histories` even when downstream services might not expect synthetic `migration.bootstrap` events; consumers that assume chronological ordering from live data will misinterpret these rows. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`).
- `verifyAccessToken` silently falls back to a permissive JWT decode for any verification error, even outside test environments, so upstream identity providers cannot rely on stricter issuer/audience enforcement. (`backend-nodejs/src/services/sessionService.js`).
- `initDatabase` assumes PostgreSQL and runs PostGIS-specific SQL, yet the service advertises a configurable dialect. Using MySQL or SQLite will set readiness to `ready` but the rest of the code expects GIS functions, leading to latent runtime errors. (`backend-nodejs/src/app.js`).
- `router.use('/', v1Router);` re-mounts the versioned API at the root path, so clients can bypass semantic versioning and cached middleware assumptions by calling legacy URLs that are now aliased to v1. (`backend-nodejs/src/routes/index.js`).
- Telemetry routing only accepts `/telemetry/ui-preferences`; client error posts to `/telemetry/client-errors` receive 404s because no such controller exists, so browser crash reports never reach the backend. (`backend-nodejs/src/routes/telemetryRoutes.js`).

## Security & Compliance
- Allowing inline session bootstrapping in tests through headers (`x-fixnado-role`) is valuable, but the guard only checks `NODE_ENV === 'test'`. Any misconfigured staging environment will effectively allow header-based impersonation. (`backend-nodejs/src/middleware/auth.js`).
- JWT verification falls back to accepting any token signed with the shared secret regardless of issuer or audience, weakening trust boundaries between services. (`backend-nodejs/src/services/sessionService.js`).
- Secrets loading is synchronous and logged to `console`, leaking stack traces that may contain AWS account metadata when bootstrapping fails. (`backend-nodejs/src/config/index.js`).
- Helmet disables `contentSecurityPolicy` and `crossOriginEmbedderPolicy`, so the server ships with relaxed headers that widen the attack surface for dashboard embeds and inline scripts. (`backend-nodejs/src/app.js`).
- The CORS guard treats an empty allowlist as “allow everything” while still enabling `credentials`, effectively reflecting arbitrary origins and cookies—turning the API into a cross-origin session fixation target. (`backend-nodejs/src/app.js`).

## Alignment & Roadmap Fit
- The router exposes dozens of domains (finance, escrow, marketplace, serviceman control) but we lack matching feature flags or maturity gates, so delivery risk is high for teams expecting narrower scope. (`backend-nodejs/src/routes/index.js`).
- Required PostGIS capabilities suggest heavy geospatial features, yet there are no integration tests or fallback paths; this is misaligned with multi-cloud deployment stories that may not offer PostGIS. (`backend-nodejs/src/app.js`).
- Configuration enforces production-grade PII encryption even in development, conflicting with the update goal of accelerating evaluations and prototyping. (`backend-nodejs/src/app.js`).

## Performance & Scalability
- Cold starts block on `await loadSecretsIntoEnv({ stage: 'config-bootstrap' })` during import, adding network latency to every process fork and amplifying cascading failures if AWS Secrets Manager degrades. (`backend-nodejs/src/config/index.js`).
- Background jobs for telemetry, analytics, finance, and credential rotation all start on boot for every pod without feature gating or concurrency limits, risking duplicate processing and database contention as the fleet scales. (`backend-nodejs/src/jobs/index.js`).
- The API mounts the same router multiple times (`/servicemen`, `/serviceman`, `/serviceman-control`), multiplying middleware work per request and inflating the Express routing table beyond what Node's single-threaded event loop handles efficiently under load. (`backend-nodejs/src/routes/index.js`).
- Secrets sync metrics are written with `console.info` for every boot (`server.js`), and coupled with per-instance background jobs they inflate I/O contention and startup time as more pods come online simultaneously. (`backend-nodejs/src/server.js`).

## Observability & Tooling
- Readiness tracking only updates in-memory state; there is no persistence or metrics export, so orchestrators cannot reconstruct component failures after a crash. (`backend-nodejs/src/app.js`).
- Startup and shutdown paths rely solely on `console` logging without structured context or log levels, making it harder for centralised logging to parse severity or correlate events. (`backend-nodejs/src/server.js`).
- `measureDatabaseHealth` hides slow-query timings once the timeout elapses, depriving SREs of latency telemetry needed to tune connection pools. (`backend-nodejs/src/app.js`).
- Rate limiting responses skip emitting standard telemetry (no counters or structured logs), so operators cannot distinguish abusive bursts from normal load and cannot set automated alerts. (`backend-nodejs/src/app.js`).

## Deployment & Release Readiness
- Because `server.js` boots immediately and invokes `process.exit` on most error paths, deployment tooling cannot run smoke tests against the app in-process; any boot issue terminates the container before health probes can react. (`backend-nodejs/src/server.js`).
- Background jobs lack configuration toggles or health hooks, so blue/green deployments cannot disable long-running tasks in the idle environment without code changes. (`backend-nodejs/src/jobs/index.js`).

## Recommendations
- Deduplicate and modularise route registration so each domain router is mounted once and behind appropriate guards.
- Defer PII configuration and secrets validation until after the logger and telemetry are initialised so failures produce actionable diagnostics without killing the process.
- Harden authentication by removing the permissive JWT fallback, clarifying storefront header overrides, and ensuring audit logging cannot throw.
- Wrap large migrations in `sequelize.transaction()`, gate background jobs behind feature flags, and emit structured readiness metrics for observability parity.
