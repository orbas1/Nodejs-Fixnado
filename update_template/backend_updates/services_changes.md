# Service Layer Changes – Version 1.00 UT-004

- Added `backend-nodejs/src/services/timelineHubService.js` to orchestrate live feed audits, custom job posts, marketplace listings, ad placements, and Chatwoot readiness into a single snapshot API with moderation analytics and SLA breach detection.
- Introduced `backend-nodejs/src/services/chatwootService.js` providing hardened Chatwoot widget configuration and session bootstrap with timeout handling and audit logging.
- Implemented unit coverage in `backend-nodejs/src/services/__tests__/timelineHubService.test.js` mocking feed, audit, ad placement, and Chatwoot integrations to validate analytics calculations and queue metrics.

# Service Layer Changes – Version 1.00 UT-005

- Delivered `backend-nodejs/src/services/commerceEngineService.js` to aggregate marketplace payments, order pipelines, escrow balances, invoices, and wallet health into persona-aware commerce snapshots with currency normalisation, chargeback detection, and settlement insights.
- Added Vitest coverage in `backend-nodejs/src/services/__tests__/commerceEngineService.test.js` to validate currency conversion, alert generation, persona dashboards, and missing-context enforcement for commerce analytics.

# Service Layer Changes – Version 1.00 UT-006

- Enhanced `backend-nodejs/src/services/legalDocumentService.js` to normalise acknowledgement requirements, governance metadata, and audience definitions, compute document health/status labels, and surface the enriched metadata through public and admin APIs.
- Seeded refund policy, community guidelines, about Fixnado, and FAQ content via migration `20250605000000-add-launch-readiness-legal-documents.js`, ensuring attachments, governance audit trails, and acknowledgement flags are initialised for compliance sampling.
