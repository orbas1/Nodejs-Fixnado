## 2025-02-10 — Zone, Booking & Finance Services
- `services/zoneService.js` validates GeoJSON (via `@turf`), computes centroids/bounding boxes, persists PostGIS-ready geometry, and orchestrates analytics snapshots for downstream dashboards.
- `services/bookingService.js` centralises booking state machine logic (SLA timers, assignments, bids, disputes) with transactional safeguards and metadata updates required by admin/provider workflows.
- `services/financeService.js` introduces commission/tax/multi-currency calculations with environment-driven rates, surfacing totals/metadata for reconciliation.

## 2025-10-13 — Feature Toggle Service & Audit Trail
- Added `services/featureToggleService.js` to load toggle manifests from Secrets Manager, cache results, validate updates, and write audit records to `feature_toggle_audits`. Exposes helper utilities for cache resets, client overrides (tests), and cache version introspection.
