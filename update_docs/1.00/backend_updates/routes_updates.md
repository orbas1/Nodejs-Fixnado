## 2025-02-10 — New Zone & Booking Routers
- Registered `zoneRoutes.js` and `bookingRoutes.js` in API index, exposing zone CRUD/analytics and booking lifecycle endpoints respectively.

## 2025-10-13 — Admin Feature Toggle Endpoints
- Extended `adminRoutes.js` with `/feature-toggles` read/patch endpoints guarded by `authenticate` + `authorize` middleware. Calls flow through the Secrets Manager–backed service so rollout adjustments and parity checks stay auditable.

## 2025-10-17 — Inventory & Rental Routes
- Registered `inventoryRoutes.js` and `rentalRoutes.js` with the API index, exposing REST contracts for inventory CRUD/ledger/health/alerts and rental lifecycle operations (request, approval, checkout, checkpoint logging, settlement, cancellation) with rate limiting + validation middleware inherited from shared router utilities.

## 2025-10-18 — Compliance & Marketplace Routes
- Added `/api/compliance` router for document submission (`POST /documents`), review (`POST /documents/:id/review`), badge toggles (`POST /companies/:id/badge`), suspension/evaluation endpoints, and company compliance summaries, linking directly to insured seller governance dashboards.
- Registered `/api/marketplace` router providing listing creation (`POST /items`), review submission, moderation decisions, moderation queue retrieval, and compliance-aware approved listing feed (`GET /items/approved`), with `routes/index.js` updated to mount both routers.

## 2025-10-19 — Campaign Routes
- Registered `campaignRoutes.js` mounting `/api/campaigns` endpoints for campaign CRUD, flight management, pacing ingestion, invoice issuance, and status toggles with validation middleware + rate limiting inherited from shared router utilities.
- Updated `routes/index.js` to expose the campaign router alongside inventory, rentals, compliance, and marketplace modules so monetisation APIs remain discoverable and versioned.
- Expanded router with targeting replacement (`PUT /:campaignId/targeting`), fraud monitoring (`GET /:campaignId/fraud-signals`, `POST /fraud-signals/:signalId/resolve`), analytics ingestion (`POST /:campaignId/metrics`), and KPI summary (`GET /:campaignId/summary`) routes feeding admin/provider dashboards and finance playbooks.

## 2025-10-22 — Communications Routes
- Registered `communicationsRoutes.js` to expose `/api/communications` endpoints for conversation listing, creation, participant enrolment, AI-assisted message sends, delivery acknowledgements, quiet-hour overrides, and Agora session token minting.
- Updated `routes/index.js` to mount the communications router and ensure request logging/audit middleware capture chat traffic alongside existing marketplace/monetisation services.
- Added validation middleware enforcing attachment limits, AI toggle presence, and quiet-hour acknowledgement metadata so downstream controllers receive production-safe payloads.

## 2025-10-28 — Analytics Pipeline Routes
- Mounted `analyticsPipelineRoutes.js` under `/api/analytics`, exposing `GET /pipeline/status` for backlog/run telemetry plus `POST /pipeline/pause` and `POST /pipeline/resume` control endpoints guarded by payload validation.
- Status responses now surface backlog counts, oldest pending timestamp, next retry window, failure streak, last success/error metadata, and recent run summaries for dashboards and runbooks.
- Pipeline control endpoints push updates through the feature toggle service and record audit runs so operations teams can gate ingestion safely; `routes/index.js` updated to mount the router alongside communications/marketplace modules.

## 2025-10-29 — Persona Dashboard Routes & Exports
- Extended `analyticsPipelineRoutes.js` to register `GET /dashboards/:persona` and `/dashboards/:persona/export`, reusing validator middleware to require UUID company/provider IDs, ISO8601 windows, and timezone bounds while allowing the service to surface 404s for unsupported personas.
- Dashboard endpoint returns aggregated payloads with export metadata so frontend layouts hydrate KPIs, pipelines, compliance tables, and CSV CTAs without duplicating query-string assembly. Export route streams UTF-8 CSV responses with persona-specific filenames and attachment headers to keep scheduled ingestion deterministic.
- API index/OpenAPI catalogue now list persona coverage, query parameters, validation errors (422), and 404 behaviour so analytics tooling can automate downloads and observability dashboards with confidence.

## 2025-10-30 — Persona Route Validation
- Smoke-tested `/api/analytics/dashboards/:persona` + `/export` under staging credentials to confirm validator middleware, timezone defaults, and export row caps operate as expected prior to release.【F:backend-nodejs/tests/analyticsDashboards.test.js†L1-L200】
- Verified analytics router continues to co-host pipeline controls and persona dashboards without route conflicts, and recorded backlog item to publish non-interactive Vitest reporters for clearer regression logs when running analytics suites.【3d3b31†L1-L38】

## 2025-10-31 — Zone Service Coverage Routes
- Updated `zoneRoutes.js` to expose coverage management endpoints (`GET /:zoneId/services`, `POST /:zoneId/services`, `DELETE /:zoneId/services/:coverageId`) that coordinate with the service layer to attach/detach provider offerings, enforcing company ownership and actor metadata requirements.【F:backend-nodejs/src/routes/zoneRoutes.js†L1-L32】
- API index retains backward-compatible CRUD/analytics endpoints while layering coverage operations so explorer/admin clients can hydrate zone-service relationships without bespoke wiring.【F:backend-nodejs/src/routes/index.js†L1-L34】
