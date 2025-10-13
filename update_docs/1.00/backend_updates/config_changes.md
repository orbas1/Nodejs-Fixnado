# Config Changes — 2025-02-09

- `src/config/database.js` now builds Sequelize instances based on environment: sqlite in-memory for NODE_ENV=test (with optional storage override), connection string support via `DB_URL`, and optional SSL enforcement, ensuring tests run without MySQL while production paths remain unchanged.
## 2025-02-10 — Finance & Analytics Configuration
- Extended `config/index.js` with finance rates (commission, tax, exchange, SLA targets) and zone analytics scheduling knobs (`ZONE_ANALYTICS_INTERVAL_MINUTES`, `ZONE_ANALYTICS_STALE_MINUTES`).
- Added JSON parsing helper for environment-provided rate maps ensuring production overrides can be injected without redeploys.

## 2025-10-13 — Postgres Defaults & Feature Toggle Secrets
- Defaulted database configuration to PostgreSQL with pooled connection settings, SSL toggles, and explicit dialect mapping; also exposed `DB_SSL_REJECT_UNAUTHORIZED`, `DB_POOL_*`, and statement timeout knobs for production hardening.
- Introduced `featureToggles` config block (`FEATURE_TOGGLE_SECRET_ARN`, `FEATURE_TOGGLE_CACHE_SECONDS`, `FEATURE_TOGGLE_OVERRIDES`, `FEATURE_TOGGLE_AUDIT_TABLE`) so the API can load toggle manifests from Secrets Manager with cache control and audit trail routing.

## 2025-10-19 — Campaign Governance Configuration
- Added `campaigns` config namespace with defaults for currency (`defaultCurrency`), invoice due horizon (`invoiceDueInDays`), maximum flights per campaign, overspend pause multiplier, and targeting rule caps to align API validation with finance/compliance policy.
- Surfaced environment variable overrides (`CAMPAIGN_DEFAULT_CURRENCY`, `CAMPAIGN_MAX_FLIGHTS`, `CAMPAIGN_OVERSPEND_MULTIPLIER`, `CAMPAIGN_TARGETING_CAP`) and defensive parsing so deployments can tune pacing + targeting limits without code changes.

## 2025-10-20 — Campaign Telemetry & Fraud Configuration
- Expanded `campaigns` config namespace to include overspend/underspend tolerances, suspicious CTR/CVR thresholds, delivery-gap impression floors, no-spend grace days, export batch size, and exporter cadence/retry values sourced from environment variables (`CAMPAIGN_OVERSPEND_TOLERANCE`, `CAMPAIGN_SUSPICIOUS_CTR_THRESHOLD`, `CAMPAIGN_EXPORT_INTERVAL_SECONDS`, etc.).
- Added analytics export endpoint/API key settings (`CAMPAIGN_ANALYTICS_ENDPOINT`, `CAMPAIGN_ANALYTICS_API_KEY`) so the background job can deliver governed payloads to the data warehouse with optional authentication.

## 2025-10-22 — Communications Configuration Namespace
- Introduced `communications` config block capturing AI assist provider endpoint/key/model/temperature, quiet-hour defaults, Agora credentials, delivery retry caps, and transcript retention days to keep chat orchestration environment-aware.
- Added helper parsing for JSON quiet-hour windows and fallback heuristics so deployments can tune suppression windows and AI thresholds without code changes.
- Surfaced safe defaults and validation for Agora session TTL plus AI assist temperature bounds, protecting production from misconfiguration during rollout.

## 2025-10-26 — Analytics Pipeline Configuration
- Added `analyticsPipeline` namespace with endpoint/API key, batch sizing, poll interval, retry schedule, retention horizon, purge batch size, lookback window, and request timeout knobs sourced from `ANALYTICS_*` environment variables to drive the new ingestion job.
- Extended JSON/int parsing helpers to normalise retry schedules and guard against invalid numeric overrides so ingestion cadence remains predictable across environments.
- Documented expectation that staging/production supply warehouse endpoints + API keys while lower environments rely on default noop behaviour, keeping CI hermetic yet configuration-complete.

## 2025-10-28 — Analytics Pipeline Control Toggles
- Added `ANALYTICS_INGEST_ENABLED`, `ANALYTICS_INGEST_TOGGLE_KEY`, and `ANALYTICS_CONTROL_CACHE_SECONDS` to the analytics pipeline config namespace, enabling environment-level kill switches and toggle cache tuning without redeploying.
- Pause/resume flows now rely on Secrets Manager overrides keyed by `controlToggleKey`; cached state prevents excessive toggle fetches while honouring env overrides.
- Configuration updates documented alongside service/job changes so operations understand precedence (env override → feature toggle → default) when gating warehouse ingestion.
