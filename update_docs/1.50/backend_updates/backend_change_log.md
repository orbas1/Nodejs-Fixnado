# Backend Change Log – Version 1.50

## 2025-02-20 – Security & Secrets Hardening, Subtask 4
- Hardened the Express gateway with configurable rate limiting, trusted proxy support, body size governance, and a curated CORS allowlist derived from environment variables.
- Delivered an operational `/healthz` endpoint exposing uptime, ISO-8601 timestamp, and database latency to feed load balancer probes and monitoring dashboards.
- Extended test coverage with an API gateway regression suite validating health telemetry, CORS rejections, and request throttling semantics.

## 2025-02-21 – Security & Secrets Hardening, Subtask 5
- Migrated user and company PII to AES-256-GCM encrypted columns with SHA-512/HMAC lookup hashes, ensuring email uniqueness without storing cleartext identifiers.
- Added transactional migration to backfill encrypted payloads, drop legacy plaintext columns, and enforce new uniqueness constraints on hashed values.
- Introduced shared field encryption utility, model hooks, and targeted Vitest coverage to verify encrypted persistence and case-insensitive lookups.

## 2025-03-12 – Security & Secrets Hardening, Subtask 2
- Reconstructed `panelService` to reinstate provider dashboard orchestration: RBAC-enforced company resolution, booking analytics, trust score computation, and review summarisation now drive production responses again.
- Normalised business front generation to leverage active bookings, campaign telemetry, and marketplace intelligence while sourcing savings data from cached platform commission configuration.
- Resolved the lingering ESLint failure set (69 errors) and re-ran the backend lint suite to confirm the panel stack is compliant ahead of follow-on security automation.
