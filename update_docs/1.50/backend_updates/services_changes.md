# Services Layer Changes – Version 1.50

## 2025-03-12
- Rebuilt `backend-nodejs/src/services/panelService.js` to restore coherent provider dashboards: actor-aware company lookup, booking and rental analytics, trust/review scoring, and inventory insights now power the responses.
- Added business front aggregation that blends bookings, campaign telemetry, inventory, and marketplace moderation history to deliver consistent marketing snapshots with monetisation-aware savings messaging.
- Refreshed helper utilities (inventory summaries, review extracts, crew rosters) to eliminate undefined references and provide production-ready calculations for downstream controllers and tests.

## 2025-03-17
- Implemented `backend-nodejs/src/services/sessionService.js` to orchestrate refresh-token hashing, JWT access token issuance, cookie management, and session rotation/revocation workflows.
- Updated `backend-nodejs/src/controllers/authController.js` and `authRoutes.js` to rely on the new service for login, refresh, and logout flows, emitting secure cookies for browsers and bearer tokens for mobile clients.
- Added Vitest coverage (`tests/sessionService.test.js`) to validate issuance semantics, cookie hygiene, rotation persistence, and token extraction to guard against regressions.

## 2025-03-18
- Introduced `backend-nodejs/src/services/consentService.js` with subject resolution, ledger serialisation, WCAG-aware policy surfacing, and audit trail integration.
- Added `backend-nodejs/src/services/scamDetectionService.js` delivering heuristic scoring, optional AI enrichment, Opsgenie escalations, and deterministic fallbacks when third-party services time out.
- Updated `backend-nodejs/src/services/bookingService.js` to invoke scam detection during transactional booking creation, persisting risk insights without blocking core booking fulfilment.
- Published Vitest coverage (`tests/consentService.test.js`, `tests/scamDetectionService.test.js`) capturing ledger state transitions, required-policy enforcement, heuristic thresholds, and escalation logic to keep the services regression-safe.
