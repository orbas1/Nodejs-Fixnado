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

## 2025-03-17 – Security & Secrets Hardening, Subtask 6
- Introduced `sessionService` with refresh-token hashing, JWT issuance, and cookie builders that emit httpOnly/secure/authenticated cookies for browser consumers while exposing bearer tokens for mobile clients.
- Added Sequelize models/migrations for `user_sessions`, wired rotation and revocation into the auth controller, and documented the new configuration surface (cookie names, TTLs, secure flags).
- Authored Vitest coverage asserting session issuance, rotation persistence, cookie policies, and token extraction to anchor the new authentication runtime in automated evidence.

## 2025-03-18 – Security & Secrets Hardening, Subtasks 7–8
- Delivered the consent ledger migration/model (`consent_events`) with indexed policy/version metadata, subject resolution, and audit logging so consent changes are immutable and attributable.
- Built `consentService`, controller, and routes exposing snapshot, record, and verification endpoints alongside configuration-driven policy catalogues consumed by both web and mobile clients.
- Implemented `scamDetectionService` heuristics with AI enrichment hooks, Opsgenie escalation support, and booking metadata annotations to surface high-risk attempts directly in analytics and downstream workflows.
- Extended `bookingService` to run the scam heuristics during creation while preserving transactional integrity, ensuring risk markers persist even when third-party enrichments fail.

## 2025-03-21 – Security & Secrets Hardening, Subtask 1
- Authored a production RBAC matrix (`src/constants/rbacMatrix.js`) capturing permission inheritance, navigation scaffolding, and data visibility envelopes for guest through admin cohorts.
- Refactored `accessControlService` to compose permission sets from the matrix, normalise role aliases, and expose `describeRole` metadata for downstream auditing, telemetry, and navigation orchestration.
- Expanded the permission catalogue with finance, compliance, integration, and support scopes to align with upcoming payments and automation milestones while keeping existing route guards backward compatible.
- Introduced Vitest coverage validating hierarchical permission grants, canonical alias resolution, and metadata exports so security evidence accompanies the matrix deliverable.

## 2025-03-24 – Security & Secrets Hardening, Subtask 2
- Introduced `src/middleware/policyMiddleware.js` and a central `routePolicies` registry to drive RBAC-aware enforcement across feed, admin, inventory, zone, panel, materials, and service endpoints.
- Upgraded the security audit trail service with webhook dispatch, sampling, metadata redaction, and configuration-driven sink registration, exposing new `SECURITY_AUDIT_*` environment variables and documentation updates.
- Replaced legacy `authorize` guards in all secured routes, refreshed the storefront helper, and added Vitest coverage exercising allow, deny, and metadata sanitisation paths for the new middleware.

## 2025-03-25 – Security & Secrets Hardening, Subtask 3
- Stood up a reusable secrets manager loader that synchronises AWS Secrets Manager values into `process.env`, captures refresh metadata, and surfaces enforcement through the configuration module with fail-fast validation for critical secrets.
- Updated configuration bootstrap to require `JWT_SECRET` and database credentials from the vault, exposing sync metadata to the runtime and logging successful synchronisation during API startup.
- Replaced the legacy MySQL bootstrap artefact with a Postgres-first provisioning script that prompts for strong credentials, locks down default privileges, and installs PostGIS/pgcrypto extensions for regional deployments.

## 2025-03-28 – Compliance & Data Governance Rollout
- Added migration `20250320000000-compliance-data-governance.js` creating the `regions` table, GDPR data subject request ledger, finance/message/storefront history tables, and region-aware indexes while backfilling existing entities.
- Implemented `dataGovernanceService` with subject resolution, export generation, retention-safe storage paths, and sanitised audit logging plus scheduled `dataGovernanceRetentionJob` wiring through the job index.
- Extended `complianceController`, routes, and RBAC policies to expose `/api/compliance/data-requests` CRUD/status/export flows guarded by hardened permissions and recorded the new Sequelize models for regions, requests, finance history, message history, and storefront revisions.

## 2025-03-30 – Warehouse CDC Exports & Credential Rotation
- Added migration `20250321000000-data-warehouse-exports.js`, Sequelize model `WarehouseExportRun`, and associations to track dataset/region exports with audit trails, status, and storage metadata.
- Introduced `dataWarehouseExportService` plus scheduled job wiring to stream orders, finance, and communications datasets into compressed NDJSON bundles, exposing `/api/compliance/data-warehouse/runs` endpoints guarded by new RBAC policies.
- Enforced TLS-by-default database connections, Secrets Manager-backed credential rotation via `databaseCredentialRotationService`, and interval job orchestration that refreshes secrets, updates pools, and terminates stale sessions post-rotation.
