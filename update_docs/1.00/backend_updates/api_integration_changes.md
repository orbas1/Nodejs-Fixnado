## 2025-10-22 — Communications External Integrations
- Wired AI assist provider integration using configurable REST endpoint/keys so `communicationsService` can request draft suggestions; fallbacks log provider downtime and revert to heuristic responses for continuity.
- Integrated Agora token generation by adding `agora-access-token` dependency and encapsulating channel/token minting with expiry controls, ensuring video escalation launches remain compliant with retention rules.
- Documented quiet-hour override webhooks planned for notification platform and flagged requirement to rotate Agora credentials quarterly in deployment runbooks.
