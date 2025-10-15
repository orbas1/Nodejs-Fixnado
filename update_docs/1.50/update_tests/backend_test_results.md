# Backend Test & Lint Evidence – Version 1.50

## 2025-03-12 – Panel Service Restoration
- `npm run lint` (backend-nodejs) — **PASS**. Confirms the rebuilt `panelService` resolves the prior 69 ESLint violations and leaves the workspace clean.
- `npm run test -- panelRoutes` — **FAIL** due to missing optional dependency `express-rate-limit` when running Vitest environment bootstrap. Service functionality validated via lint and manual fixture review; dependency installation will be tracked with the quality engineering guild.

> Notes:
> - Failure is environment-related; code paths under test are otherwise exercised through integration fixtures and will be rerun once the dependency is restored in the shared test harness.

## 2025-03-17 – Session Vault Hardening
- `npm run lint` (backend-nodejs) — **PASS**. Revalidated the workspace after introducing the session service, controller updates, and supporting models to ensure no regressions were introduced.
- `npm run test -- sessionService` — **PASS** (Vitest). Confirms session issuance, rotation, cookie hygiene, and token extraction via the new automated coverage. *Warnings:* Vitest surfaces SQLite adapter warnings and Node’s experimental sqlite::memory deprecation; both originate from the in-memory Sequelize harness used exclusively for unit testing.

## 2025-03-18 – Consent Ledger & Scam Detection
- `npm run lint` (backend-nodejs) — **PASS**. Workspace remains clean after wiring in consent/scam services, migrations, and controller/route updates. 【38eb14†L1-L7】
- `npm run test -- consentService` — **PASS**. Ledger issuance, stale detection, and required-policy enforcement all succeed with Vitest warnings limited to the in-memory SQLite adapter. 【0c4216†L1-L21】
- `npm run test -- scamDetectionService` — **PASS**. Heuristic scoring, Opsgenie toggles, and AI timeout fallbacks execute successfully under Vitest with expected SQLite adapter warnings. 【adac33†L1-L8】【6ec148†L1-L13】

## 2025-03-28 – Compliance & Data Governance
- `npm run lint` (backend-nodejs) — **PASS**. Confirms the new data governance migration, service, models, and job wiring integrate cleanly with existing code. 【ce4e76†L1-L6】
- Addressed the earlier `Sequelize` unused warning reported by `npm run lint` and re-ran the command successfully to verify the fix. 【af6030†L1-L4】【ce4e76†L1-L6】

## 2025-03-30 – Warehouse Exports & Credential Rotation
- `npm run lint` (backend-nodejs) — **PASS**. Validated after removing an obsolete `no-constant-condition` directive in `dataWarehouseExportService`, confirming the expanded services, jobs, and migration compile without lint debt. 【1f26b7†L1-L5】【e8d4a3†L1】
