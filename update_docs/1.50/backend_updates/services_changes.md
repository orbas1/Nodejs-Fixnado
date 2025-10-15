# Services Layer Changes – Version 1.50

## 2025-03-12
- Rebuilt `backend-nodejs/src/services/panelService.js` to restore coherent provider dashboards: actor-aware company lookup, booking and rental analytics, trust/review scoring, and inventory insights now power the responses.
- Added business front aggregation that blends bookings, campaign telemetry, inventory, and marketplace moderation history to deliver consistent marketing snapshots with monetisation-aware savings messaging.
- Refreshed helper utilities (inventory summaries, review extracts, crew rosters) to eliminate undefined references and provide production-ready calculations for downstream controllers and tests.
