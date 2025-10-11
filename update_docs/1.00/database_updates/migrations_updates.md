## 2025-10-13 — Feature Toggle Audit Table
- Added `20250215000000-feature-toggle-audit.js` migration creating `feature_toggle_audits` with rollout states, actor, ticket, and timestamp columns plus indexes on `toggle_key` and `changed_at` for reporting.
- Updated existing bootstrap migration to use `Sequelize.UUIDV4` defaults so Postgres and sqlite environments share the same UUID strategy without MySQL-specific literals.

## 2025-10-17 — Inventory & Rental Tables
- Added `20250217000000-create-inventory-and-rentals.js` migration establishing `inventory_items`, `inventory_ledger_entries`, `inventory_alerts`, `rental_agreements`, and `rental_checkpoints` with foreign key relationships, partial indexes on alert status/severity, and composite indexes for ledger lookups (itemId + occurredAt) to support health dashboards and reconciliation exports.
- Migration seeds default enumerations (alert statuses, rental statuses, checkpoint types) and enforces cascading deletes/updates so rental agreement closures reconcile outstanding ledger reservations, keeping sqlite test runs consistent with production Postgres semantics.
