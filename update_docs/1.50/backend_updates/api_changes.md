# API Changes

## Gateway Policies
- Health monitoring clients should switch from probing `/` to `/healthz` to receive structured diagnostics and HTTP 503 failover signals.
- Clients making cross-origin requests must ensure their origin appears in the central allowlist; partner onboarding runbooks have been updated to capture the new requirement.
- Excessive request bursts now receive HTTP 429 responses including a `retryAfterSeconds` hint, providing predictable behaviour for SDK backoff implementations.

## Consent & Session APIs
- Added `/api/consent` endpoints for banner acknowledgment and history retrieval; SDKs should include the session cookie and CSRF token generated during login to ensure records link to the correct consent stream.
- Refresh token rotations continue to use the rotated session identifier returned by login/refresh responses; clients must store the new `sid` cookie to correlate audit events and consent receipts.
