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
