## 2025-02-10 — Geo-Zone & Booking APIs
- Introduced `/api/zones` endpoints for CRUD, analytics snapshot generation, and filtered listing with optional latest analytics payloads (`routes/zoneRoutes.js`, `controllers/zoneController.js`).
- Added `/api/bookings` resource with status transitions, provider assignments, bid lifecycle, comments, and disputes, exposing orchestration metadata for admin/provider/client applications (`routes/bookingRoutes.js`, `controllers/bookingController.js`).

## 2025-10-17 — Inventory & Rental APIs
- Registered `/api/inventory` router delivering item CRUD, ledger exports, health summaries, reconciliation workflows, and alert acknowledgement/snooze/escalation endpoints aligned to provider/admin console requirements (`routes/inventoryRoutes.js`, `controllers/inventoryController.js`).
- Introduced `/api/rentals` endpoints covering rental request submission, approvals, contract signing, checkout, returns (partial + full), inspection checkpoints, settlement, cancellation, and dispute escalation with audit-grade payloads (`routes/rentalRoutes.js`, `controllers/rentalController.js`).
