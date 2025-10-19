# API Surface Changes – Version 1.00 UT-004

- Introduced `/v1/timeline-hub` GET endpoint returning combined timeline analytics, custom job feed, marketplace spotlight, ad placements, and support readiness payloads.
- Added `/v1/timeline-hub/moderation` GET endpoint surfacing prioritised moderation queue metrics with SLA breach detection.
- Added `/v1/timeline-hub/moderation/:auditId/actions` POST endpoint for status transitions, reassignments, and note capture on live feed audit events.
- Added `/v1/timeline-hub/support/chatwoot/sessions` POST endpoint bootstrapping Chatwoot widget sessions and emitting audit events.

# API Surface Changes – Version 1.00 UT-005

- Added `/v1/commerce/snapshot` GET endpoint returning persona-aware commerce snapshots across payments, orders, escrow, invoices, and wallets with timeframe filters.
- Added `/v1/commerce/personas/:persona` GET endpoint returning structured commerce dashboards to power persona navigation, readiness scores, and alerting overlays.
