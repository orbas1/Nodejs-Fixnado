# Dependency & Toolchain Governance (Version 1.00)

## Runtime baselines
- Declared strict Node.js (>=20.11.1 <21) and npm (>=11.4.0 <12) ranges in both web and API manifests so `npm ci` rejects unsupported runtimes before drift lands in staging.【F:backend-nodejs/package.json†L1-L61】【F:frontend-reactjs/package.json†L1-L66】
- Locked the Flutter framework range to 3.22.x and recorded Android/iOS platform expectations (API 34, iOS 15.0, Xcode 15.4, NDK 26.1) for mobile engineers and CI runners to follow.【F:flutter-phoneapp/pubspec.yaml†L1-L34】【F:flutter-phoneapp/tooling/platform-versions.json†L1-L11】

## Verification utilities
- Added `scripts/verify-toolchains.mjs` to assert Node/npm/Flutter installations satisfy the declared ranges and to ensure the mobile platform manifest stays well-formed.【F:scripts/verify-toolchains.mjs†L1-L253】
- Added `scripts/verify-lockfiles.mjs` so CI and developers can prove lockfiles remain untouched after installs, preventing manual edits or solver drift from merging unnoticed.【F:scripts/verify-lockfiles.mjs†L1-L89】

## CI enforcement
- Updated build/test and scheduled dependency workflows to activate npm 11 via Corepack, run the toolchain verifier, fail on moderate-or-higher npm advisories, and gate merges on lockfile cleanliness across backend, frontend, and Flutter workspaces.【F:.github/workflows/build-test-and-scan.yml†L1-L118】【F:.github/workflows/dependency-audit.yml†L1-L86】【F:scripts/security-audit.mjs†L1-L246】
