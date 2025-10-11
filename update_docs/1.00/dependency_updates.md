## 2025-02-10 — Backend Finance & Geospatial Tooling
- Added `@turf/turf` for GeoJSON validation/analytics supporting zone CRUD and centroid/bounding box computation.
- Added `pg`/`pg-hstore` to support PostGIS-ready connections in production while retaining sqlite fallback for tests.
- Added `luxon` to calculate SLA timers and timestamp offsets for booking orchestration.

## 2025-10-13 — Secrets Manager Feature Toggle Integration
- Added `@aws-sdk/client-secrets-manager` so the API can read and persist environment feature toggle manifests with caching and IAM auth.

## 2025-10-14 — CI Coverage Instrumentation
- Added `@vitest/coverage-v8@^2.1.4` to backend and frontend devDependencies so coverage thresholds enforced locally align with CI Quality Gates.
