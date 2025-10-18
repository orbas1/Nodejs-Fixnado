# Pre-Update Fix Suggestions (v1.00)

1. **Stabilise authentication across platforms**
   - Remove the permissive JWT decode fallback and require issuer/audience validation server-side. (`backend-nodejs/src/services/sessionService.js`)
   - Implement `/api/auth/me` revalidation and signed session storage in the web client. (`frontend-reactjs/src/api/sessionClient.js`, `frontend-reactjs/src/hooks/useSession.js`)
   - Replace the Flutter demo token bootstrap with a credentialed login flow backed by refresh tokens. (`flutter-phoneapp/lib/features/auth/presentation/auth_gate.dart`)
   - Lock down dashboard persona switching by moving unlock decisions to the backend and invalidating forged `localStorage` entries. (`frontend-reactjs/src/pages/DashboardHub.jsx`, `frontend-reactjs/src/hooks/usePersonaAccess.js`)

2. **Harden database migrations and schema hygiene**
   - Wrap large migration batches in explicit transactions and split finance vs communications rollouts. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`)
   - Add indexes on provider-specific webhook queries and enforce uniqueness for notification recipients. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`, `backend-nodejs/src/database/migrations/20250330001000-create-customer-notification-recipients.js`)
   - Seed baseline communications configuration to unblock QA and document rollback steps including enum handling. (`backend-nodejs/src/database/migrations/20250327000000-create-communications-inbox-settings.js`)
   - Remove destructive cascades from ledger tables, add CHECK constraints for positive amounts, and capture audit metadata for every finance row. (`backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js`)

3. **Restore build health and developer ergonomics**
   - Repair `package.json` syntax, dedupe dependencies, and add `npm run lint`/audit steps to CI. (`backend-nodejs/package.json`, `scripts/security-audit.mjs`)
   - Introduce bundle analysis and telemetry instrumentation in the React app to track performance regressions. (`frontend-reactjs/package.json`, `frontend-reactjs/src/App.jsx`)
   - Add Flutter integration/golden tests and ensure crash diagnostics capture build flavor + locale before sending. (`flutter-phoneapp/pubspec.yaml`, `flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`)
   - Automate lockfile verification/licence scanning and document native build prerequisites so onboarding stops breaking on missing compilers. (`frontend-reactjs/package.json`, `flutter-phoneapp/pubspec.lock`)

4. **Reduce cold-start and runtime overhead**
   - Defer secrets manager calls until after logging is initialised and cache successful fetches. (`backend-nodejs/src/config/index.js`)
   - Gate background jobs behind feature flags or leader election to prevent duplicate work in multi-instance deployments. (`backend-nodejs/src/jobs/index.js`)
   - Lazy load heavy chat widgets and parallelise mobile bootstrap tasks to improve perceived responsiveness. (`frontend-reactjs/src/App.jsx`, `flutter-phoneapp/lib/app/bootstrap.dart`)
   - Decouple `server.js` startup so integration tests and blue/green deployments can bootstrap the app without auto-listening or forced exits. (`backend-nodejs/src/server.js`)

5. **Restore telemetry trust boundaries**
   - Ship a dedicated `/api/telemetry/client-errors` and `/telemetry/mobile-crashes` ingestion path and back the routes with retention policies so crash reports stop 404ing. (`backend-nodejs/src/routes/telemetryRoutes.js`, `frontend-reactjs/src/utils/errorReporting.js`, `flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`)
   - Tighten CORS defaults to explicit allowlists, disable credential reflection for wildcard origins, and re-enable Helmet CSP/COEP in hardened environments. (`backend-nodejs/src/app.js`)
   - Replace UI error boundary stack dumps with support-friendly summaries and gated copy-to-clipboard diagnostics so production users stop seeing raw traces. (`frontend-reactjs/src/components/error/AppErrorBoundary.jsx`, `frontend-reactjs/src/components/error/RouteErrorBoundary.jsx`)
