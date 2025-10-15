# API Changes

## Gateway Policies
- Health monitoring clients should switch from probing `/` to `/healthz` to receive structured diagnostics and HTTP 503 failover signals.
- Clients making cross-origin requests must ensure their origin appears in the central allowlist; partner onboarding runbooks have been updated to capture the new requirement.
- Excessive request bursts now receive HTTP 429 responses including a `retryAfterSeconds` hint, providing predictable behaviour for SDK backoff implementations.

## Panel & Storefront Endpoints
- `/api/panel/provider/dashboard` now returns enhanced payloads including `trust`, `reviews.summary.band`, and `marketplace.deals` keyed to platform commission settings; consumers should surface the new analytics fields for richer operator insights.
- `/api/business-fronts/:slug` outputs consolidated spend, programme, and escalation telemetry in addition to legacy hero/testimonial content—frontends must handle the expanded object to present finance and trust metrics.
- RBAC-aware company resolution is enforced server-side; admin callers continue to specify `companyId` while provider actors receive a 403 if they query organisations outside their ownership scope.
