# Backend Change Log — 2025-02-09 Automation Uplift

- Introduced sqlite-aware Sequelize configuration so Vitest suites run deterministically without external services (`src/config/database.js`).
- Hardened service purchase flow with transactional order + escrow creation and rollback semantics, preventing orphaned orders during chaos injection (`src/controllers/serviceController.js`).
- Added high-fidelity API regression suites for service creation/purchase plus Zod-based contract validation to guard consumer payloads (`tests/serviceRoutes.test.js`, `tests/services.contract.test.js`).
