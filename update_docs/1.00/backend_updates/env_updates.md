## 2025-02-10 — Finance & Zone Analytics Env Vars
- Added finance configuration knobs: `FINANCE_DEFAULT_CURRENCY`, `FINANCE_COMMISSION_RATES`, `FINANCE_TAX_RATES`, `FINANCE_EXCHANGE_RATES`, `FINANCE_SLA_TARGET_MINUTES`.
- Added zone analytics scheduling knobs: `ZONE_ANALYTICS_INTERVAL_MINUTES`, `ZONE_ANALYTICS_STALE_MINUTES`.

## 2025-10-13 — Database & Feature Toggle Env Vars
- Documented Postgres controls: `DB_DIALECT`, `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, `DB_POOL_MAX`, `DB_POOL_IDLE`, `DB_POOL_ACQUIRE`, `PG_STATEMENT_TIMEOUT`, ensuring deploy pipelines pin pooled behaviour and SSL posture.
- Added feature toggle envs consumed by Secrets Manager integration: `FEATURE_TOGGLE_SECRET_ARN`, `FEATURE_TOGGLE_CACHE_SECONDS`, `FEATURE_TOGGLE_OVERRIDES`, `FEATURE_TOGGLE_AUDIT_TABLE`.

## 2025-10-22 — Communications & Agora Env Vars
- Added AI assist configuration: `COMMS_AI_ENDPOINT`, `COMMS_AI_KEY`, `COMMS_AI_MODEL`, `COMMS_AI_TEMPERATURE`, and `COMMS_AI_TIMEOUT_MS` to govern provider calls and heuristic fallbacks.
- Documented quiet-hour and retention controls (`COMMS_DEFAULT_QUIET_HOURS`, `COMMS_MESSAGE_RETENTION_DAYS`, `COMMS_DELIVERY_MAX_RETRY`) plus notification suppression override toggle `COMMS_ALLOW_OVERRIDE_ROLES`.
- Captured Agora credentials and session configuration: `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_SESSION_TTL_SECONDS`, ensuring operators supply production secrets before enabling video escalation.

## 2025-10-26 — Analytics Pipeline Env Vars
- Introduced ingestion configuration: `ANALYTICS_INGEST_ENDPOINT`, `ANALYTICS_INGEST_API_KEY`, `ANALYTICS_INGEST_BATCH_SIZE`, `ANALYTICS_INGEST_INTERVAL_SECONDS`, `ANALYTICS_INGEST_TIMEOUT_MS` controlling batch delivery cadence and transport resilience.
- Added retention/backfill knobs: `ANALYTICS_RETENTION_DAYS`, `ANALYTICS_PURGE_BATCH_SIZE`, `ANALYTICS_BACKFILL_LOOKBACK_HOURS`, `ANALYTICS_RETRY_SCHEDULE_MINUTES` enabling warehouse teams to tune purge cadence and retry schedule without redeploys.
- Documented expectation that lower environments can omit endpoint/API key (job logs a structured warning and records failure) while staging/production must provide fully qualified HTTPS endpoints for ingestion.

## 2025-10-28 — Analytics Pipeline Control Env Vars
- Added `ANALYTICS_INGEST_ENABLED` to allow emergency disablement without redeploying; defaults to `true` so production stays online unless explicitly paused.
- Introduced `ANALYTICS_INGEST_TOGGLE_KEY` for Secrets Manager integration, aligning pause/resume endpoints with the governed toggle namespace used by other feature controls.
- Captured `ANALYTICS_CONTROL_CACHE_SECONDS` to tune control-state caching and ensure dashboard/API responses reflect toggle changes within a predictable window for operations teams.
