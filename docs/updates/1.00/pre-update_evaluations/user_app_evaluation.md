# User App (Flutter) Pre-Update Evaluation (v1.00)

## Functionality
- `AuthGate` only transitions between sign-up, registration, and the shell; there is no path for existing users to log back in with credentials, so the app cannot service non-demo tenants yet. (`flutter-phoneapp/lib/features/auth/presentation/auth_gate.dart`).
- `AppShell` renders the same navigation scaffold for every role and relies on `IndexedStack`, which keeps all feature screens alive. That causes unnecessary network calls and widget rebuilds even when tabs are inactive. (`flutter-phoneapp/lib/app/app.dart`).
- `AppDiagnosticsReporter` hardcodes `appVersion: '1.50'`, which is out of sync with the requested v1.00 update and will pollute telemetry dashboards with misleading metadata. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).

## Usability & UX
- During fatal errors the app shows a generic restart screen without exposing support contact until the user taps copy; there is no inline guidance for next steps. (`flutter-phoneapp/lib/app/app_failure_boundary.dart`).
- The bootstrap flow blocks on `SharedPreferences.getInstance()` and secure storage initialisation before rendering even a splash screen, so users experience a long blank screen on cold start. (`flutter-phoneapp/lib/app/bootstrap.dart`).
- Role switching in `AppShell` drives navigation but does not persist the last selected destination, forcing users to re-open their preferred workspace after every restart. (`flutter-phoneapp/lib/app/app.dart`).

## Errors & Stability
- `Bootstrap.load()` does not catch exceptions thrown while instantiating `SecureCredentialStore` or `BiometricAuthenticator`; if either plugin is misconfigured, the entire app crashes before error reporting is available. (`flutter-phoneapp/lib/app/bootstrap.dart`).
- `AuthTokenController.ensureFreshness` swallows refresh errors and simply returns `false`, leaving the UI unaware that the session must be re-authenticated. (`flutter-phoneapp/lib/features/auth/application/auth_token_controller.dart`).
- `main.dart` uses `unawaited(reporter.report(...))` for zone and framework crashes, so telemetry often fails to send before the process exits—meaning the only crash reporter path is the manual retry button. (`flutter-phoneapp/lib/main.dart`).

## Integration & Data Flow
- `FixnadoApiClient` assumes REST JSON responses and lacks retry/backoff logic; transient failures from the backend translate directly to user-facing errors without resilience. (`flutter-phoneapp/lib/core/network/api_client.dart`).
- Diagnostics reporter posts to `<api>/telemetry/mobile-crashes`, coupling the mobile app tightly to the backend API domain rather than a dedicated telemetry endpoint, which complicates CDN caching and outage isolation. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).
- Auth flows rely on an optional `demoAccessToken` to seed credentials, meaning production-grade token exchange is unimplemented. (`flutter-phoneapp/lib/app/bootstrap.dart`, `flutter-phoneapp/lib/features/auth/data/auth_token_store.dart`).
- The app hardcodes a single `AppConfig.fromEnvironment()` source; there is no runtime environment picker or remote config, so switching between staging and production requires a rebuild. (`flutter-phoneapp/lib/core/config/app_config.dart`, `flutter-phoneapp/lib/app/bootstrap.dart`).
- The backend exposes no `/telemetry/mobile-crashes` handler, so crash uploads receive 404 responses and the diagnostics reporter quietly logs warnings instead of persisting incidents. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`, `backend-nodejs/src/routes/telemetryRoutes.js`).

## Security & Compliance
- Demo fallback tokens are stored in secure storage with the same lifetime as real credentials, so a demo build accidentally promoted to production would grant long-lived bearer tokens. (`flutter-phoneapp/lib/features/auth/data/auth_token_store.dart`).
- Fatal error payloads send stack traces and potentially PII over HTTP without TLS enforcement; the reporter simply reuses whatever base URL the config provides. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).
- The biometric authenticator is optional, and when unavailable the controller silently stores plaintext tokens in secure storage, offering no indication that device-level protections are disabled. (`flutter-phoneapp/lib/features/auth/application/auth_token_controller.dart`).
- `AppDiagnosticsReporter` logs failures with full stack traces to stdout even in release builds, risking exposure of device identifiers in shared logs. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).

## Alignment & Roadmap Fit
- The focus on role-based dashboards and communications tabs suggests an internal operations tool, whereas the roadmap emphasises improving end-user booking flows; resources should pivot to booking lifecycle polish before deep analytics. (`flutter-phoneapp/lib/app/app.dart`).
- Reliance on environment compile-time constants makes it hard to switch between staging and production endpoints at runtime, conflicting with QA requirements for flexible environment selection. (`flutter-phoneapp/lib/core/config/app_config.dart`).
- Crash reporting targeting `/telemetry/mobile-crashes` implies backend readiness that has not been validated; this misalignment could delay the release if the endpoint is absent. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).

## Performance & Scalability
- Bootstrap initialisation performs sequential synchronous calls (SharedPreferences, secure store, biometrics), delaying first paint and blocking even simple marketing screens. (`flutter-phoneapp/lib/app/bootstrap.dart`).
- `AppShell` keeps every tab alive in an `IndexedStack`, so memory use and network subscriptions scale linearly with the number of tabs a persona can access. (`flutter-phoneapp/lib/app/app.dart`).
- The API client eagerly JSON-decodes entire payloads into memory, which will struggle with large paginated responses once real booking data flows through. (`flutter-phoneapp/lib/core/network/api_client.dart`).
- Diagnostics uploads reuse the same `http.Client` for the app lifetime without circuit breaking; repeated failures will backlog sockets and increase memory pressure in long-lived sessions. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).

## Observability & Tooling
- Logging configuration prints to stdout whenever network logging is enabled, but there is no log level filtering or batching, creating noisy console output without structured telemetry. (`flutter-phoneapp/lib/app/bootstrap.dart`).
- Crash diagnostics never include build flavor or device locale, making it difficult for support to correlate reports with specific release channels. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).
- There are no integration tests or golden tests wired into `pubspec.yaml`, so critical UI flows lack automated regression coverage. (`flutter-phoneapp/pubspec.yaml`).
- The diagnostics reporter hardcodes `appVersion: '1.50'`, so monitoring dashboards will misattribute crashes and obscure which v1.00 build failed. (`flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart`).

## Recommendations
- Add a proper sign-in flow with credential validation, token refresh, and error surfacing before expanding dashboard features.
- Show a lightweight splash/loading screen while bootstrap initialises secure storage to avoid blank screens.
- Harden diagnostics and token handling by awaiting crash uploads, enforcing HTTPS endpoints, differentiating demo credentials from production sessions, and capturing richer telemetry metadata.
- Parallelise bootstrap tasks and introduce lightweight pagination/streaming helpers in the API client to cope with growing data volumes.
