# Database Evaluation – Version 1.50

## Functionality
- Schema coverage mirrors current Sequelize models but omits several domain concepts showcased elsewhere (no tables for notifications, analytics, scheduling, or workflow automation). Marketplace and live feed content are read-only; there are no triggers or stored procedures to maintain aggregates.
- Monetary fields (`price`, `totalAmount`, `pricePerDay`, `purchasePrice`) use generic `DECIMAL` without precision/scale definitions, creating inconsistent rounding behavior between MySQL defaults and application expectations.
- Multi-tenancy and regionalization are not modeled. Service zones store raw GeoJSON blobs without spatial indexes or validation, and there is no link to compliance artifacts or SLA documents required for enterprise clients.

## Usability
- Database bootstrap relies on a manual `install.sql` script that only provisions the schema and user. There are no migrations or rollback mechanisms, which complicates reproducing environments and makes schema drift likely.
- Naming conventions mix camelCase columns (because of Sequelize’s defaults) with underscored table names via `define.underscored: true`, leading to confusion when debugging directly in MySQL.
- Lack of seed data means QA cannot quickly populate realistic scenarios. Even basic lookup tables (e.g., service categories, dispute reasons) are absent, so testers must craft raw inserts.

## Errors & Data Integrity
- Foreign keys are not enforced at the database level. Models declare `userId`, `serviceId`, etc., but no `references`/`onDelete` constraints are specified, so orphaned rows and referential drift are inevitable.
- There is no unique constraint on combinations that should be unique (e.g., a company should not have duplicate service zones with the same name). Similarly, disputes do not enforce uniqueness on `escrowId` + `openedBy` to prevent duplicates.
- Soft deletes are not implemented. Accidental deletes permanently remove records without audit trails, complicating recovery from operator error.

## Integration
- Database config defaults to a single MySQL instance with static credentials and no SSL configuration. Integrating with managed databases (AWS RDS, Cloud SQL) will require manual adjustments and does not account for read replicas or failover.
- There is no migration history table or versioning metadata for the schema, so integrating with CI/CD pipelines or IaC tools is blocked. Automated tests cannot rely on a deterministic schema state.
- Data access is tightly coupled to Sequelize models without repository abstractions, hindering integration with analytics platforms or data warehousing (no CDC or event sourcing in place).

## Security
- Credentials in `install.sql` (`fixnado_user` / `change_me`) and `config/index.js` encourage insecure defaults. There is no enforcement of password rotation or least privilege (global `GRANT ALL`).
- No encryption at rest/in-transit guidance: PII fields (address, contactEmail) are stored as plain text without column-level encryption or hashing. There are no views to limit sensitive data exposure to support staff.
- Audit logging is nonexistent. Important actions (order funding, dispute creation) leave no traceable metadata such as `createdBy`, `updatedBy`, or IP address columns.

## Alignment
- The data model does not match the product storylines. Escrow lacks lifecycle timestamps beyond `fundedAt`/`releasedAt`, yet the UI advertises rich escrow tracking. Enterprise modules (Operational Blueprint, Enterprise Stack) have no underlying tables to power dashboards.
- Mobile app toggles for 2FA map to boolean columns, but there is no storage for secrets, verification timestamps, or recovery codes, so alignment between UX promises and persisted data is missing.
- Absence of relational links between posts, services, and marketplace items prevents cross-platform discovery features promised in marketing copy (e.g., linking a live feed request to service providers in the same zone).
