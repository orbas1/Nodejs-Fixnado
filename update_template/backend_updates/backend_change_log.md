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
