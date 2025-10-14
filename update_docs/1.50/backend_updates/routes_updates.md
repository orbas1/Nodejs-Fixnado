# Routes & Endpoints Updates

## `/healthz` Operational Endpoint
- Added a dedicated `GET /healthz` route returning service status (`pass`/`fail`), uptime in seconds, ISO timestamp, and database latency metrics.
- Database health is measured through a timed `SELECT 1` probe with environment-configurable timeout handling to detect stalled replicas.
- Responses downgrade to HTTP 503 with the failing diagnostic payload when the database check does not pass, enabling traffic managers to take the node out of rotation automatically.

## Consent APIs
- Added `POST /api/consent` to persist banner/policy decisions with session/user context, enabling downstream audit queries and personalised privacy experiences.
- Added `GET /api/consent/history` to return paginated consent receipts filtered by session or user, supporting UI history drawers and legal requests.
- Routes inherit the new permissions middleware and feed events into the security audit trail, producing a consistent compliance record.
