# Pre-Update Fix Suggestions (v1.00)

1. **Harden backend authentication and routing**
   - Remove the permissive JWT decode fallback, enforce issuer/audience validation, and gate the `x-fixnado-role` override behind explicit environment allowlists. (`backend-nodejs/src/services/sessionService.js`, `backend-nodejs/src/middleware/auth.js`)
   - Deduplicate router mounts, keep `v1` routed only under `/v1`, and introduce feature flags around finance/serviceman domains before exposing them publicly. (`backend-nodejs/src/routes/index.js`, `backend-nodejs/src/config/index.js`)
   - Replace wildcard CORS with explicit origin allowlists, re-enable Helmet CSP/COEP, and stop logging secrets or stack traces during config bootstrap. (`backend-nodejs/src/app.js`, `backend-nodejs/src/config/index.js`)
   - Fix the double return in `authenticate`, add structured audit logs, and surface remediation guidance to storefront callers when tokens are missing or expired. (`backend-nodejs/src/middleware/auth.js`)

2. **Stabilise backend lifecycle and readiness**
   - Defer secrets loading, PII assertions, and job scheduler startup until after logging initialises, and expose a `createServer().start()` entry point that callers control. (`backend-nodejs/src/config/index.js`, `backend-nodejs/src/jobs/index.js`, `backend-nodejs/src/server.js`)
   - Update readiness probes to detect PostGIS capability without mutating extensions, add retries/backoff for Secrets Manager, and emit structured health telemetry instead of bare console output. (`backend-nodejs/src/app.js`, `backend-nodejs/src/config/index.js`)
   - Rework rate-limiter configuration to handle missing proxy headers gracefully, emit `Retry-After`, and publish metrics for throttled requests. (`backend-nodejs/src/app.js`)
   - Capture full stack traces and timings in database health checks, and provide operator runbooks for resolving config/env gaps. (`backend-nodejs/src/app.js`, `docs/updates/1.00`)

