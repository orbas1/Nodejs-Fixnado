## New Security & Compliance Events

- `security_audit_events` captures RBAC allow/deny decisions, admin logins, consent writes, and scam detection escalations, providing a single source for compliance dashboards.
- `consent_events` logs banner acknowledgements, privacy policy acceptances, and AI personalisation choices with session linkage for GDPR evidence.
- `scam_detection_events` records heuristics invoked for live feed posts, custom job bids, and messaging payloads, exposing risk scores and triggered signals to operations teams.
- Event creation is centralised through the new services so middleware and controllers can emit consistent metadata (actor role, IP address, request ID) without duplicating logic.
