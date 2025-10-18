# Version 1.00 Milestones

## Milestone 1 – Harden Access & Stabilise Platform Core (Covers Tasks 1–2) — 0%
- **Objective:** Remove critical security holes, restore deterministic boot behaviour, and make the database safe for further feature work.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L4-L135】
- **Included Tasks & Subtasks:**
  - Task 1 Subtasks 1–5 (auth hardening, router cleanup, telemetry endpoints, governance doc).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L4-L74】
  - Task 2 Subtasks 1–5 (boot sequencing, readiness metrics, transactional migrations, retention policies, deterministic seeds).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L22-L58】
- **Entry Criteria:** Security review sign-off on remediation plan, sandbox environments provisioned, decision log seeded.【F:update_template/new_feature_brief.md†L1-L70】
- **Exit Criteria:**
  - JWT/CORS/Helmet/rate limiting issues closed with automated tests and documentation updates.
  - Telemetry ingestion operational with sample events from web/mobile clients.
  - Readiness/health endpoints export structured metrics consumable by monitoring stack.
  - Finance/communications migrations refactored with passing dry runs and deterministic QA seeds published.
  - Governance doc and retention guidelines reviewed by security/compliance leads.
- **Dependencies:** Access to staging database snapshots, security reviewers, and infrastructure logging endpoints.

## Milestone 2 – Governance, Dependencies & Tooling Enablement (Covers Task 3) — 0%
- **Objective:** Ensure every codebase builds reliably in CI/CD with documented prerequisites, audits, and license compliance so feature squads can iterate safely.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L47-L134】
- **Included Tasks & Subtasks:** Task 3 Subtasks 1–5 (manifest repair, runtime enforcement, bundle rationalisation, Flutter locks, license/audit automation).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L60-L109】
- **Entry Criteria:** Milestone 1 exit, CI runners available, draft ADR template accepted by architecture board.
- **Exit Criteria:**
  - All manifests/lockfiles validated; CI failing on drift, outdated runtimes, or audit issues.
  - Bundle analysis reports stored with before/after baselines for MapLibre stack.
  - Mobile CI smoke tests green with documented biometric/native prerequisites.
  - License scanning and load-test scripts wired into pull-request workflows.
  - Dependency governance README and change approval workflow published.
- **Dependencies:** GitHub Actions/CI access, security audit tooling, mobile build agents.

## Milestone 3 – Experience Delivery Across Web & Mobile (Covers Tasks 4–5) — 0%
- **Objective:** Implement the enterprise-grade UX, dashboards, timeline/community upgrades, and Flutter parity required for production launch.【F:update_template/new_feature_brief.md†L25-L210】【F:update_template/features_to_add.md†L32-L230】
- **Included Tasks & Subtasks:**
  - Task 4 Subtasks 1–6 (session overhaul, routing/suspense refactor, timeline/community screens, learner dashboard suite, instructor/merchant dashboards, admin/compliance dashboards with legal/policy/docs updates).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L96-L114】
  - Task 5 Subtasks 1–5 (Flutter auth, bootstrap resilience, diagnostics, API client robustness, testing/device matrix/environment switching).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L116-L145】
- **Entry Criteria:** Milestones 1–2 complete, shared design tokens approved, seeded data available, telemetry endpoints stable.
- **Exit Criteria:**
  - Web app delivers timeline/community/chat/commerce screens plus discrete learner, instructor/merchant, and admin/compliance dashboards with ads, moderation, analytics instrumentation, finance controls, and support tooling.
  - UX polish verified (accessibility pass, localisation fallbacks, simplified nomenclature) with legal/policy pages, knowledge base articles, and documentation refresh published.
  - Flutter app supports credentialed auth, stable bootstrap, telemetry uploads, parity screens, and environment picker.
  - Integration/golden tests for Flutter and end-to-end tests for learner/instructor/admin dashboard journeys, storefront flows, and critical web experiences green in CI.
  - Starter data documentation and changelog entries updated to reflect dashboard/page rollouts and QA evidence packages.
- **Dependencies:** Chatwoot credentials, analytics platform access, Firebase/App Store/Play Console configurations, design reviews.

## Milestone 4 – Observability, QA & Launch Certification (Covers Task 6) — 0%
- **Objective:** Validate the entire release through observability, testing, documentation, and rehearsed deployment operations culminating in the end-of-update report.【F:update_template/features_to_add.md†L210-L390】
- **Included Tasks & Subtasks:** Task 6 Subtasks 1–5 (observability stack, automated suites, manual QA, documentation/runbooks, release rehearsals and reporting).【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L147-L188】
- **Entry Criteria:** Milestones 1–3 complete, staging environments refreshed with final builds and seeded data.
- **Exit Criteria:**
  - Observability dashboards live with alert routing, synthetic probes, and telemetry correlation IDs verified across clients.
  - Automated + manual test evidence stored in update_tests with traceability to requirements.
  - Legal docs, knowledge base, onboarding guides, runbooks, and rollback playbooks published with approvals.
  - Blue/green and rollback rehearsals executed with war room logs and operator sign-offs.
  - End-of-update report summarises readiness metrics, residual risks, and go-live recommendation.
- **Dependencies:** Monitoring stack (Prometheus/OTel, dashboards), QA resources, legal/compliance reviewers, operations/on-call roster.
