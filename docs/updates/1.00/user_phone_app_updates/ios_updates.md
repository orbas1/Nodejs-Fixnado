# iOS platform readiness (Version 1.00)

## Toolchain & dependency management
- Use Xcode 15.4+ with Command Line Tools installed, and install Ruby 3.3 with Bundler so `pod install` resolves deterministic lockfiles inside the generated `ios/` directory. Pair with `gem install cocoapods --version 1.15.2` to match the CI smoke job expectations.【F:.github/workflows/build-test-and-scan.yml†L86-L117】
- Configure a workspace-specific `.ruby-version` and `Gemfile` when first generating the iOS shell (`flutter create . --platforms=ios`) so developers and build agents install identical CocoaPods gems before running smoke builds.

## Biometric & secure enclave configuration
- After scaffolding the iOS project, add `NSFaceIDUsageDescription` and `NSLocalNetworkUsageDescription` entries to `ios/Runner/Info.plist` describing why biometrics and secure networking are required; the copy must align with the legal-approved messaging in the compliance handbook.
- Enable the Keychain Sharing capability for the `Runner` target and include the production keychain access group defined by infrastructure so `flutter_secure_storage` and `local_auth` share the same secure enclave key material across app reinstalls.【F:flutter-phoneapp/pubspec.lock†L91-L200】
- Update `Runner/Runner.entitlements` to set `com.apple.developer.biometric` to `Touch ID` and `Face ID`, ensuring the system prompts surface during smoke builds.

## Build signing & CI parity
- Register a dedicated "Fixnado Smoke" Apple development team certificate and provisioning profile, then configure it under `Runner.xcodeproj -> Signing & Capabilities` for the Debug configuration used by the `flutter build ios --no-codesign` command. This keeps automated builds aligned with manual QA installs.【F:.github/workflows/build-test-and-scan.yml†L97-L117】
- Run `pod repo update` and `pod install` after each plugin upgrade so `Pods/Manifest.lock` reflects the dependency versions resolved by the refreshed `pubspec.lock`; failing to update will cause the smoke build to break when linking secure storage or biometric frameworks.【F:flutter-phoneapp/pubspec.lock†L1-L477】
- Execute `flutter build ios --no-codesign` locally once entitlements and signing are configured. Follow up with `flutter test --no-pub test/app/app_shell_test.dart` to confirm the biometric facades and HTTP clients stay operational post-build, mirroring the CI smoke flow.【F:flutter-phoneapp/test/app/app_shell_test.dart†L1-L120】
