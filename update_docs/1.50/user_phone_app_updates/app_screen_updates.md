# Screen Updates – User App

- Session bootstrap now includes a silent hydration step that determines whether biometrics are required before enabling authenticated navigation; UI will prompt via the forthcoming security modal when the biometric gate is triggered.
- Added a full-screen consent overlay that blocks navigation until required policies are accepted, including ledger-backed timestamps, policy version chips, and scroll-aware acceptance controls.
- Updated legal screens to render the refreshed privacy/terms content with shared typography tokens; staleness badges prompt users when re-acceptance is required.
