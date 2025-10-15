# Routes & Endpoints Updates

## `/healthz` Operational Endpoint
- Added a dedicated `GET /healthz` route returning service status (`pass`/`fail`), uptime in seconds, ISO timestamp, and database latency metrics.
- Database health is measured through a timed `SELECT 1` probe with environment-configurable timeout handling to detect stalled replicas.
- Responses downgrade to HTTP 503 with the failing diagnostic payload when the database check does not pass, enabling traffic managers to take the node out of rotation automatically.

## `/api/compliance/data-requests`
- Introduced protected REST endpoints to submit (`POST /`), list (`GET /`), update status (`POST /:id/status`), and generate exports (`POST /:id/export`) for GDPR data subject requests.
- All routes enforce the hardened RBAC policies via `routePolicies.compliance.manageRequests`, log audit events, and return sanitised metadata suitable for portal consumption.
- Requests support optional status filtering, justification/region metadata, and respond with updated audit logs and export payload references when actions complete.
