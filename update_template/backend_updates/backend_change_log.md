# Backend Change Log

## 2024-05-20 – Marketplace Taxonomy & Verification
- Added marketplace taxonomy domain/node/facet models with associations for services, rental assets, and material sale profiles.
- Registered deterministic seed blueprint test (`marketplaceTaxonomySeed.test.js`) to guard blueprint regressions.
- Introduced taxonomy integrity CLI for checksum verification and rollback SQL emission.

## 2024-05-23 – Timeline Hub Orchestration & Support
- Shipped `timelineHubService` consolidating live feed audits, custom job posts, marketplace listings, and ad placements with analytics output.
- Exposed `/v1/timeline-hub` APIs (snapshot, moderation queue, Chatwoot session bootstrap) guarded by new route policies.
- Added `chatwootService` with timeout-safe session creation and audit logging; extended policy catalogue and unit tests for the new services.

## 2024-05-27 – Commerce Engine & Persona Dashboards
- Implemented `commerceEngineService` to aggregate payments, orders, escrow, invoices, wallets, and chargeback telemetry into persona-aware commerce snapshots with settlement analytics.
- Added `/v1/commerce/snapshot` and `/v1/commerce/personas/:persona` endpoints with policy gating, timeframe validation, and actor-aware context resolution.
- Expanded policy catalogue and Vitest coverage to ensure commerce alerts, wallet rollups, and persona dashboards render consistently across currencies.

## 2024-05-30 – Compliance & Launch Readiness
- Published migration `20250605000000-add-launch-readiness-legal-documents.js` inserting refund policy, community guidelines, about Fixnado, and FAQ documents with governance metadata and acknowledgement requirements.
- Extended legal document service/controller to surface health, acknowledgement, audience, and governance data in API responses; added Vitest coverage for metadata normalisation and publication lifecycle.
- Added `compliance.data-requests.metrics` policy to protect DSAR analytics endpoint and instrumented compliance documentation (DSAR playbook, go-live rehearsal) for release readiness evidence.

## 2024-06-02 – Campaign Manager Model Remediation
- Refactored `CampaignCreative`, `CampaignAudienceSegment`, and `CampaignPlacement` models to use shared database bootstrap, enumerated statuses, metadata sanitation, and production-grade indexes.
- Cleaned `src/models/index.js` to remove duplicate imports/exports, guard campaign associations, and re-export advertising constants for downstream services/tests.

## 2024-06-03 – RBAC & Alias Collision Hardening
- Replaced direct named imports in `accessControlService` with namespace bindings and export proxies so permissions constants load under Vitest/Vite without Rollup parse faults.
- Normalised `permissions.js` consumer matrix by restoring missing commas/deduplicating provider entries, preventing syntax errors when analysing RBAC metadata.
- Renamed Sequelize associations for admin user profiles (`adminUserProfile`), admin delegates (`delegateRecords`), and serviceman tax filings (`documentRecords`) to avoid naming collisions with JSON attributes.
