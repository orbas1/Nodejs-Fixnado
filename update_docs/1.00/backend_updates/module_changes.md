## 2025-02-10 — Sequelize Model Additions
- `models/serviceZone.js` upgraded with boundary/centroid/bounding box metadata for PostGIS interoperability.
- New models `booking.js`, `bookingAssignment.js`, `bookingBid.js`, `bookingBidComment.js`, and `zoneAnalyticsSnapshot.js` underpin booking orchestration, provider assignments, bidding audit logs, and analytics persistence.

## 2025-10-17 — Inventory & Rental Models
- Added `models/inventoryItem.js`, `models/inventoryLedgerEntry.js`, and `models/inventoryAlert.js` to persist inventory balances, ledger history, alert lifecycle metadata, and health calculations with association hooks for reconciliation workflows.
- Introduced `models/rentalAgreement.js` and `models/rentalCheckpoint.js` capturing rental contract state, deposit/deferred balance tracking, inspection checkpoints, and compliance evidence fields for settlement and dispute resolution.
