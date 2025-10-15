# API Changes

## Gateway Policies
- Health monitoring clients should switch from probing `/` to `/healthz` to receive structured diagnostics and HTTP 503 failover signals.
- Clients making cross-origin requests must ensure their origin appears in the central allowlist; partner onboarding runbooks have been updated to capture the new requirement.
- Excessive request bursts now receive HTTP 429 responses including a `retryAfterSeconds` hint, providing predictable behaviour for SDK backoff implementations.

## Panel & Storefront Endpoints
- `/api/panel/provider/dashboard` now returns enhanced payloads including `trust`, `reviews.summary.band`, and `marketplace.deals` keyed to platform commission settings; consumers should surface the new analytics fields for richer operator insights.
- `/api/business-fronts/:slug` outputs consolidated spend, programme, and escalation telemetry in addition to legacy hero/testimonial content—frontends must handle the expanded object to present finance and trust metrics.
- RBAC-aware company resolution is enforced server-side; admin callers continue to specify `companyId` while provider actors receive a 403 if they query organisations outside their ownership scope.

## Authentication & Session Endpoints
- `/api/auth/login` now sets secure/httpOnly `fx_session` and `fx_refresh` cookies for browser clients while still returning bearer tokens for mobile channels; consumers must send `credentials: 'include'` when invoking from the web.
- `/api/auth/session/refresh` accepts refresh tokens from cookies or request body, rotates the session fingerprint, and re-issues JWT access tokens; clients should persist the replacement refresh token provided in the payload.
- `/api/auth/logout` revokes the active session and clears cookies when called with a valid access token, enabling consistent session teardown across web and mobile applications.
