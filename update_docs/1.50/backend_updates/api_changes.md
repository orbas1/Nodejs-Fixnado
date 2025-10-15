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

## Consent Ledger Endpoints
- `/api/consent/snapshot` returns the latest decisions for each configured policy plus a resolved `subjectId`; clients should cache the returned `subjectId` to avoid generating redundant anonymous identities.
- `/api/consent/decisions` accepts consent decisions with metadata (channel, region, version) and persists them to the ledger while emitting audit events. Required policies respond with HTTP 200 and an updated policy snapshot.
- `/api/consent/verify` checks that the provided subject has active consent for the supplied policies, returning HTTP 428 with structured details when any mandatory agreements are missing or stale.

## Booking Risk & Scam Detection
- Booking creation now enriches analytics metadata with `risk.score`, `risk.reasonCodes`, and `risk.escalated` fields based on heuristic scoring and optional AI analysis.
- High-risk bookings trigger Opsgenie escalations when the integration is configured; downstream consumers should expect audit events and risk annotations even if the external escalation is unavailable.
- API consumers should tolerate booking creation succeeding with warnings logged server-side when AI enrichment times out—the booking payload still contains risk metadata for follow-up actions.

## RBAC Policy Metadata
- New RBAC matrix definitions expose `describeRole` metadata for each persona via internal tooling; integration partners pulling policy snapshots should rely on the exported navigation/data visibility hints instead of duplicating role logic.
- Route guards continue to use permission strings defined in `src/constants/permissions.js`; clients building dashboards should subscribe to permission-driven feature toggles rather than inferring capabilities from legacy role names.
- Downstream systems storing role grants (analytics, support tooling) must refresh cached permission inventories to capture new finance, compliance, integration, and support scopes prior to orchestrating task automation.
