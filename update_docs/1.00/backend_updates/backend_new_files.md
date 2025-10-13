# New Backend Files — 2025-02-09

- `tests/serviceRoutes.test.js` — Vitest + Supertest suite validating service creation/purchase flows with chaos rollback coverage.
- `tests/services.contract.test.js` — Contract validation harness using Zod to enforce service list payload schema.
- `vitest.config.js` & `vitest.setup.js` — Vitest configuration enabling sqlite-backed, single-threaded execution within CI.
## 2025-02-10 — Added Files
- `src/controllers/zoneController.js`
- `src/controllers/bookingController.js`
- `src/services/zoneService.js`
- `src/services/bookingService.js`
- `src/services/financeService.js`
- `src/routes/zoneRoutes.js`
- `src/routes/bookingRoutes.js`
- `src/jobs/zoneAnalyticsJob.js`
- `src/models/booking.js`
- `src/models/bookingAssignment.js`
- `src/models/bookingBid.js`
- `src/models/bookingBidComment.js`
- `src/models/zoneAnalyticsSnapshot.js`
- `tests/zoneRoutes.test.js`
- `tests/bookingRoutes.test.js`

## 2025-10-13 — Added Files
- `src/services/featureToggleService.js`
- `src/controllers/featureToggleController.js`
- `src/database/migrations/20250215000000-feature-toggle-audit.js`
- `scripts/bootstrap-postgis.mjs`
- `tests/featureToggleService.test.js`

## 2025-10-17 — Added Files
- `src/models/inventoryItem.js`
- `src/models/inventoryLedgerEntry.js`
- `src/models/inventoryAlert.js`
- `src/models/rentalAgreement.js`
- `src/models/rentalCheckpoint.js`
- `src/controllers/inventoryController.js`
- `src/controllers/rentalController.js`
- `src/services/inventoryService.js`
- `src/services/rentalService.js`
- `src/routes/inventoryRoutes.js`
- `src/routes/rentalRoutes.js`
- `tests/rentalRoutes.test.js`
- `src/database/migrations/20250217000000-create-inventory-and-rentals.js`

## 2025-10-18 — Added Files
- `src/models/complianceDocument.js`
- `src/models/insuredSellerApplication.js`
- `src/models/marketplaceModerationAction.js`
- `src/services/complianceService.js`
- `src/services/marketplaceService.js`
- `src/controllers/complianceController.js`
- `src/controllers/marketplaceController.js`
- `src/routes/complianceRoutes.js`
- `src/routes/marketplaceRoutes.js`
- `tests/complianceMarketplace.test.js`
- `src/database/migrations/20250218000000-compliance-and-marketplace-moderation.js`

## 2025-10-19 — Added Files
- `src/models/adCampaign.js`
- `src/models/campaignFlight.js`
- `src/models/campaignTargetingRule.js`
- `src/models/campaignInvoice.js`
- `src/models/campaignDailyMetric.js`
- `src/services/campaignService.js`
- `src/controllers/campaignController.js`
- `src/routes/campaignRoutes.js`
- `tests/campaignRoutes.test.js`
- `src/database/migrations/20250219000000-create-campaign-manager.js`

## 2025-10-20 — Added Files
- `src/models/campaignFraudSignal.js`
- `src/models/campaignAnalyticsExport.js`
- `src/jobs/campaignAnalyticsJob.js`

## 2025-10-22 — Added Files
- `src/models/conversation.js`
- `src/models/conversationParticipant.js`
- `src/models/conversationMessage.js`
- `src/models/messageDelivery.js`
- `src/services/communicationsService.js`
- `src/controllers/communicationsController.js`
- `src/routes/communicationsRoutes.js`
- `tests/communicationsRoutes.test.js`
- `src/database/migrations/20250221000000-create-communications.js`

## 2025-10-24 — Added Files
- `src/models/analyticsEvent.js`
- `src/services/analyticsEventService.js`
- `src/database/migrations/20250223000000-create-analytics-events.js`

## 2025-10-26 — Added Files
- `src/jobs/analyticsIngestionJob.js`
- `tests/analyticsIngestionJob.test.js`
- `src/database/migrations/20250224000000-augment-analytics-events.js`

## 2025-10-28 — Added Files
- `src/models/analyticsPipelineRun.js`
- `src/database/migrations/20250225000000-create-analytics-pipeline-runs.js`
- `src/services/analyticsPipelineService.js`
- `src/controllers/analyticsPipelineController.js`
- `src/routes/analyticsPipelineRoutes.js`
- `tests/analyticsPipelineRoutes.test.js`
