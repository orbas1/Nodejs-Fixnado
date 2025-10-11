## 2025-02-10 — Sequelize Model Additions
- `models/serviceZone.js` upgraded with boundary/centroid/bounding box metadata for PostGIS interoperability.
- New models `booking.js`, `bookingAssignment.js`, `bookingBid.js`, `bookingBidComment.js`, and `zoneAnalyticsSnapshot.js` underpin booking orchestration, provider assignments, bidding audit logs, and analytics persistence.

## 2025-10-17 — Inventory & Rental Models
- Added `models/inventoryItem.js`, `models/inventoryLedgerEntry.js`, and `models/inventoryAlert.js` to persist inventory balances, ledger history, alert lifecycle metadata, and health calculations with association hooks for reconciliation workflows.
- Introduced `models/rentalAgreement.js` and `models/rentalCheckpoint.js` capturing rental contract state, deposit/deferred balance tracking, inspection checkpoints, and compliance evidence fields for settlement and dispute resolution.

## 2025-10-18 — Compliance & Marketplace Models
- Added `models/complianceDocument.js`, `models/insuredSellerApplication.js`, and `models/marketplaceModerationAction.js` with associations to `Company`, `User`, and `MarketplaceItem`, enabling insured seller governance, moderation audit trails, and badge toggles.
- Extended `models/company.js` and `models/marketplaceItem.js` with insured seller status fields, badge visibility flags, compliance hold windows, moderation notes, and JSON snapshots while updating `models/index.js` associations for compliance/mid-moderation relationships.

## 2025-10-19 — Campaign Domain Models
- Added `models/adCampaign.js`, `models/campaignFlight.js`, `models/campaignTargetingRule.js`, `models/campaignInvoice.js`, and `models/campaignDailyMetric.js` establishing associations between campaigns, companies, flights, invoices, and pacing metrics with scoped enums + computed fields for spend tracking.
- Updated `models/index.js` to register campaign associations (Company → AdCampaign, AdCampaign → Flights/TargetingRules/DailyMetrics/Invoices) and cascade settings so deletions respect invoice locks while maintaining sqlite/Postgres parity.
