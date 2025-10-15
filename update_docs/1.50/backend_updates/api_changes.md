# API Changes

## Gateway Policies
- Health monitoring clients should switch from probing `/` to `/healthz` to receive structured diagnostics and HTTP 503 failover signals.
- Clients making cross-origin requests must ensure their origin appears in the central allowlist; partner onboarding runbooks have been updated to capture the new requirement.
- Excessive request bursts now receive HTTP 429 responses including a `retryAfterSeconds` hint, providing predictable behaviour for SDK backoff implementations.

## API Versioning & Readiness
- All REST controllers are now exposed under a versioned `/api/v1` namespace while retaining the legacy `/api` mount as a compatibility bridge; SDKs and documentation should begin referencing the versioned paths for forward compatibility.
- `/readyz` joins `/healthz` as a first-class operational endpoint, reporting readiness for the database, background jobs, and HTTP server so deploy pipelines can block traffic until the service is fully initialised.
- `/healthz` responses now embed readiness telemetry, giving observability systems a single payload covering both latency diagnostics and component readiness states.

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

## Compliance Data Requests
- `/api/compliance/data-requests` (POST) records GDPR access/erasure/rectification requests, auto-linking known users via hashed email, resolving region codes, and logging audit metadata.
- `/api/compliance/data-requests` (GET) supports optional `status` filters and returns enriched records including audit history, processed timestamps, payload locations, and associated region codes.
- `/api/compliance/data-requests/:id/export` triggers asynchronous export generation with region-specific storage, while `/status` updates allow authorised operators to progress requests through `received`, `in_progress`, `completed`, and `rejected` states.
- `/api/compliance/data-requests/metrics` (GET) aggregates backlog size, SLA exposure, percentile completion timings, `dueSoonWindowDays`, and `oldestPending` metadata with support for the same filters as the listing endpoint; responses feed the web/mobile dashboards and regression tests cover query combinations.
- `/api/consent/verify` checks that the provided subject has active consent for the supplied policies, returning HTTP 428 with structured details when any mandatory agreements are missing or stale.

## Compliance Data Warehouse
- `/api/compliance/data-warehouse/runs` (GET) lists warehouse export runs, allowing optional `dataset`, `regionCode`, and `limit` query parameters while returning status, row counts, audit metadata, and resolved region summaries for each run.
- `/api/compliance/data-warehouse/runs` (POST) schedules an export for the requested dataset/region, enforcing the `compliance:data-warehouse:export` policy and returning the persisted `WarehouseExportRun` payload including file location and generated audit trail.

## Booking Risk & Scam Detection
- Booking creation now enriches analytics metadata with `risk.score`, `risk.reasonCodes`, and `risk.escalated` fields based on heuristic scoring and optional AI analysis.
- High-risk bookings trigger Opsgenie escalations when the integration is configured; downstream consumers should expect audit events and risk annotations even if the external escalation is unavailable.
- API consumers should tolerate booking creation succeeding with warnings logged server-side when AI enrichment times out—the booking payload still contains risk metadata for follow-up actions.

## RBAC Policy Metadata
- New RBAC matrix definitions expose `describeRole` metadata for each persona via internal tooling; integration partners pulling policy snapshots should rely on the exported navigation/data visibility hints instead of duplicating role logic.
- Route guards continue to use permission strings defined in `src/constants/permissions.js`; clients building dashboards should subscribe to permission-driven feature toggles rather than inferring capabilities from legacy role names.
- Downstream systems storing role grants (analytics, support tooling) must refresh cached permission inventories to capture new finance, compliance, integration, and support scopes prior to orchestrating task automation.

## Policy Enforcement & Audit Logging
- Privileged endpoints now respond with HTTP 401 for unauthenticated requests and HTTP 403 for authenticated actors missing the required permissions; clients must handle both states distinctly when presenting error copy.
- Security audit events can be streamed to an optional webhook defined by `SECURITY_AUDIT_WEBHOOK_URL`; payloads include `resource`, `action`, `decision`, and sanitised metadata fields. Configure downstream listeners to accept the JSON schema and honour sampling.
- Requests should continue forwarding correlation identifiers (`x-request-id`, `x-correlation-id`, or `x-amzn-trace-id`) so audit entries link to upstream observability pipelines; missing IDs will be auto-generated but correlation is improved when clients supply them.

## Secrets & Configuration
- AWS Secrets Manager is now the authoritative source for runtime secrets. Deployments must set `SECRETS_MANAGER_SECRET_IDS` with one or more vault entries containing key/value pairs (e.g., `JWT_SECRET`, `DB_PASSWORD`, `STRIPE_SECRET_KEY`).
- The API refuses to boot when `JWT_SECRET` or database credentials are absent after vault hydration; ensure the shared secret bundle is populated ahead of deployments.
- Operations teams should use the updated `backend-nodejs/sql/install.sql` Postgres script when bootstrapping new environments—the script prompts for strong passwords, revokes default privileges, and installs `pgcrypto`, `uuid-ossp`, and PostGIS extensions by default.
