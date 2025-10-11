## 2025-10-13 — Postgres/PostGIS Platform Migration
- Terraform now provisions Amazon RDS PostgreSQL 15 with PostGIS and pg_stat_statements enabled, replacing the former MySQL instance while retaining subnet/KMS hardening.
- Backend bootstrap (`src/app.js`) creates PostGIS, topology, and `uuid-ossp` extensions on start-up and aborts with actionable errors when privileges are missing.
- Added `feature_toggle_audits` table for Secrets Manager updates, ensuring feature rollout changes are journaled with actor, rollout, and ticket metadata.
