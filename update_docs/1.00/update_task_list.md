# Update Task List — Version 1.00

## Development & QA Task Portfolio

### Task 1 — Mobilise Architecture, Compliance & Issue Intake (12% complete)
Establish the cross-squad delivery framework, baseline compliance, and open the unified defect pipeline before feature build accelerates.

#### Subtasks
1.1 Build master RACI, roadmap, and dependency matrix aligning squads to feature pillars and compliance checkpoints.
1.2 Provision shared infrastructure upgrades (PostGIS, secrets vault, staging toggles) and validate environment parity.
1.3 Extend CI/CD pipelines with security scanning, automated test gates, and rollback playbooks for backend, React, and Flutter artefacts.
1.4 Formalise issue intake workflow linking `issue_report.md`, `issue_list.md`, and `fix_suggestions.md` to tracker automation with severity SLAs.
1.5 Refresh DPIA, RBAC review minutes, and security baselines to satisfy regulator expectations prior to development sprints.

*2025-10-11 update:* Subtask **1.4** is now production-ready. `scripts/issue-intake.mjs` validates structured payloads in `issue_report.md`, regenerates `issue_list.md`/`fix_suggestions.md` with SLA countdowns, and publishes ownership metadata for finance, security, and design ops triage. Four critical/high issues sourced from pre-update evaluations seeded the tracker with remediation plans and acceptance criteria.

#### Integration Coverage
- **Backend:** Subtasks 1.2 & 1.3 provision services and pipelines.
- **Front-end:** Subtask 1.3 enforces build/test gates for React deployments.
- **User phone app:** Subtask 1.3 configures Flutter pipelines and device farm hooks.
- **Provider phone app:** Same as User via shared pipeline configuration in Subtask 1.3.
- **Database:** Subtask 1.2 deploys PostGIS extensions and migration scaffolding.
- **API:** Subtask 1.4 ensures defect triage captures contract regressions; Subtask 1.5 documents auth scopes.
- **Logic:** Subtask 1.1 codifies ownership and dependencies for orchestration flows.
- **Design:** Subtask 1.1 aligns design and product representation in governance cadences.

### Task 2 — Deliver Geo-Zonal & Booking Core Services (18% complete)
Implement foundational microservices for zones, bookings, bidding, disputes, and commission logic with automated verification.

#### Subtasks
2.1 Implement zone service CRUD, polygon validation utilities, and analytics snapshot jobs with unit and contract tests.
2.2 Extend booking orchestrator for on-demand vs scheduled flows, multi-serviceman assignments, and SLA timers.
2.3 Build custom job + bidding workflow (creation, revisions, comments) with dispute trigger hooks and audit logging.
2.4 Integrate commission, tax, and multi-currency calculations with booking lifecycle and financial reconciliation.
2.5 Create regression suite covering geo-matching accuracy, booking lifecycle permutations, and failure handling.

#### Integration Coverage
- **Backend:** Subtasks 2.1–2.4 deliver Node services and shared libraries.
- **Front-end:** Subtask 2.5 prepares fixtures for UI teams; Subtask 2.2 exposes states consumed by React wizard.
- **User phone app:** Subtask 2.5 seeds mobile QA scenarios; Subtask 2.3 exposes APIs for Flutter clients.
- **Provider phone app:** Subtask 2.2 surfaces assignment endpoints and status updates for provider app flows.
- **Database:** Subtasks 2.1 & 2.4 add schemas, migrations, and performance indexes.
- **API:** Subtasks 2.1–2.3 define REST contracts with schema validation.
- **Logic:** Subtasks 2.2 & 2.3 orchestrate workflow engines and concurrency rules.
- **Design:** Subtask 2.5 coordinates UX acceptance criteria for booking and bidding states.

### Task 3 — Build Marketplace, Inventory & Monetisation Backbones (10% complete)
Create revenue-generating services, enforce insured seller policies, and prepare ad campaign infrastructure.

#### Subtasks
3.1 Ship inventory ledger with transaction history, low-stock alerts, and reconciliation utilities.
3.2 Implement rental agreement lifecycle (request, approval, pickup, return, settlement) with document capture.
3.3 Enforce insured seller eligibility, compliance document checks, and marketplace moderation workflows.
3.4 Develop Fixnado + Finova campaign manager services (targeting, budgeting, pacing, billing reconciliation).
3.5 Map monetisation telemetry to analytics warehouse and configure fraud monitoring signals.

