# Version 1.00 Update Change Log

## 2025-01-28 — Design Foundations Consolidation
- Delivered cross-platform token alignment covering colours, typography, and spacing with canonical `fx.*` namespace and accessibility mitigation guidance. See `ui-ux_updates/design_foundations_alignment.md` for full inventory and adoption plan.
- Automated JSON, SCSS, and Flutter token exports to ensure engineering parity; linting rules prevent legacy token usage in CI.
- Captured cross-discipline review outcomes (Product, Frontend, Flutter, QA, Marketing, Compliance) and scheduled Sprint 3/4 adoption checkpoints.

## 2025-01-29 — Core Page Blueprint Recomposition
- Implemented recomposed home, admin dashboard, provider profile, and services marketing layouts in the React codebase (`frontend-reactjs/src/pages`). Navigation updated to persona-led clusters with breadcrumb strategy and compliance overlays.
- Introduced shared blueprint primitives (`components/blueprints/PageHeader.jsx`, `BlueprintSection.jsx`) to enforce grid, accessibility, and instrumentation patterns across pages.
- Published `ui-ux_updates/core_page_blueprints.md` documenting IA decisions, compliance guardrails, localisation rollout status, and next actions for motion/Storybook coverage.

## 2025-01-30 — Component & Widget Catalogue Expansion
- Delivered production-grade UI primitives (buttons, cards, segmented control, status pills, skeletons, text inputs) and analytics widgets (trend, comparison, gauge, metric tiles) under `frontend-reactjs/src/components/ui` and `/widgets`, powered by new tokenised CSS and `framer-motion`/`recharts` integrations.
- Upgraded `frontend-reactjs/src/pages/AdminDashboard.jsx` to exercise the catalogue with live datasets, telemetry IDs, compliance cards, and security widgets aligned to governance requirements.
- Documented audit outcomes, regression checklist, and QA guidance in `ui-ux_updates/component_catalogue_expansion.md`, with tracker updates across `Design_update_progress_tracker.md` and `update_progress_tracker.md`.

## 2025-01-31 — Theme & Personalisation Enablement
- Shipped Theme Studio (`frontend-reactjs/src/pages/ThemeStudio.jsx`) with ThemeProvider context, persistent preferences, density/contrast controls, and marketing module previews wired to telemetry hooks.
- Extended global tokens (`frontend-reactjs/src/styles.css`) with theme-specific gradients, accessibility overrides, and marketing surface variables; documented palettes and rollout plan in `ui-ux_updates/theme_personalisation_toolkit.md`.
- Updated programme trackers to mark DT4/DM3 complete, including telemetry guidance, validation schedule, and marketing/legal alignment checkpoints.

## 2025-02-01 — Validation, QA, and Handoff Completion
- Authored `ui-ux_updates/design_validation_and_handoff.md` consolidating accessibility/compliance/security checklists, QA cadence, and backlog seeds covering web + mobile artefacts and referencing drawings in Version 1.00 update directories.
- Added `PreferenceChangeAnnouncer` aria-live utility and deterministic QA selectors to Theme Studio (`frontend-reactjs/src/pages/ThemeStudio.jsx`, `components/theme`, `components/accessibility`) to support assistive technologies and automated regression suites.
- Published version-controlled handoff assets (`docs/design/handoff/fx-theme-preferences.json`, `ui-qa-scenarios.csv`) enabling engineering and QA teams to validate telemetry payloads, theme tokens, and scripted scenarios during Sprint 4 desk checks.

## 2025-02-02 — Telemetry Ingestion & Analytics Enablement
- Implemented production-ready telemetry ingestion API (`backend-nodejs/src/routes/telemetryRoutes.js`, `controllers/telemetryController.js`, `services/telemetryService.js`) persisting Theme Studio preference changes with hashed IPs, correlation IDs, and governance metadata.
- Extended ThemeProvider instrumentation (`frontend-reactjs/src/providers/ThemeProvider.jsx`, `utils/telemetry.js`) to enrich beacons with tenant, role, locale, and user agent context plus fetch fallbacks, ensuring zero-loss delivery during beacon failures.
- Published telemetry dashboard runbook (`docs/telemetry/ui-preference-dashboard.md`) and updated handoff assets to document the schema and QA scenarios, unblocking data engineering for Looker dashboard build.

## 2025-02-03 — Telemetry Dashboard Operationalisation
- Delivered admin telemetry console (`frontend-reactjs/src/pages/TelemetryDashboard.jsx`, `components/telemetry/*`, `hooks/useTelemetrySummary.js`) featuring range controls, KPI cards, trend visualisation with CSV export, and adoption breakdown panels aligned to dashboard drawings.
- Surfaced telemetry entry point from the admin dashboard header and documentation updates (`docs/telemetry/ui-preference-dashboard.md`, `ui-ux_updates/telemetry_dashboard_enablement.md`) detailing operations workflows, QA selectors, and sample dataset usage.
- Updated programme trackers and QA assets (`docs/design/handoff/ui-qa-scenarios.csv`, `update_progress_tracker.md`, `Design_update_progress_tracker.md`) to reflect telemetry freshness SLAs, automation coverage, and next-step focus on Chromatic baselines.

