# Task 1.3 — CI/CD Pipeline Security & Rollback Enablement

## Overview
Task 1.3 extends the Version 1.00 mobilisation milestone by wiring production-grade CI/CD governance around the backend, React w
eb, and Flutter artefacts. The delivery enforces automated linting, coverage thresholds, security scanning, configuration parity,
and rollback playbooks so that every merge request demonstrates production readiness before promotion. The changes align with the
 mobilisation RACI (Task 1.1) and infrastructure upgrades (Task 1.2) by validating Secrets Manager feature toggles, staging/prod
uction parity, and the SLA-driven issue intake automation.

## Delivered Enhancements
1. **GitHub Actions Workflow — `CI Quality Gates`**
   - Adds `.github/workflows/ci-quality-gates.yml` with dedicated jobs for backend, frontend, Flutter, governance automation, an
d security scanning.
   - Each quality job installs dependencies via `npm ci`/`flutter pub get`, runs linting, and executes tests with explicit covera
ge thresholds (backend: 75/75/80/48, frontend: 80/80/85/50) to prevent regressions in telemetry-critical modules.
   - Uploads LCOV artefacts for audit trail consumption by QA, compliance, and analytics teams.

2. **Coverage & Test Gate Configuration**
   - Backend (`backend-nodejs/vitest.config.js`) now scopes coverage to booking, finance, toggle, and zone services plus route/m
iddleware layers, enforcing minimum lines/statements coverage of 75% and 80% function coverage to protect orchestration flows.
   - Frontend (`frontend-reactjs/vitest.config.js`) enforces coverage over ThemeProvider, telemetry utilities, and theme tokens,
 ensuring instrumentation cannot regress without detection.
   - Both packages depend on `@vitest/coverage-v8@^2.1.4` and expose coverage thresholds through `npm test` so local runs mirror
 CI behaviour.

3. **Security & Configuration Scans**
   - Security job runs `npm audit --omit=dev --audit-level=high` for backend and frontend, followed by an Aqua Trivy file-system
 scan that fails on High/Critical vulnerabilities to enforce dependency hygiene.
   - Governance job executes `scripts/environment-parity.mjs` to halt drift between staging and production tfvars/toggle manifes
 ts, then runs `scripts/issue-intake.mjs` and fails the build if Markdown trackers diverge from source payloads.

4. **Flutter Automation Parity**
   - Flutter job provisions the stable toolchain, caches dependencies, runs `flutter analyze`, executes widget tests with coverag
 e, and publishes `coverage/lcov.info`. This ensures mobile delivery enforces the same regression contracts as web/backend.

5. **Operational Rollback Playbook**
   - Authored `docs/ops/ci-rollback-playbook.md` mapping failure signals to recovery steps for backend, React, Flutter, and gover
nance artefacts. It prescribes ArgoCD rollbacks, Vercel/AppCenter restores, feature toggle resets, and evidence capture for progr
amme trackers.

## Evidence & Artefacts
- Workflow: `.github/workflows/ci-quality-gates.yml`
- Coverage config and scripts: `backend-nodejs/vitest.config.js`, `frontend-reactjs/vitest.config.js`, `backend-nodejs/package.j
son`, `frontend-reactjs/package.json`
- Rollback Playbook: `docs/ops/ci-rollback-playbook.md`
- Test executions (local):
  - Backend: `npm test` (coverage 79.58% statements, 85.41% functions).
  - Frontend: `npm test` (coverage 85.32% statements, 91.66% functions).
  - Flutter: `flutter test --coverage` (documented in workflow; local CLI unavailable in container — see final report).

## Next Actions
- Raise backend branch coverage threshold to 55 and frontend branch coverage to 60 after additional suites land in Task 6.2 exte
nsions.
- Integrate Playwright + axe-core suites into the CI Quality Gates workflow once DT5 automation artefacts migrate from the desk
check backlog.
- Add Slack notifications for governance and security job failures to alert Design Ops, QA, and Compliance in real-time.

## Owners & Approvals
- **Engineering Owner:** DevOps Lead / Backend Tech Lead
- **QA Owner:** QA Lead (cross-stack)
- **Compliance Reviewer:** Programme Manager (ensures SLA + rollback documentation stored in trackers)
- **Design Ops Reviewer:** Confirms telemetry and issue intake governance alignment per RACI.
