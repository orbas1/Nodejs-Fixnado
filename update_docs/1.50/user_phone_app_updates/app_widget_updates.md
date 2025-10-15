# Widget Updates – User App

- Introduced Riverpod providers for `SecureCredentialStore`, `AuthTokenController`, and `BiometricAuthenticator` so downstream features can gate navigation, API clients, and notifications on authenticated session state.
- Added `ConsentController` and `ConsentOverlay` presenters that subscribe to the consent API client, expose ledger-backed policy states, and coordinate biometric unlock with legal acceptance before resuming app navigation.
- Created `DataGovernanceRepository` and `DataRequestsController` providers with eager loading to populate compliance metrics for screens and profile cards.
- Exposed controller helpers for status updates, export generation, and error propagation, keeping UI layers lightweight and testable.
