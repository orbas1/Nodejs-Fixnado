# Config Changes — 2025-02-09

- `src/config/database.js` now builds Sequelize instances based on environment: sqlite in-memory for NODE_ENV=test (with optional storage override), connection string support via `DB_URL`, and optional SSL enforcement, ensuring tests run without MySQL while production paths remain unchanged.
