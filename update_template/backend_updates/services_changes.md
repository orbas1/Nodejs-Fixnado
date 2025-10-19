# Service Layer Changes – Version 1.00 UT-004

- Added `backend-nodejs/src/services/timelineHubService.js` to orchestrate live feed audits, custom job posts, marketplace listings, ad placements, and Chatwoot readiness into a single snapshot API with moderation analytics and SLA breach detection.
- Introduced `backend-nodejs/src/services/chatwootService.js` providing hardened Chatwoot widget configuration and session bootstrap with timeout handling and audit logging.
- Implemented unit coverage in `backend-nodejs/src/services/__tests__/timelineHubService.test.js` mocking feed, audit, ad placement, and Chatwoot integrations to validate analytics calculations and queue metrics.
