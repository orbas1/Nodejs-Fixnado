# User Phone App Change Log

## Diagnostics pipeline overhaul (Version 1.00)
- Upgraded the Flutter diagnostics reporter to hash device identifiers, attach runtime build metadata, and stream crash reports to `/v1/telemetry/mobile-crashes` with exponential backoff and payload trimming, ensuring parity with backend retention policies.【F:flutter-phoneapp/lib/core/diagnostics/app_diagnostics_reporter.dart†L1-L254】【F:flutter-phoneapp/lib/core/config/app_config.dart†L1-L89】

## Native smoke builds & dependency governance (Version 1.00)
- Regenerated the Flutter `pubspec.lock` using canonical pub.dev hashes and introduced a CI smoke matrix that scaffolds Android/iOS shells, builds debug artefacts, and runs the `app_shell_test` to keep biometric and secure storage plugins healthy across toolchains.【F:flutter-phoneapp/pubspec.lock†L1-L477】【F:.github/workflows/build-test-and-scan.yml†L64-L117】【F:flutter-phoneapp/test/app/app_shell_test.dart†L1-L120】
- Published Android and iOS readiness guides covering biometric permissions, secure enclave/keystore requirements, and signing expectations so mobile engineers can mirror the smoke job locally without regressions.【F:docs/updates/1.00/user_phone_app_updates/android_updates.md†L1-L19】【F:docs/updates/1.00/user_phone_app_updates/ios_updates.md†L1-L15】
