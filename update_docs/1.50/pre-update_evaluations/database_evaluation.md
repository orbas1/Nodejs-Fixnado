# Database Pre-Update Evaluation – Version 1.50

## Functionality
- **High – Regionalisation gaps**: Current migrations model a single market. There are no `region_id` columns or partitioning strategies in the key transactional tables (`orders`, `providers`, `service_zones`). Without these additions, the multi-region marketplace slated for 1.50 cannot launch.
- **High – Compliance audit requirements**: Orders, disputes, and payouts lack immutable audit trails or append-only history tables. Regulatory reviews require full traceability; we must implement temporal tables or change-data-capture pipelines.
- **Medium – Analytics enablement**: The product roadmap requires cohort analyses and SLA dashboards. There are no materialised views or scheduled ETL jobs to precompute these metrics, so dashboards will execute expensive ad-hoc queries.
- **Medium – Data retention tooling**: Planned GDPR tooling needs selective purge APIs. Our schema lacks soft-delete markers and archival buckets for personal data, risking non-compliance.
- **Low – Configuration metadata**: Feature toggles and experiment assignments are not stored centrally. Introduce configuration tables to persist feature flag states for auditability.
- **Low – ORM model drift**: `backend-nodejs/src/models/index.js` wires dozens of associations but none reference regional governance or tenancy. Adding `regionId` later will require rewriting relationships and migrations under pressure.

## Usability
- **High – Local setup friction**: `sql/install.sql` provisions a monolithic schema that takes minutes to run and seeds thousands of rows. Developers struggle to reset states quickly. Provide lightweight seed scripts or prebuilt database snapshots for common scenarios.
- **Medium – Dialect mismatch scripts**: `backend-nodejs/sql/install.sql` still targets MySQL (with `CREATE DATABASE` and `GRANT` statements) even though production is standardising on Postgres/PostGIS via Sequelize. Following the script leaves engineers with mismatched capabilities and no GIS extensions locally.
- **Medium – Migration discoverability**: Migrations follow timestamped filenames without contextual prefixes. Engineers cannot easily determine dependencies or impacts. Adopt a naming convention (`20250301_add_region_columns`) and document relationships.
- **Medium – Observability tooling**: There is no default slow query log or query plan capture enabled in the Docker images. Ship recommended MySQL/Postgres config to flag problematic queries early.
- **Medium – Schema documentation**: There is no ERD or schema reference available to front-end/mobile teams. Generate docs via `sequelize-auto` or `dbdocs.io` as part of the release prep.
- **Low – Data sandboxing**: QA environments share the same database credentials and connection strings. Provide per-environment secrets and user accounts to enforce least privilege.
- **Low – Dialect ambiguity**: `src/config/database.js` still toggles between Postgres, MySQL, and SQLite based on environment variables. Without documented guidance, developers unintentionally run tests on SQLite and miss Postgres-only constraints.

## Errors
- **High – Rollback instability**: Down migrations often drop tables without recreating dependent indexes or seed data, making rollback testing impossible. We need reversible migrations and automated smoke tests that exercise both directions.
- **High – Constraint drift**: Sequelize model definitions diverge from migration constraints (different defaults, nullable fields). This misalignment triggers runtime validation errors and data corruption risks.
- **Medium – Data quality monitoring**: There is no automated integrity checking (unique index audits, referential sweeps). Stale or orphaned records accumulate undetected.
- **Medium – Backup verification**: Backups are configured but restorations are not tested. Without periodic disaster-recovery drills we risk undetected corruption.
- **Low – Schema evolution testing**: No CI job applies migrations against production-like data volumes. Introduce migration rehearsal pipelines with anonymised datasets to catch performance regressions.
- **Low – Association cascades undefined**: Key joins declared in `models/index.js` (e.g., marketplace moderation actions, rental agreements) omit `onDelete` behaviour. Without explicit cascades, clean-up scripts fail silently and leave orphaned records.

## Integration
- **High – Service coupling**: API responses directly expose database schemas with minimal translation. Any schema change risks breaking clients. Introduce versioned views or service-layer DTOs to decouple release cadence.
- **Medium – Analytics pipeline gaps**: There are no CDC feeds or nightly exports to the marketing warehouse (Redshift/BigQuery). Without integration, marketing cannot monitor 1.50 KPIs.
- **Medium – Third-party reconciliation**: Payment reconciliation still relies on manual CSV uploads. Automating ingestion with idempotent upserts and matching logic is essential for the escrow enhancements.
- **Medium – Search indexing**: Database triggers or change streams to feed ElasticSearch are missing. Index rebuilds are manual, leading to stale search results.
- **Low – Data science interfaces**: Data scientists request SQL-safe read replicas. We lack documented processes to provision read-only access or masks for sensitive fields.

## Security
- **High – PII protection missing**: Sensitive fields (addresses, phone numbers, payout details) are stored in plaintext. We must implement field-level encryption, tokenisation, or Transparent Data Encryption before expanding to new regions.
- **High – Default credentials shipped**: The bootstrap script in `backend-nodejs/sql/install.sql` creates a `fixnado_user` with password `change_me`, encouraging predictable credentials across environments. Rotate immediately and require per-environment secrets managed outside of source control.
- **High – Access controls weak**: Database users are overprivileged, with shared credentials across services. Enforce least-privilege roles, rotate passwords, and adopt IAM-authenticated connections where possible.
- **Medium – Audit logging**: There is no centralised audit log for admin operations. Enable database auditing (e.g., Postgres `pgaudit`) and ensure logs are exported to SIEM.
- **Medium – Backup retention**: Documentation lacks defined RPO/RTO targets. Establish automated backups with retention policies and cross-region replication.
- **Low – Encryption in transit**: Internal services connect over plaintext within the VPC. Enable TLS for database connections and ensure certificates rotate automatically.

## Alignment
- **High – Roadmap dependencies**: Compliance modules require evidence blob storage (S3/R2) linked via foreign keys. Schema work has not begun, delaying feature development.
- **Medium – Scalability targets**: Product expects 5x growth; we have not evaluated partitioning, sharding, or read-replica strategies. Capacity planning must be part of the 1.50 scope.
- **Medium – Regulatory commitments**: EU data residency requires segregated schemas or clusters per region. Current design assumes a single global database.
- **Low – Cross-platform parity**: Backend schema changes are not communicated to mobile/web teams. Introduce release notes and contract tests to maintain alignment.
- **Low – Operational readiness**: Runbooks and on-call documentation do not cover multi-region failover or data corruption procedures. Update before launch.
