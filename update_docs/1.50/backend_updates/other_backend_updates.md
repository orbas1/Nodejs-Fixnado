## Application Bootstrap Guards

- Added a PII configuration assertion during Express bootstrap to halt startup when encryption or hash keys are missing, reducing the risk of silently persisting plaintext data.

## Graceful Shutdown & Job Lifecycle

- Refactored the server bootstrap to retain background job handles, expose a `stopBackgroundJobs` helper, and drain all timers before closing the HTTP listener so deployments no longer leak workers against drained databases.
- Added signal handlers for `SIGINT`, `SIGTERM`, unhandled rejections, and uncaught exceptions, ensuring Sequelize pools close cleanly and readiness is updated to `stopping`/`stopped` for observability dashboards.
- Configured a configurable shutdown timeout (`SECURITY_SHUTDOWN_TIMEOUT_MS`) fallback that forces exit with a readiness snapshot if drains hang, protecting deployment automation from stalled processes.
