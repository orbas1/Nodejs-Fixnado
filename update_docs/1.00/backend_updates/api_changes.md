## 2025-02-10 — Geo-Zone & Booking APIs
- Introduced `/api/zones` endpoints for CRUD, analytics snapshot generation, and filtered listing with optional latest analytics payloads (`routes/zoneRoutes.js`, `controllers/zoneController.js`).
- Added `/api/bookings` resource with status transitions, provider assignments, bid lifecycle, comments, and disputes, exposing orchestration metadata for admin/provider/client applications (`routes/bookingRoutes.js`, `controllers/bookingController.js`).

## 2025-10-17 — Inventory & Rental APIs
- Registered `/api/inventory` router delivering item CRUD, ledger exports, health summaries, reconciliation workflows, and alert acknowledgement/snooze/escalation endpoints aligned to provider/admin console requirements (`routes/inventoryRoutes.js`, `controllers/inventoryController.js`).
- Introduced `/api/rentals` endpoints covering rental request submission, approvals, contract signing, checkout, returns (partial + full), inspection checkpoints, settlement, cancellation, and dispute escalation with audit-grade payloads (`routes/rentalRoutes.js`, `controllers/rentalController.js`).

## 2025-10-18 — Compliance & Marketplace APIs
- Added `/api/compliance` endpoints for insured seller governance: document submission (`POST /documents`), review decisions (`POST /documents/:id/review`), badge visibility toggles, suspensions, company-level evaluations, and compliance summaries powering badge manager + moderation UI.
- Extended `/api/marketplace` with compliance-aware listing creation (`POST /items`), review submission (`POST /items/:id/submit`), moderation decisions (`POST /items/:id/moderate`), moderation queue listing, and curated approved listing feed (`GET /items/approved`), while `GET /api/feed/marketplace` now surfaces compliance snapshots and respects hold/expiry filters.

## 2025-10-19 — Campaign Manager APIs
- Registered `/api/campaigns` router delivering campaign CRUD (`POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`), status toggles, and summary listing filtered by advertiser, status, or flight window for admin/provider dashboards.
- Added flight management endpoints (`POST /:id/flights`, `PATCH /:id/flights/:flightId`) enforcing max-flight limits, start/end validation, and spend caps aligned to configuration defaults.
- Introduced pacing ingestion endpoint `POST /:id/daily-metrics` accepting daily spend/impression/click payloads, applying overspend governance, and emitting next-action flags consumed by UI pacing badges.
- Delivered invoice generation endpoint `POST /:id/invoices` and settlement retrieval `GET /:id/invoices/:invoiceId` tying campaign spend to finance reconciliation flows with due-date calculations and PDF export hooks.
- Added targeting and fraud management endpoints: `PUT /:id/targeting` replaces targeting rule sets atomically; `GET /:id/fraud-signals` lists unresolved/resolved anomalies; `POST /fraud-signals/:signalId/resolve` records remediation; and `GET /:id/summary` surfaces aggregate KPI data (impressions, spend, ROI, open anomalies) for dashboards and finance.

## 2025-10-22 — Communications APIs
- Introduced `/api/communications` endpoints for listing conversations with pagination/search filters, creating new threads with participant role assignments, and fetching conversation detail with AI assist metadata and delivery audit trail.
- Added message send endpoint supporting AI-assist suggestions (`POST /:conversationId/messages`), delivery acknowledgement endpoint (`POST /:conversationId/messages/:messageId/deliveries`), and quiet-hour override acknowledgement (`POST /:conversationId/quiet-hours/override`) to honour compliance guardrails.
- Exposed Agora session token generation (`POST /:conversationId/video-session`) returning channel, token, and expiry metadata plus AI assist configuration endpoint for clients to fetch provider status/limits, ensuring React/Flutter workspaces remain synchronised.
