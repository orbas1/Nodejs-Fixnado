# Task 1.2 — Shared Infrastructure Upgrades

## Summary
Task 1.2 hardens the shared delivery foundation by migrating the platform to managed PostgreSQL/PostGIS, centralising feature flag governance, and enforcing staging/production parity.

## Delivery Highlights
- **PostGIS-ready database tier**: Terraform now provisions Amazon RDS PostgreSQL 15 with PostGIS, pg_stat_statements, IAM auth, and SSL enforcement. Security groups, subnet groups, and KMS policies remain aligned with the mobilisation blueprint.
- **Runtime verification tooling**: API bootstrap (`src/app.js`) and `backend-nodejs/scripts/bootstrap-postgis.mjs` ensure PostGIS, topology, and UUID extensions exist before serving requests, preventing environment drift.
- **Secrets-driven feature toggles**: Feature flag manifests live in AWS Secrets Manager (`infrastructure/terraform/runtime-config/feature_toggles/*.json`) and are surfaced through `/api/admin/feature-toggles` for RBAC-controlled reads/updates with audit logging.
- **Environment parity guardrails**: `scripts/environment-parity.mjs` compares tfvars keys and feature toggle states between staging and production, enabling CI to block releases when configuration diverges.
- **Auditability**: Toggle mutations are captured in the `feature_toggle_audits` table with actor, ticket, rollout, and description data for compliance reporting.

## Evidence & Artefacts
- Terraform updates: `infrastructure/terraform/database.tf`, `secrets.tf`, `outputs.tf`, `runtime-config/feature_toggles/*.json`.
- Backend configuration & services: `src/config/index.js`, `src/config/database.js`, `src/app.js`, `src/services/featureToggleService.js`, `src/controllers/featureToggleController.js`, `src/routes/adminRoutes.js`.
- Database migrations: `src/database/migrations/20250215000000-feature-toggle-audit.js` and UUID default updates.
- Tooling & tests: `backend-nodejs/scripts/bootstrap-postgis.mjs`, `scripts/environment-parity.mjs`, `tests/featureToggleService.test.js`.

## Next Steps
1. Integrate the parity script and feature toggle audit feed into CI/CD promotion checks.
2. Extend admin UI to consume the new toggle endpoints with rollout visualisation and audit history.
3. Automate Secrets Manager rotation policies for toggle manifests and app config secrets.
