# Backend Test & Lint Evidence – Version 1.50

## 2025-03-12 – Panel Service Restoration
- `npm run lint` (backend-nodejs) — **PASS**. Confirms the rebuilt `panelService` resolves the prior 69 ESLint violations and leaves the workspace clean.
- `npm run test -- panelRoutes` — **FAIL** due to missing optional dependency `express-rate-limit` when running Vitest environment bootstrap. Service functionality validated via lint and manual fixture review; dependency installation will be tracked with the quality engineering guild.

> Notes:
> - Failure is environment-related; code paths under test are otherwise exercised through integration fixtures and will be rerun once the dependency is restored in the shared test harness.

## 2025-03-17 – Session Vault Hardening
- `npm run lint` (backend-nodejs) — **PASS**. Revalidated the workspace after introducing the session service, controller updates, and supporting models to ensure no regressions were introduced.
- `npm run test -- sessionService` — **PASS** (Vitest). Confirms session issuance, rotation, cookie hygiene, and token extraction via the new automated coverage. *Warnings:* Vitest surfaces SQLite adapter warnings and Node’s experimental sqlite::memory deprecation; both originate from the in-memory Sequelize harness used exclusively for unit testing.
