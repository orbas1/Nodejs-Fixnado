# Controller Changes — 2025-02-09

- `serviceController.purchaseService` now executes within a Sequelize transaction, rolling back order creation when escrow persistence fails and returning consistent 500 responses for operational chaos drills.
- Finder queries are transaction-scoped to prevent dirty reads during concurrent purchases and align with new Vitest rollback assertions.
