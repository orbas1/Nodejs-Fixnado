## 2025-10-13 — Postgres/PostGIS Platform Migration
- Terraform now provisions Amazon RDS PostgreSQL 15 with PostGIS and pg_stat_statements enabled, replacing the former MySQL instance while retaining subnet/KMS hardening.
- Backend bootstrap (`src/app.js`) creates PostGIS, topology, and `uuid-ossp` extensions on start-up and aborts with actionable errors when privileges are missing.
- Added `feature_toggle_audits` table for Secrets Manager updates, ensuring feature rollout changes are journaled with actor, rollout, and ticket metadata.

## 2025-10-17 — Inventory & Rental Schema Expansion
- Migration `20250217000000-create-inventory-and-rentals.js` adds `inventory_items`, `inventory_ledger_entries`, `inventory_alerts`, `rental_agreements`, and `rental_checkpoints` tables with UUID PKs, deposit/insurance fields, inspection metadata, audit timestamps, and indexes on foreign keys + alert status to support health queries and queue dashboards.
- Established cascading associations and transactional constraints so inventory reservations/ledger entries update atomically with rental agreements, preventing orphaned rental records or inconsistent stock counts across sqlite/Postgres environments.
