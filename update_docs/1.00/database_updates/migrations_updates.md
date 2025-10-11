## 2025-10-13 — Feature Toggle Audit Table
- Added `20250215000000-feature-toggle-audit.js` migration creating `feature_toggle_audits` with rollout states, actor, ticket, and timestamp columns plus indexes on `toggle_key` and `changed_at` for reporting.
- Updated existing bootstrap migration to use `Sequelize.UUIDV4` defaults so Postgres and sqlite environments share the same UUID strategy without MySQL-specific literals.
