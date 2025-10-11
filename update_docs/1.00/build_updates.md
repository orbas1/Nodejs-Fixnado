# Build Updates — Version 1.00

## 2025-10-11 — Issue Intake Automation & Tracker Regeneration
- Added `scripts/issue-intake.mjs`, a Node-based CLI that validates structured payloads inside `update_docs/1.00/pre-update_evaluations/issue_report.md` and regenerates `issue_list.md` + `fix_suggestions.md` with computed SLA deadlines, ownership metadata, and design references.
- Documented run instructions (`node scripts/issue-intake.mjs`) and embedded automation hook into the QA test plan so CI can block inconsistent issue payloads before merge.
- Seeded issue artefacts with four high/critical findings from backend and frontend evaluations, ensuring the build pipeline exposes blockers to programme dashboards without manual transcription.

## 2025-10-13 — Infrastructure Bootstrap & Parity Automation
- Added `backend-nodejs/scripts/bootstrap-postgis.mjs` to create PostGIS, topology, and UUID extensions during deploys, preventing drift between Terraform provisioning and runtime requirements.
- Published `scripts/environment-parity.mjs` to compare staging/production tfvars plus feature toggle manifests; CI can run the script to halt promotions when configuration keys or rollout thresholds diverge.

## 2025-10-14 — CI Quality Gates & Rollback Playbook
- Added `.github/workflows/ci-quality-gates.yml` with backend/frontend/Flutter quality jobs, governance automation, and security scans (npm audit + Trivy) that block merges without coverage thresholds, linting, parity validation, and regenerated issue trackers.
- Tuned Vitest configs (`backend-nodejs/vitest.config.js`, `frontend-reactjs/vitest.config.js`) to scope coverage to mission-critical modules and enforce minimum statements/lines/functions coverage; package scripts now surface the same coverage gates locally via `npm test`.
- Published `docs/ops/ci-rollback-playbook.md` guiding ArgoCD, Vercel, AppCenter, and toggle rollbacks plus evidence capture, aligning with mobilisation RACI and compliance controls.