#### Integration Coverage
- **Backend:** Subtasks 3.1–3.4 extend services and background jobs.
- **Front-end:** Subtasks 3.2 & 3.4 expose payloads for storefront, ads, and provider dashboards.
- **User phone app:** Subtask 3.2 ensures mobile rental flows; Subtask 3.5 feeds push notification triggers.
- **Provider phone app:** Subtasks 3.1 & 3.2 deliver inventory and rental management APIs consumed by provider Flutter app.
- **Database:** Subtasks 3.1 & 3.4 add ledger tables, indexes, and billing schemas.
- **API:** Subtasks 3.1–3.4 publish REST endpoints with throttling rules.
- **Logic:** Subtask 3.5 tunes fraud heuristics and monetisation business rules.
- **Design:** Subtasks 3.2 & 3.4 coordinate UI specs for marketplace, rental, and ads modules.

### Task 4 — Develop Cross-Channel Experience & Collaboration (15% complete)
Deliver cohesive UX across web and Flutter apps, enabling communications, localisation, and business front management.

#### Subtasks
4.1 Build React explorer, zone overlays, and booking wizard UI integrating new backend contracts.
4.2 Achieve Flutter parity across user, servicemen, provider, and enterprise apps for explorer, booking, and rental flows.
4.3 Integrate chat with AI assist toggles, Agora video/phone sessions, and notification centre across channels.
4.4 Implement business fronts, provider dashboards, and enterprise panels with role-based guardrails.
4.5 Execute accessibility, localisation, and performance audits, feeding findings into defect tracker.

#### Integration Coverage
- **Backend:** Subtasks 4.3 & 4.4 require websocket/session orchestration and panel APIs.
- **Front-end:** Subtasks 4.1 & 4.4 drive React delivery with design QA.
- **User phone app:** Subtasks 4.2 & 4.3 ensure user app parity and communications integration.
- **Provider phone app:** Subtasks 4.2 & 4.4 tailor provider scheduling, dashboards, and notifications.
- **Database:** Subtasks 4.3 & 4.4 persist chat transcripts, panel widgets, and preferences.
- **API:** Subtasks 4.1–4.4 expose GraphQL/REST endpoints for explorer, chat, and dashboards.
- **Logic:** Subtask 4.5 validates orchestration behaviour, caching, and offline handling.
- **Design:** Subtasks 4.1, 4.4 & 4.5 complete visual QA, localisation copy decks, and accessibility sign-off.

### Task 5 — Analytics, Data Governance & Reporting (8% complete)
Extend data pipelines, dashboards, and governance to evidence performance, compliance, and monetisation outcomes.

#### Subtasks
5.1 Finalise unified event schema covering zones, bookings, rentals, disputes, ads, and communications.
5.2 Update ETL/ELT pipelines to ingest new datasets with GDPR-compliant retention and anonymisation.
5.3 Build persona dashboards (admin, provider, servicemen, enterprise) with KPI drill-downs and export tooling.
5.4 Configure alerting for data freshness, SLA breaches, dispute spikes, ad overspend, and compliance expiries.
5.5 Publish metric catalogue, data dictionary, and access control policies aligned to governance standards.

#### Integration Coverage
- **Backend:** Subtasks 5.1 & 5.2 adjust event emitters and ingestion services.
- **Front-end:** Subtask 5.3 surfaces dashboards within React panels.
- **User phone app:** Subtask 5.4 connects push notifications and in-app alerts for SLA events.
- **Provider phone app:** Subtasks 5.3 & 5.4 deliver mobile analytics widgets and alerts.
- **Database:** Subtasks 5.1 & 5.2 manage warehouse schemas and retention policies.
- **API:** Subtasks 5.3 & 5.4 expose analytics endpoints and alert webhooks.
- **Logic:** Subtasks 5.1 & 5.4 encode metric calculations and threshold evaluation.
- **Design:** Subtask 5.3 ensures data visualisation standards and accessibility compliance.

### Task 6 — Quality Assurance, Compliance & Launch Readiness (5% complete)
Converge on testing, documentation, training, and go-live governance to exit with production confidence.

#### Subtasks
6.1 Author master test plan covering functional, integration, performance, security, localisation, and accessibility scopes.
6.2 Expand automation suites (API, UI, Flutter, contract, chaos) tied to Definition of Done for each feature stream.
6.3 Run performance, load, and resilience drills across booking, chat, payments, analytics, and ads workloads.
6.4 Conduct GDPR, insurance/DBS, HMRC, and advertising compliance audits with documented evidence packs.
6.5 Finalise release notes, training curriculum, support playbooks, and hypercare rota with sign-off checkpoints.

#### Integration Coverage
- **Backend:** Subtasks 6.2 & 6.3 execute API/performance tests and resilience drills.
- **Front-end:** Subtasks 6.2 & 6.5 drive UI automation and release note packaging.
- **User phone app:** Subtasks 6.2 & 6.3 schedule device farm runs and performance profiling.
- **Provider phone app:** Subtasks 6.2 & 6.3 replicate on provider app with compliance scenarios.
- **Database:** Subtask 6.3 monitors load; Subtask 6.4 validates retention policies.
- **API:** Subtask 6.2 ensures contract/regression coverage; Subtask 6.5 documents change logs.
- **Logic:** Subtask 6.3 stresses orchestration flows and failover logic.
- **Design:** Subtask 6.1 ensures accessibility, localisation, and content audits tie into QA exit criteria.

