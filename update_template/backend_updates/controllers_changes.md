# Controller Changes – Version 1.00 UT-004

- Added `backend-nodejs/src/controllers/timelineHubController.js` exposing handlers for the hub snapshot, moderation queue, moderation status updates, and Chatwoot session bootstrap with request validation.

# Controller Changes – Version 1.00 UT-005

- Added `backend-nodejs/src/controllers/commerceController.js` to return commerce engine snapshots and persona dashboards, resolving actor context headers and enforcing timeframe validation before delegating to the aggregation service.

# Controller Changes – Version 1.00 UT-006

- Updated `backend-nodejs/src/controllers/legalController.js` so `/v1/legal/:slug` responses now expose status labels, health metadata, acknowledgement requirements, audience segments, and governance context for compliance dashboards and acknowledgement sampling.
