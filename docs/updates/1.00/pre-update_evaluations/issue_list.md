# Pre-Update Issue List (v1.00)

| Area | Category | Severity | Summary | Source |
| --- | --- | --- | --- | --- |
| Backend | Security | Critical | JWT verification falls back to accepting any token signed with the shared secret, allowing issuer/audience bypass. | `backend-nodejs/src/services/sessionService.js` |
| Backend | Reliability | High | Router mounts duplicate modules causing unpredictable middleware order and inflated startup cost. | `backend-nodejs/src/routes/index.js` |
| Backend | Security | Critical | Default CORS settings reflect any origin while sharing cookies, enabling cross-origin session fixation. | `backend-nodejs/src/app.js` |
| Database | Integrity | High | Finance/communications migration runs without transactions, risking partial schema application. | `backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js` |
| Front-end | Authentication | High | Session bootstrap never revalidates `/api/auth/me`, leaving stale sessions active after expiry. | `frontend-reactjs/src/hooks/useSession.js` |
| User App | Functionality | Critical | Mobile bootstrap lacks credential login path; only demo flows function. | `flutter-phoneapp/lib/features/auth/presentation/auth_gate.dart` |
| Dependencies | Build | High | `backend-nodejs/package.json` contains duplicate keys breaking npm installs. | `backend-nodejs/package.json` |
| Backend | Performance | Medium | Secrets manager fetch runs during import, blocking cold starts on remote network latency. | `backend-nodejs/src/config/index.js` |
| User App | Observability | Medium | Crash reports hardcode `appVersion: '1.50'` and skip locale metadata, obscuring which release failed. | `flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart` |
| Backend | Deployment | High | `server.js` auto-starts the app and exits on errors, preventing harnesses from controlling boot for tests or blue/green cutovers. | `backend-nodejs/src/server.js` |
| Database | Compliance | Critical | Cascading deletes on payments erase historical ledgers when users or orders are removed. | `backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js` |
| Front-end | Security | Critical | DashboardHub allows persona unlock purely via `localStorage`, letting unauthenticated users self-provision dashboards. | `frontend-reactjs/src/pages/DashboardHub.jsx` |
| User App | Reliability | High | Crash telemetry is sent with `unawaited` calls, so fatal errors rarely reach the reporter before exit. | `flutter-phoneapp/lib/main.dart` |
| Dependencies | Compatibility | Medium | MapLibre 5 is paired with `@mapbox/mapbox-gl-draw@1.5.0`, a combination that is not supported and breaks draw controls. | `frontend-reactjs/package.json` |
| Backend | Observability | High | No `/telemetry/client-errors` endpoint exists, so browser crash reports 404 and never reach operators. | `backend-nodejs/src/routes/telemetryRoutes.js`, `frontend-reactjs/src/utils/errorReporting.js` |
| Database | Integrity | High | `finance_webhook_events` stores duplicate webhook deliveries because no idempotency key or unique index exists. | `backend-nodejs/src/database/migrations/20250325000000-payments-orchestration.js` |
| Front-end | Security | High | Error boundaries expose stack traces and URLs to end users, leaking implementation details useful to attackers. | `frontend-reactjs/src/components/error/AppErrorBoundary.jsx`, `frontend-reactjs/src/components/error/RouteErrorBoundary.jsx` |
| User App | Observability | High | Mobile crash uploads 404 because the backend lacks `/telemetry/mobile-crashes`, leaving support blind. | `flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`, `backend-nodejs/src/routes/telemetryRoutes.js` |

*Severity legend: Critical (release blocker), High (must fix pre-release), Medium (schedule in next sprint), Low (monitor).