*2025-02-08 update:* Subtask **6.1** master test plan now covers feature toggle governance (admin panel + backend service), adds Vitest/Supertest coverage targets, and codifies Flutter widget automation for flag banners to unblock CI reporting.
*2025-02-09 update:* Subtask **6.2** automation suites now execute production Vitest API/contract coverage for service purchase + escrow flows, React ThemeProvider telemetry regression tests, and Flutter widget validation for live feed banners with chaos rollback assertions feeding CI pipelines.

---
These tasks supersede previous high-level placeholders while preserving the Design Task Addendum below for historical traceability.


## Programme Tasks Overview
- Existing functional, backend, infrastructure, and QA tasks remain managed within their respective documents.

## UI/UX Design Task Addendum
| Task | Summary | Owner(s) | Timeframe |
| --- | --- | --- | --- |
| **DT1 — Consolidate Design Foundations** | Audit and unify tokens, typography, spacing, and iconography across app and web artefacts. | Lead Product Designer, Frontend Tech Lead | Weeks 1-2 *(✅ Completed 2025-01-28 — see `ui-ux_updates/design_foundations_alignment.md`)* |
| **DT2 — Recompose Core Page Blueprints** | Update home, dashboard, provider, and marketing layouts with new grids, IA, and compliance cues. | UX Architect, Product Manager | Weeks 3-4 *(✅ Completed 2025-01-29 — see `ui-ux_updates/core_page_blueprints.md`)* |
| **DT3 — Expand Component & Widget Catalogue** | Rationalise component variants, document states, and align with motion guidelines. | UI Designer, Design Systems Engineer | Weeks 3-4 *(✅ Completed 2025-01-30 — see `ui-ux_updates/component_catalogue_expansion.md` and `frontend-reactjs/src/components`)* |
| **DT4 — Theme & Personalisation Enablement** | Deliver theme management tooling, emo preview flows, and marketing module variations. | UI Designer, Marketing Strategist | Week 5 *(✅ Completed 2025-01-31 — see `ui-ux_updates/theme_personalisation_toolkit.md` and `/frontend-reactjs/src/pages/ThemeStudio.jsx`)* |
| **DT5 — Validation, QA, and Handoff** | Execute accessibility/compliance reviews, prepare handoff packages, and support engineering integration. | QA Lead, Design Operations | Week 6 *(✅ Completed 2025-02-01 — see `ui-ux_updates/design_validation_and_handoff.md`, Theme Studio accessibility instrumentation, and `docs/design/handoff` assets)* |
| **DT6 — Telemetry Dashboard Operationalisation** | Launch admin telemetry console with governed metrics, freshness SLAs, and analytics export tooling. | Design Systems Engineer, Data Engineering, Frontend Tech Lead | Week 6 *(✅ Completed 2025-02-03 — see `ui-ux_updates/telemetry_dashboard_enablement.md`, `frontend-reactjs/src/pages/TelemetryDashboard.jsx`, and refreshed runbook assets)* |
| **DT7 — Telemetry Alerting & Looker Snapshots** | Automate freshness/adoption alerting and persist BI-ready telemetry snapshots for analytics pipelines. | Design Systems Engineer, Data Engineering | Week 6 *(✅ Completed 2025-02-04 — see `ui-ux_updates/telemetry_alerting_enablement.md`, `backend-nodejs/src/jobs/telemetryAlertJob.js`, and updated runbook/test assets)* |
| **DT8 — Looker Snapshot Distribution & Alert Rehearsal** | Expose governed snapshot API, refresh runbook/QA guidance, and lock rehearsal plan ahead of analytics review. | Design Systems Engineer, Data Engineering, Design Ops | Week 6 *(✅ Completed 2025-02-05 — see `backend-nodejs/src/routes/telemetryRoutes.js`, `controllers/telemetryController.js`, `services/telemetryService.js`, telemetry runbook updates, and `docs/design/handoff/ui-qa-scenarios.csv`)* |
| **DT9 — Telemetry Snapshot Diagnostics & Data Quality** | Add governed filters, aggregate stats, and rehearsal guidance so analytics can evidence freshness without raw DB access. | Design Systems Engineer, Data Engineering, Analytics Ops | Week 6 *(✅ Completed 2025-02-06 — see enhanced telemetry services/controllers/routes, updated runbook diagnostics section, and QA scenario additions)* |

### Detailed Subtasks Reference
- Refer to `Design_update_task_list.md` for full subtask breakdown (4–8 subtasks per task) and acceptance criteria.

