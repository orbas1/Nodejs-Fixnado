# Android platform readiness (Version 1.00)

## Tooling & SDK baselines
- Install Android Studio Hedgehog (or newer) with SDK Platform 34, build-tools 34.0.0, and NDK 26.1 as documented in `tooling/platform-versions.json`; point the generated `local.properties` at the shared SDK directory so CI and local runners compile with identical revisions.【F:flutter-phoneapp/tooling/platform-versions.json†L1-L11】
- Enable the Android Gradle plugin 8.5+ and Gradle wrapper 8.7 when generating the shell via `flutter create . --platforms=android` so the smoke job mirrors the versions used by the release trains.【F:.github/workflows/build-test-and-scan.yml†L78-L103】

## BiometricPrompt configuration
- After scaffolding the Android directory, update `android/app/src/main/AndroidManifest.xml` to include `<uses-permission android:name="android.permission.USE_BIOMETRIC" />` and `<uses-permission android:name="android.permission.USE_FINGERPRINT" />` so `local_auth` can surface native biometric flows without runtime crashes.【F:flutter-phoneapp/pubspec.yaml†L18-L26】
- Ensure `android/app/src/main/kotlin/.../MainActivity.kt` extends `FlutterFragmentActivity` and calls `BiometricManager.from(context)` during warm-up so face/fingerprint enrollment checks complete before presenting the prompt. The activity change keeps `local_auth_android` compliant with AndroidX Biometric v1.2.0 policies.【F:flutter-phoneapp/pubspec.lock†L179-L200】
- Register the `BiometricPrompt` negative button strings in `android/app/src/main/res/values/strings.xml` to surface clear user-facing copy consistent with the compliance/legal reviews.

## Secure storage & keystore hardening
- Enable hardware-backed keystore material by setting `setIsStrongBoxBacked(true)` inside the generated `EncryptedSharedPreferences` factory (`flutter_secure_storage` delegates) to prevent software-only key fallback on flagship devices.【F:flutter-phoneapp/pubspec.lock†L91-L138】
- When provisioning CI or new environments, run `adb shell settings put global adb_enabled 0` and `adb shell locksettings set-disabled false` to verify secure storage writes succeed only when a lockscreen credential exists, matching our production policy.
- Configure release keystores with AES-256 storage encryption and rotate passwords via the infra secrets manager before generating build artefacts for staging/production smoke runs.

## Pipeline validation
- Execute `flutter create . --platforms=android` followed by `flutter build apk --debug --no-tree-shake-icons` locally to mirror the CI smoke job and confirm plugins compile alongside the refreshed lockfile.【F:.github/workflows/build-test-and-scan.yml†L78-L106】
- Run `flutter test --no-pub test/app/app_shell_test.dart` to assert the biometric and secure storage facades continue to work after Gradle or SDK updates; the smoke workflow runs the same test after each build.【F:flutter-phoneapp/test/app/app_shell_test.dart†L1-L120】
