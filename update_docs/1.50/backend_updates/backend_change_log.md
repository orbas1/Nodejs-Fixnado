# Backend Change Log – Version 1.50

## 2025-02-20 – Security & Secrets Hardening, Subtask 4
- Hardened the Express gateway with configurable rate limiting, trusted proxy support, body size governance, and a curated CORS allowlist derived from environment variables.
- Delivered an operational `/healthz` endpoint exposing uptime, ISO-8601 timestamp, and database latency to feed load balancer probes and monitoring dashboards.
- Extended test coverage with an API gateway regression suite validating health telemetry, CORS rejections, and request throttling semantics.

## 2025-02-21 – Security & Secrets Hardening, Subtask 5
- Migrated user and company PII to AES-256-GCM encrypted columns with SHA-512/HMAC lookup hashes, ensuring email uniqueness without storing cleartext identifiers.
- Added transactional migration to backfill encrypted payloads, drop legacy plaintext columns, and enforce new uniqueness constraints on hashed values.
- Introduced shared field encryption utility, model hooks, and targeted Vitest coverage to verify encrypted persistence and case-insensitive lookups.

## 2025-03-01 – Vault Integration, Session Assurance & Compliance Testing
- Added `secretVaultService` to hydrate JWT, admin, and database credentials from AWS Secrets Manager with rotation-aware caching and cache invalidation hooks for operational runbooks.
- Refactored `authController` to defer token signing and admin break-glass validation to the vault helper, aligning cookie issuance with the rotated session token model and httpOnly cookie policy.
- Authored regression suites covering session token issuance/rotation, consent event storage, and the security hardening migration rollback path while documenting the outstanding `panelService` parsing defect blocking full-suite execution.