## 2025-02-04 — Telemetry Alerting & Analytics Guardrails
- Activated production telemetry alerting job (`backend-nodejs/src/jobs/telemetryAlertJob.js`) that polls telemetry aggregates, snapshots metrics, and posts Slack notifications when freshness or emo adoption thresholds breach.
- Persisted Looker-friendly snapshots via `UiPreferenceTelemetrySnapshot` model, exposing rolling-window totals, theme share, and payload JSON for downstream BI ingestion.
- Added configuration knobs (`TELEMETRY_*` environment variables) and server bootstrap wiring to run the job on startup, ensuring alerting is environment-aware and repeat-suppressed.
- Expanded runbooks, QA scenarios, and trackers (`docs/telemetry/ui-preference-dashboard.md`, `ui-ux_updates/telemetry_alerting_enablement.md`, `Design_update_task_list.md`, `update_progress_tracker.md`) to capture alert governance, validation steps, and new milestone completion.

## 2025-02-05 — Telemetry Snapshot Distribution & Looker Enablement
- Shipped `/api/telemetry/ui-preferences/snapshots` with cursor-based pagination, range filters, and governed payload formatting so analytics tooling can ingest telemetry summaries without direct database access.
- Refreshed telemetry runbook (`docs/telemetry/ui-preference-dashboard.md`) and QA scenarios (`docs/design/handoff/ui-qa-scenarios.csv`) with ingestion guidance, cursor rehearsal, and scheduling notes ahead of the 12 Feb analytics review.
- Updated programme trackers, design plan, and change logs to mark analytics distribution readiness and shift focus toward Chromatic/axe automation plus tenant segmentation follow-up.

## 2025-02-06 — Telemetry Snapshot Data Quality Diagnostics
- Enhanced `/api/telemetry/ui-preferences/snapshots` with governed filtering (`leadingTheme`, stale minute bounds) and optional aggregate statistics so data engineering can interrogate coverage and freshness without ad-hoc SQL.
- Added stats payload (`tenants`, `rangeKeys`, `leadingThemes`, `freshness`, and share aggregates) alongside applied filter echoing to improve Looker pipeline observability and audit logging.
- Updated telemetry runbook and QA scenarios to document the diagnostics workflow, ensuring analytics and ops rehearsals validate stats responses and threshold overrides prior to the 12 Feb rehearsal.

## 2025-02-07 — Architecture Mobilisation & Release Governance
- Provisioned PostGIS infrastructure and feature toggle governance: Terraform now manages a PostGIS instance, Secrets Manager entries, and rollout overrides; the API verifies PostGIS readiness at startup and seeds toggle metadata with RBAC-aware update endpoints.
- Extended CI/CD coverage and rollback tooling: Added backend, frontend, Flutter, and issue-intake GitHub Actions workflows enforcing lint/tests/security scans with artefact upload, and published automated rollback checklists plus PostGIS health script.
- Delivered release governance UX + compliance artefacts: Admin dashboard exposes feature rollout panel, Flutter app surfaces beta flag banner, issue intake automation populates SLA-aligned tracker JSON, and compliance docs (DPIA, RBAC minutes, security baseline) refreshed for regulator readiness.

## 2025-02-08 — QA Governance Expansion
- Updated `test_plan.md` to capture admin feature toggle panel verification, RBAC + webhook coverage, and cross-platform automation strategy (Vitest, Playwright, Flutter widget tests) so CI suites evidence rollout governance end-to-end.
- Refreshed `update_task_list.md` and `update_progress_tracker.md` to reflect Subtask 6.1 maturity, raising QA readiness metrics and capturing next actions for backend toggle integration tests.
- Captured the documentation refresh in the Version 1.00 change log and index for traceability.

## 2025-02-09 — Automation Suite Expansion
- Delivered transactional Vitest coverage for service purchase + escrow rollback flows with contract validation to guard API schema drift; suites live under `backend-nodejs/tests` with sqlite-backed isolation and chaos assertions.
- Shipped React ThemeProvider regression harness (`frontend-reactjs/src/providers/__tests__/ThemeProvider.test.jsx`) validating telemetry beacons, DOM dataset updates, and dataLayer instrumentation while persisting preferences; configured Vitest/Testing Library + jsdom in CI.
- Added Flutter widget automation for the live feed banner (`flutter-phoneapp/test/widgets/live_feed_list_test.dart`) alongside production widget upgrades (empty/loading states, priority badges), closing Subtask 6.2 traceability and updating trackers, test plan, and progress metrics.
