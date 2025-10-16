# Widget Updates – User App

- Introduced Riverpod providers for `SecureCredentialStore`, `AuthTokenController`, and `BiometricAuthenticator` so downstream features can gate navigation, API clients, and notifications on authenticated session state.
- Added `ConsentController` and `ConsentOverlay` presenters that subscribe to the consent API client, expose ledger-backed policy states, and coordinate biometric unlock with legal acceptance before resuming app navigation.
- Created `DataGovernanceRepository` and `DataRequestsController` providers with eager loading to populate compliance metrics for screens and profile cards.
- Exposed controller helpers for status updates, export generation, and error propagation, keeping UI layers lightweight and testable.
- Added warehouse export specific provider methods exposing derived selectors for pending runs, retention countdown text, and download badge states so widgets can reactively update without manual parsing.
- Instrumented controller actions with analytics events (`compliance_export_trigger`, `compliance_export_failure`) feeding the mobile telemetry stream and mirroring the React portal insights dashboard.

- Added `AppFailureBoundaryController` and `AppDiagnosticsReporter` providers so crash telemetry, restart orchestration, and bootstrap disposal are orchestrated consistently across Riverpod scopes during fatal error recovery.