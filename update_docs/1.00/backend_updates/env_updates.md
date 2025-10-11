## 2025-02-10 — Finance & Zone Analytics Env Vars
- Added finance configuration knobs: `FINANCE_DEFAULT_CURRENCY`, `FINANCE_COMMISSION_RATES`, `FINANCE_TAX_RATES`, `FINANCE_EXCHANGE_RATES`, `FINANCE_SLA_TARGET_MINUTES`.
- Added zone analytics scheduling knobs: `ZONE_ANALYTICS_INTERVAL_MINUTES`, `ZONE_ANALYTICS_STALE_MINUTES`.

## 2025-10-13 — Database & Feature Toggle Env Vars
- Documented Postgres controls: `DB_DIALECT`, `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, `DB_POOL_MAX`, `DB_POOL_IDLE`, `DB_POOL_ACQUIRE`, `PG_STATEMENT_TIMEOUT`, ensuring deploy pipelines pin pooled behaviour and SSL posture.
- Added feature toggle envs consumed by Secrets Manager integration: `FEATURE_TOGGLE_SECRET_ARN`, `FEATURE_TOGGLE_CACHE_SECONDS`, `FEATURE_TOGGLE_OVERRIDES`, `FEATURE_TOGGLE_AUDIT_TABLE`.
