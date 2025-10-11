## 2025-02-10 — New Zone & Booking Routers
- Registered `zoneRoutes.js` and `bookingRoutes.js` in API index, exposing zone CRUD/analytics and booking lifecycle endpoints respectively.

## 2025-10-13 — Admin Feature Toggle Endpoints
- Extended `adminRoutes.js` with `/feature-toggles` read/patch endpoints guarded by `authenticate` + `authorize` middleware. Calls flow through the Secrets Manager–backed service so rollout adjustments and parity checks stay auditable.

## 2025-10-17 — Inventory & Rental Routes
- Registered `inventoryRoutes.js` and `rentalRoutes.js` with the API index, exposing REST contracts for inventory CRUD/ledger/health/alerts and rental lifecycle operations (request, approval, checkout, checkpoint logging, settlement, cancellation) with rate limiting + validation middleware inherited from shared router utilities.