3. **Repair database safety, data quality, and compliance**
   - Split finance/communications migrations into smaller, idempotent units wrapped in `sequelize.transaction()` blocks, add guard clauses to down migrations, and avoid destructive cascades that erase ledger history. (`backend-nodejs/src/database/migrations`)
   - Introduce uniqueness/idempotency constraints for webhook events and notification recipients, require deterministic seed data, and add partial indexes for provider/status lookups. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`, `backend-nodejs/src/database/migrations/20250330001000-create-customer-notification-recipients.js`)
   - Enforce CHECK constraints on amounts/currency, add audit columns (`created_by`, `updated_by`), and document retention/encryption strategies for sensitive JSONB payloads. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`, `docs/updates/1.00/pre-update_evaluations`)
   - Allow multiple communications configurations per tenant, validate `allowed_roles` against canonical role tables, and provide seeded fixtures for QA environments. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`)

4. **Govern dependencies and build chain**
   - Correct the malformed backend `package.json`, downgrade unstable packages (`bcrypt@6`), and migrate CommonJS loaders off `require('dotenv')` before adopting ESM-only releases. (`backend-nodejs/package.json`)
   - Align runtime baselines (Node 18+, Android SDK 23+) with documented `engines`/SDK constraints, enforce lockfile verification in CI, and regenerate Flutter locks via `flutter pub get`. (`backend-nodejs/package.json`, `frontend-reactjs/package.json`, `flutter-phoneapp/pubspec.yaml`, `flutter-phoneapp/pubspec.lock`)
   - Rationalise the geospatial/web dependency stack by selecting MapLibre-compatible drawing libraries, trimming redundant Turf bundles, and running bundle analysis in CI. (`frontend-reactjs/package.json`)
   - Wire `scripts/security-audit.mjs`, load-test prerequisites, and license scanning into pull-request workflows so risky upgrades are blocked automatically. (`scripts/security-audit.mjs`, `scripts/run-load-tests.mjs`)

5. **Secure and streamline the web client**
   - Rebuild `useSession` to fetch `/api/auth/me`, invalidate corrupted storage, and move persona unlock checks to signed server responses with audit trails. (`frontend-reactjs/src/hooks/useSession.js`, `frontend-reactjs/src/pages/DashboardHub.jsx`)
   - Break `App.jsx` into persona-scoped routers with per-route `Suspense`/error boundaries, guard provider dashboards behind onboarding redirects, and restore persistent legal/help footers post-login. (`frontend-reactjs/src/App.jsx`, `frontend-reactjs/src/components/auth/ProviderProtectedRoute.jsx`)
   - Sanitize error boundaries so stack traces stay server-side, instrument telemetry for route transitions/persona grants, and align client reporters with the new backend telemetry endpoints. (`frontend-reactjs/src/components/error/AppErrorBoundary.jsx`, `frontend-reactjs/src/components/error/RouteErrorBoundary.jsx`, `frontend-reactjs/src/utils/errorReporting.js`, `backend-nodejs/src/routes/telemetryRoutes.js`)
   - Throttle persona unlock writes, debounce storage updates, and introduce analytics to detect abuse or performance regressions across personas. (`frontend-reactjs/src/hooks/usePersonaAccess.js`, `frontend-reactjs/src/hooks/useSession.js`)

6. **Deliver a production-ready mobile experience**
   - Implement a credentialed login and refresh flow that differentiates demo tokens from production identities, surfaces biometric opt-out, and removes `demoAccessToken` from bootstrap defaults. (`flutter-phoneapp/lib/features/auth/presentation/auth_gate.dart`, `flutter-phoneapp/lib/features/auth/application/auth_token_controller.dart`, `flutter-phoneapp/lib/app/bootstrap.dart`)
   - Parallelise bootstrap tasks, show a responsive splash screen, and harden plugin initialisation with guarded fallbacks so cold starts no longer freeze or crash. (`flutter-phoneapp/lib/app/bootstrap.dart`, `flutter-phoneapp/lib/app/app.dart`)
   - Overhaul diagnostics to capture accurate version/build metadata, enforce HTTPS telemetry endpoints, await uploads with retry/backoff, and redact stack traces in release builds. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`, `flutter-phoneapp/lib/main.dart`)
   - Add API client resilience (retry/backoff, pagination helpers), persist last-selected destinations, and incorporate integration/golden tests to lock in regression coverage. (`flutter-phoneapp/lib/core/network/api_client.dart`, `flutter-phoneapp/lib/app/app.dart`, `flutter-phoneapp/pubspec.yaml`)

7. **Restore telemetry and cross-tier observability**
   - Implement `/telemetry/client-errors` and `/telemetry/mobile-crashes` ingestion backed by structured logging, retention policies, and alerts, then align web/mobile reporters to the new contracts. (`backend-nodejs/src/routes/telemetryRoutes.js`, `frontend-reactjs/src/utils/errorReporting.js`, `flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`)
   - Emit structured, redacted logs with correlation IDs across backend, web, and mobile tiers, and expose health metrics that capture rate-limit events, boot timing, and crash counts. (`backend-nodejs/src/app.js`, `backend-nodejs/src/server.js`, `frontend-reactjs/src/utils/errorReporting.js`, `flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`)
   - Provide operator dashboards and runbooks documenting failure modes, extension prerequisites, and remediation steps surfaced during readiness or telemetry incidents. (`docs/updates/1.00`, `backend-nodejs/src/app.js`)

8. **Strengthen release readiness and onboarding**
   - Gate background jobs, offline session fallbacks, and destructive migrations behind environment-aware feature flags, and require explicit enablement during deployments. (`backend-nodejs/src/jobs/index.js`, `backend-nodejs/src/database/migrations`, `frontend-reactjs/src/hooks/useSession.js`)
   - Publish environment bootstrap guides covering secrets provisioning, PostGIS capabilities, native toolchain requirements, and CI smoke tests that fail fast when prerequisites are unmet. (`docs/updates/1.00/pre-update_evaluations`, `backend-nodejs/package.json`, `frontend-reactjs/package.json`, `flutter-phoneapp/pubspec.yaml`)
   - Integrate dependency/license checks, release note expectations, and rollback playbooks into the delivery pipeline so every schema or authentication change ships with recovery guidance. (`scripts/security-audit.mjs`, `docs/updates/1.00`, `backend-nodejs/src/database/migrations`)
