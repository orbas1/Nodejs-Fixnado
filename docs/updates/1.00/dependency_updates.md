# Dependency & Toolchain Governance (Version 1.00)

## Runtime baselines
- Declared strict Node.js (>=20.11.1 <21) and npm (>=11.4.0 <12) ranges in both web and API manifests so `npm ci` rejects unsupported runtimes before drift lands in staging.【F:backend-nodejs/package.json†L1-L61】【F:frontend-reactjs/package.json†L1-L66】
- Locked the Flutter framework range to 3.22.x and recorded Android/iOS platform expectations (API 34, iOS 15.0, Xcode 15.4, NDK 26.1) for mobile engineers and CI runners to follow.【F:flutter-phoneapp/pubspec.yaml†L1-L34】【F:flutter-phoneapp/tooling/platform-versions.json†L1-L11】

## Verification utilities
- Added `scripts/verify-toolchains.mjs` to assert Node/npm/Flutter installations satisfy the declared ranges and to ensure the mobile platform manifest stays well-formed.【F:scripts/verify-toolchains.mjs†L1-L253】
- Added `scripts/verify-lockfiles.mjs` so CI and developers can prove lockfiles remain untouched after installs, preventing manual edits or solver drift from merging unnoticed.【F:scripts/verify-lockfiles.mjs†L1-L89】

## CI enforcement
- Updated build/test and scheduled dependency workflows to activate npm 11 via Corepack, run the toolchain verifier, fail on moderate-or-higher npm advisories, and gate merges on lockfile cleanliness across backend, frontend, and Flutter workspaces.【F:.github/workflows/build-test-and-scan.yml†L1-L118】【F:.github/workflows/dependency-audit.yml†L1-L86】【F:scripts/security-audit.mjs†L1-L246】

## Mobile lockfile & platform smoke coverage
- Regenerated the Flutter `pubspec.lock` directly from pub.dev metadata so every direct and transitive dependency ships with pinned versions and SHA-256 hashes, eliminating manual edits that previously invalidated reproducible builds.【F:flutter-phoneapp/pubspec.lock†L1-L477】
- Extended the build pipeline with a matrixed `flutter-smoke` job that scaffolds Android/iOS shells on the fly, builds debug artifacts, and runs the `app_shell_test` smoke suite to confirm biometric and secure storage plugins link successfully on both toolchains.【F:.github/workflows/build-test-and-scan.yml†L64-L117】【F:flutter-phoneapp/test/app/app_shell_test.dart†L1-L120】
- Captured platform provisioning checklists for Android and iOS so engineers configure keystore-backed secure storage, BiometricPrompt entitlements, and CocoaPods signing prerequisites before invoking the smoke workflows.【F:docs/updates/1.00/user_phone_app_updates/android_updates.md†L1-L19】【F:docs/updates/1.00/user_phone_app_updates/ios_updates.md†L1-L15】

## License compliance & load-test gating
- Added a repository-wide license policy (`governance/license-policy.json`) and CI harness (`scripts/license-scan.mjs --ci`) that merge npm manifests with the Flutter license snapshot, fail builds when forbidden SPDX identifiers appear, and emit machine-readable reports for the evidence vault.【F:governance/license-policy.json†L1-L36】【F:scripts/license-scan.mjs†L1-L243】
- Introduced a deterministic Flutter license snapshot generator so the mobile workspace contributes accurate SPDX data without manual package reviews, keeping the license scanner aligned with the pub cache on every run.【F:flutter-phoneapp/tooling/license_snapshot.dart†L1-L116】
- Extended the security job with `grafana/setup-k6-action` and the new `--validate-only` flag in `scripts/run-load-tests.mjs` so release gates confirm the k6 harness, scenarios, and environment expectations remain valid even when load endpoints are offline.【F:.github/workflows/build-test-and-scan.yml†L118-L132】【F:scripts/run-load-tests.mjs†L1-L181】
