# Config Changes — 2025-02-09

- `src/config/database.js` now builds Sequelize instances based on environment: sqlite in-memory for NODE_ENV=test (with optional storage override), connection string support via `DB_URL`, and optional SSL enforcement, ensuring tests run without MySQL while production paths remain unchanged.
## 2025-02-10 — Finance & Analytics Configuration
- Extended `config/index.js` with finance rates (commission, tax, exchange, SLA targets) and zone analytics scheduling knobs (`ZONE_ANALYTICS_INTERVAL_MINUTES`, `ZONE_ANALYTICS_STALE_MINUTES`).
- Added JSON parsing helper for environment-provided rate maps ensuring production overrides can be injected without redeploys.
