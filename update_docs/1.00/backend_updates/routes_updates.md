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
