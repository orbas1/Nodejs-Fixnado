# Routes & Endpoints Updates

## `/healthz` Operational Endpoint
- Added a dedicated `GET /healthz` route returning service status (`pass`/`fail`), uptime in seconds, ISO timestamp, and database latency metrics.
- Database health is measured through a timed `SELECT 1` probe with environment-configurable timeout handling to detect stalled replicas.
- Responses downgrade to HTTP 503 with the failing diagnostic payload when the database check does not pass, enabling traffic managers to take the node out of rotation automatically.
