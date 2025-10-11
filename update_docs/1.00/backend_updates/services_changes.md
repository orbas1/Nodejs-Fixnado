## 2025-02-10 — Zone, Booking & Finance Services
- `services/zoneService.js` validates GeoJSON (via `@turf`), computes centroids/bounding boxes, persists PostGIS-ready geometry, and orchestrates analytics snapshots for downstream dashboards.
- `services/bookingService.js` centralises booking state machine logic (SLA timers, assignments, bids, disputes) with transactional safeguards and metadata updates required by admin/provider workflows.
- `services/financeService.js` introduces commission/tax/multi-currency calculations with environment-driven rates, surfacing totals/metadata for reconciliation.

## 2025-10-13 — Feature Toggle Service & Audit Trail
- Added `services/featureToggleService.js` to load toggle manifests from Secrets Manager, cache results, validate updates, and write audit records to `feature_toggle_audits`. Exposes helper utilities for cache resets, client overrides (tests), and cache version introspection.

## 2025-10-17 — Inventory & Rental Services
- Introduced `services/inventoryService.js` encapsulating stock CRUD, ledger entry persistence, reconciliation workflows, alert lifecycle management, and transactional quantity adjustments (reservations, checkout, returns, write-offs, restock) with automated low-stock alert updates.
- Added `services/rentalService.js` implementing rental agreement lifecycle (request → approval → checkout → return/inspection → settlement/cancellation), deposit handling, partial return reconciliation, damage assessments, dispute escalation, and alert propagation tied to inventory availability.
