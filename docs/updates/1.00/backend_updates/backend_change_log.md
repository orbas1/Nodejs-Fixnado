# Backend Change Log

## Authentication hardening (Version 1.00)
- Enforced strict JWT verification parameters (issuer, audience, clock tolerance, max age) and reused them during signing so all session lifecycles honour the same guarantees.【F:backend-nodejs/src/config/index.js†L95-L104】【F:backend-nodejs/src/config/index.js†L353-L380】【F:backend-nodejs/src/services/sessionService.js†L1-L168】
- Delivered structured remediation messaging and correlation-aware audit logging in the authentication middleware, eliminating duplicate responses and giving clients actionable recovery steps for denied requests.【F:backend-nodejs/src/middleware/auth.js†L1-L305】

## Router consolidation & launch gating (Version 1.00)
- Refactored the API router to eliminate the duplicate `/` mirror of `/v1`, enforce single registrations per router module, and describe surface mounts in a declarative table for consistent ordering across releases.【F:backend-nodejs/src/routes/index.js†L1-L174】
- Introduced feature toggle guards for finance and serviceman domains that authenticate before evaluation, emit denial audits, and surface toggle metadata in headers so staged rollouts stay contained until stakeholders approve access.【F:backend-nodejs/src/routes/index.js†L40-L167】【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L1-L147】

## CORS, Helmet, and storefront override hardening (Version 1.00)
- Replaced the permissive CORS fallback with environment-aware allowlists, wildcard/regex evaluators, and explicit rejection logging so only sanctioned origins receive credentials while null origins lose cookie access.【F:backend-nodejs/src/app.js†L128-L217】【F:backend-nodejs/src/app.js†L270-L338】
- Restored secure Helmet defaults (CSP, COEP, CORP, referrer, HSTS) and enriched the rate limiter with `Retry-After`/`RateLimit-Policy` headers plus correlation-aware responses to unblock client backoff strategies.【F:backend-nodejs/src/app.js†L222-L313】【F:backend-nodejs/src/app.js†L360-L407】
- Introduced a dedicated storefront override service so header-based persona shims require signed override tokens, persona allowlists, and audit trails before middleware accepts unauthenticated storefront access.【F:backend-nodejs/src/services/storefrontOverrideService.js†L1-L165】【F:backend-nodejs/src/middleware/auth.js†L94-L214】

## Telemetry ingestion & alerting (Version 1.00)
- Added Sequelize models and migrations for client error events and mobile crash reports, enforcing retention windows, hashed device identifiers, and alert thresholds that can dispatch Slack notifications when crashes spike.【F:backend-nodejs/src/models/clientErrorEvent.js†L1-L126】【F:backend-nodejs/src/models/mobileCrashReport.js†L1-L143】【F:backend-nodejs/src/database/migrations/20250525000000-create-telemetry-ingestion.js†L1-L247】【F:backend-nodejs/src/config/index.js†L637-L681】
- Implemented telemetry service ingestion that sanitises payloads, correlates events, applies retention trimming, and delegates optional alert delivery without crashing when Slack webhooks are disabled in lower environments.【F:backend-nodejs/src/services/telemetryService.js†L530-L1045】
- Exposed `/v1/telemetry/client-errors` and `/v1/telemetry/mobile-crashes` routes with validation and controller logic so browser and Flutter reporters can register errors reliably with per-tenant segregation and request-level correlation IDs.【F:backend-nodejs/src/controllers/telemetryController.js†L325-L420】【F:backend-nodejs/src/routes/telemetryRoutes.js†L1-L96】

## Lifecycle & readiness governance (Version 1.00)
- Replaced the auto-starting `server.js` entry point with a `createServer()` factory that defers secrets loading, exposes deterministic `start()`/`stop()` hooks, and publishes readiness transitions for orchestrators and tests.【F:backend-nodejs/src/server.js†L1-L204】
- Added structured logging utilities and Prometheus metrics so the rate limiter, health probes, and readiness endpoints emit correlation-aware diagnostics and persistent snapshots across restarts.【F:backend-nodejs/src/utils/logger.js†L1-L69】【F:backend-nodejs/src/observability/metrics.js†L1-L81】
- Hardened `app.js` to generate correlation IDs, persist readiness snapshots, expose `/metrics`, and record database health latency without attempting unsafe PostGIS creations on every boot.【F:backend-nodejs/src/app.js†L1-L536】

## Finance & communications data lifecycle (Version 1.00)
- Refactored the payments orchestration migration into a transactional unit that enforces soft deletes, retention windows, digest-based webhook de-duplication, and audit columns for every finance table touched during settlement flows.【F:backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js†L1-L330】
- Expanded communications inbox schemas to support multi-region tenants, partial indexes for enabled entry points, and role validation checks that prevent misconfigured quick replies or escalation rules from bypassing governance.【F:backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js†L1-L176】
- Normalised customer notification recipients with hashed/normalised targets, consent metadata, and channel validation, closing duplication loopholes while preserving GDPR erasure audit trails.【F:backend-nodejs/src/database/migrations/20250330001000-create-customer-notification-recipients.js†L1-L84】
- Seeded deterministic QA reference data for communications, finance webhook audits, and zone-aware dashboards so integration suites can rely on stable identifiers across environments.【F:backend-nodejs/src/database/seeders/20250530000000-qa-reference-data.js†L1-L167】

## Dependency manifest repair & runtime governance (Version 1.00)
- Rebuilt `package.json`/`package-lock.json` to remove duplicate keys, declare the npm 11.4.2 toolchain, and pin Sequelize/Postgres drivers plus bcrypt to audited versions so dependency drifts can no longer silently land through caret upgrades.【F:backend-nodejs/package.json†L1-L58】【F:backend-nodejs/package-lock.json†L1-L54】
- Introduced a CommonJS-compatible environment loader that wraps `dotenv@16.4.5`, enabling legacy migration and load-test scripts to boot with the same env semantics as the ESM application entry point.【F:backend-nodejs/scripts/register-env.cjs†L1-L63】
- Captured the ORM and runtime baseline in an ADR to require explicit sign-off before future migrations away from Sequelize 6.37.7 or Node 20.x, ensuring release governance stays aligned with Version 1.00 commitments.【F:docs/updates/1.00/backend_updates/orm_runtime_adr.md†L1-L32】
