# Routes & Endpoints Updates

## `/healthz` Operational Endpoint
- Added a dedicated `GET /healthz` route returning service status (`pass`/`fail`), uptime in seconds, ISO timestamp, and database latency metrics.
- Database health is measured through a timed `SELECT 1` probe with environment-configurable timeout handling to detect stalled replicas.
- Responses downgrade to HTTP 503 with the failing diagnostic payload when the database check does not pass, enabling traffic managers to take the node out of rotation automatically.

## `/readyz` Readiness Endpoint
- Introduced `GET /readyz` delivering component-level readiness for the database, background jobs, and HTTP server along with uptime metadata so deploy orchestrators can distinguish startup vs. steady-state nodes.
- Emits HTTP 200 when all tracked components report `ready`; otherwise returns HTTP 503 with the structured readiness payload to keep load balancers and health monitors deterministic.
- Shares the same telemetry source that now enriches `/healthz`, providing operators with a single readiness contract while retaining latency metrics for health checks.

## `/api/v1/*` Versioned Namespace
- Wrapped existing domain routers under a `/api/v1` prefix while retaining the legacy `/api` mount for backwards compatibility, allowing clients to opt into explicit versioned endpoints without breaking existing integrations.
- Ensures newly added controllers automatically inherit versioning by registering against the shared router aggregator, eliminating duplicate wiring and reducing regression risk.
- Downstream SDKs and docs should begin referencing `/api/v1/...` endpoints; the legacy `/api` surface remains functional but is earmarked for deprecation once client upgrades complete.

## `/api/compliance/data-requests`
- Introduced protected REST endpoints to submit (`POST /`), list (`GET /`), update status (`POST /:id/status`), and generate exports (`POST /:id/export`) for GDPR data subject requests.
- All routes enforce the hardened RBAC policies via `routePolicies.compliance.manageRequests`, log audit events, and return sanitised metadata suitable for portal consumption.
- Requests support optional status filtering, justification/region metadata, and respond with updated audit logs and export payload references when actions complete.

### `/api/compliance/data-requests/metrics`
- Added `GET /metrics` providing aggregated backlog, SLA, percentile completion, `dueSoonWindowDays`, and `oldestPending` telemetry with the same query-string filters as the listing route.
- Endpoint leverages the upgraded `dataGovernanceService` analytics pipeline and returns HTTP 200 with structured metrics or HTTP 400 when invalid filters (unsupported status/region combinations) are supplied.
- Supertest coverage validates default responses, filter combinations, and ensures null `oldestPending` payloads when filters yield only completed requests.

## `/api/compliance/data-warehouse/runs`
- Added a policy-guarded listing endpoint (`GET /runs`) that returns paginated warehouse export runs filtered by dataset, region, status, and triggered-by metadata for audit reconcilation.
- Introduced a manual trigger endpoint (`POST /runs`) allowing operations users to launch CDC exports on-demand with validation around active runs, dataset availability, and lookback configuration overrides.
- Responses include NDJSON.gz storage paths, batch durations, record counts, and retention timestamps so operator consoles and compliance evidence packs surface actionable telemetry without inspecting the filesystem directly.

## `/api/feed/live/stream`
- Registered a streaming route protected by `authenticate` middleware and the `feed.live.read` policy, ensuring only authorised actors receive live feed events.
- Streams heartbeat, snapshot, and mutation events (post, bid, message) from the new `liveFeedStreamService`, respecting zone and out-of-zone filters supplied via query parameters.
