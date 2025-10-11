## 2025-02-10 — Zone, Booking & Finance Services
- `services/zoneService.js` validates GeoJSON (via `@turf`), computes centroids/bounding boxes, persists PostGIS-ready geometry, and orchestrates analytics snapshots for downstream dashboards.
- `services/bookingService.js` centralises booking state machine logic (SLA timers, assignments, bids, disputes) with transactional safeguards and metadata updates required by admin/provider workflows.
- `services/financeService.js` introduces commission/tax/multi-currency calculations with environment-driven rates, surfacing totals/metadata for reconciliation.
