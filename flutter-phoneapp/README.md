# Fixnado Flutter App

Cross-platform mobile companion for the Fixnado service marketplace. Provides quick access to live feeds, service discovery, profiles, and search from mobile devices.

## Prerequisites

- Flutter SDK 3.22.x (stable channel) with Dart 3.3+.
- Android Studio/SDK Manager with Android API level 34 (compile & target) and NDK 26.1.10909125.
- Xcode 15.4 with iOS deployment target 15.0 for simulators and devices.

Record the expected native versions locally by inspecting `tooling/platform-versions.json` and keep them aligned with your IDE/device matrix.

## Getting started

Ensure the Flutter SDK is available and matches the declared range in `pubspec.yaml`:

```bash
cd flutter-phoneapp
flutter pub get
flutter run
```

Before publishing or raising pull requests, run the shared toolchain verifier to check Node, Flutter, and mobile SDK prerequisites:

```bash
node ../scripts/verify-toolchains.mjs
```

## Screens

- **Home** – Summary cards, quick actions, live feed
- **Login** – Email/password with 2FA toggles
- **Register** – Capture details and select user type
- **Feed** – Live job feed
- **Profile** – Provider profile with services and marketplace info
- **Search** – Explorer search results

The UI uses the Inter typeface via `google_fonts` and follows the same color palette as the Fixnado branding.
