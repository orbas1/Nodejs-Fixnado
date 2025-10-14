## Session & Consent Services

- Added `sessionTokenService` to issue, rotate, and revoke refresh sessions backed by the new `session_tokens` table. The helper stores hashed tokens, tracks rotation metadata, and enforces context-aware revocation APIs for cross-platform clients.
- Created `consentService` to persist granular consent receipts, retrieve latest acceptance records, and expose audit-friendly history queries for privacy/terms updates.
- Introduced `securityAuditService` and `scamDetectionService` to capture privileged access events and run heuristic scoring across bids, posts, and messaging payloads, feeding the new audit and scam detection tables.

## Secrets Vault Service

- Implemented `secretVaultService` as a thin caching layer over AWS Secrets Manager, exposing helpers for JWT signing keys, admin break-glass tokens, and database credentials with cache invalidation for rotations.
- Updated dependent controllers/middleware to import the vault helper rather than reference configuration secrets directly, centralising all secret resolution logic and ensuring tests can reset cache state deterministically.

## Feed Orchestration Updates

- `feedService` now records scam detection signals and writes to `scam_detection_events`, pairing risk scores with contextual metadata for operations review.
- Consent APIs integrate with `consentService` to log banner acknowledgements and provide retrieval endpoints for frontend privacy surfaces.
