# Controller Changes — 2025-02-09

- `serviceController.purchaseService` now executes within a Sequelize transaction, rolling back order creation when escrow persistence fails and returning consistent 500 responses for operational chaos drills.
- Finder queries are transaction-scoped to prevent dirty reads during concurrent purchases and align with new Vitest rollback assertions.
## 2025-02-10 — Zone & Booking Controllers
- Added `zoneController.js` to translate service validation errors into HTTP responses, expose CRUD/list/snapshot endpoints, and support analytics toggles.
- Added `bookingController.js` encapsulating booking lifecycle endpoints (create, status updates, assignments, bids, comments, disputes) while preserving audit metadata.

## 2025-10-13 — Feature Toggle Administration
- Introduced `featureToggleController.js` with read (`getToggles`, `getToggle`) and update (`updateToggle`) handlers guarded by express-validator; PATCH requests enforce allowed states, rollout bounds, and respond with enriched metadata for admin UI consumption.
