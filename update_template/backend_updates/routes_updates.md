# Route Updates – Version 1.00 UT-004

- Registered `backend-nodejs/src/routes/timelineHubRoutes.js` under `/v1/timeline-hub` with endpoints for hub snapshots, moderation actions, and Chatwoot support sessions.
- Updated `backend-nodejs/src/routes/index.js` to mount the new router alongside existing feed endpoints.

# Route Updates – Version 1.00 UT-005

- Added `backend-nodejs/src/routes/commerceRoutes.js` with `/v1/commerce/snapshot` and `/v1/commerce/personas/:persona` endpoints protected by policy middleware and shared timeframe filters.
- Updated `backend-nodejs/src/routes/index.js` to mount the commerce routes within the v1 router definition list.
