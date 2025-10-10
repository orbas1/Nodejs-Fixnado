# Database Evaluation – Version 1.00

## Functionality
- The initial migration provisions core marketplace entities (users, companies, services, orders, escrow, disputes) but omits critical support tables for audit logs, notifications, payment instruments, and identity verification, leaving key product flows unsupported (`src/database/migrations/20240301000000-init-schema.js`).
- Enumerations such as `Order.status` and `Escrow.status` cover only happy-path states and lack transitions for refunds, partial releases, or cancellations, limiting operational flexibility.
- There is no mechanism for soft deletes or archival, so deleting a user cascades through orders/escrows and erases financial history needed for compliance.

## Usability
- Physical table names use PascalCase while Sequelize models emit camelCase JSON, creating friction for BI teams who expect snake_case or consistent naming conventions (`20240301000000-init-schema.js`).
- Mandatory foreign keys (e.g., `Company.legal_structure`) default to generic values, forcing API layers to fill in placeholder data rather than capturing realistic onboarding input.
- Lack of seed scripts for reference data (service categories, dispute reasons, regions) makes local setup tedious and error-prone.

## Errors
- UUID defaults rely on `Sequelize.literal('(UUID())')`, which renders as `(UUID())` and is invalid syntax for MySQL; migrations will fail unless manually corrected, halting deployments (`20240301000000-init-schema.js`).
- ENUM columns store string values but no guard prevents schema drift when business logic introduces new statuses; failing to sync code and DB enums will crash transactions.
- No index creation accompanies the tables, so high-traffic queries (search by `Service.title`, `MarketplaceItem.location`) will degrade quickly, and MySQL will fall back to full table scans.

## Integration
- There is no versioning or migration tooling specified beyond raw functions; without a Sequelize CLI configuration, integrating with CI/CD or running migrations in staging requires custom scripting.
- Schema does not expose views or materialized aggregates that analytics dashboards can consume, forcing every integration to rebuild metrics from scratch.
- Absence of foreign key constraints to external systems (payments, identity providers) signals that data reconciliation across services has not been designed.

## Security
- Personally identifiable information (PII) such as addresses and contact emails are stored in plain text with no column-level encryption or masking strategy.
- Two-factor preference flags (`two_factor_email`, `two_factor_app`) are boolean toggles only; there is no table for OTP secrets or audit trails, making the feature easy to spoof.
- Cascading deletes on orders and disputes increase the blast radius of compromised admin actions—an attacker with delete access could wipe financial records without recovery tooling.

## Alignment
- Schema shape does not align with front-end expectations around live feed content (no table for feed activities or media), so UI components must rely on mock data.
- Mobile app references profiles, search, and feed personalization, yet the database offers no tables for saved searches, device tokens, or preferences.
- Without migration history or rollback strategies, the database layer fails enterprise alignment requirements for change management and auditability.
