# Update Task List — Version 1.00

## Development & QA Task Portfolio

### Task 1 — Mobilise Architecture, Compliance & Issue Intake (100% complete)
Establish the cross-squad delivery framework, baseline compliance, and open the unified defect pipeline before feature build accelerates.

#### Subtasks
1.1 Build master RACI, roadmap, and dependency matrix aligning squads to feature pillars and compliance checkpoints.
1.2 Provision shared infrastructure upgrades (PostGIS, secrets vault, staging toggles) and validate environment parity.
1.3 Extend CI/CD pipelines with security scanning, automated test gates, and rollback playbooks for backend, React, and Flutter artefacts.
1.4 Formalise issue intake workflow linking `issue_report.md`, `issue_list.md`, and `fix_suggestions.md` to tracker automation with severity SLAs.
1.5 Refresh DPIA, RBAC review minutes, and security baselines to satisfy regulator expectations prior to development sprints.

*2025-10-11 update:* Subtask **1.4** is now production-ready. `scripts/issue-intake.mjs` validates structured payloads in `issue_report.md`, regenerates `issue_list.md`/`fix_suggestions.md` with SLA countdowns, and publishes ownership metadata for finance, security, and design ops triage. Four critical/high issues sourced from pre-update evaluations seeded the tracker with remediation plans and acceptance criteria.

*2025-10-12 update:* Subtask **1.1** completed with `task1_mobilisation_raci_roadmap.md` capturing the cross-squad RACI, phased roadmap, and dependency/compliance matrix. Governance cadences now reference design drawings, telemetry artefacts, and the automated issue intake workflow to keep mobilisation evidence auditable.

*2025-10-13 update:* Subtask **1.2** delivered PostGIS-backed infrastructure, Secrets Manager feature toggle manifests, admin APIs, and an environment parity audit so staging and production remain configuration-aligned before CI/CD promotions.

*2025-10-14 update:* Subtask **1.3** completed with end-to-end CI/CD hardening — `Build, Test & Scan` workflow now enforces backend/frontend/Flutter lint + test gates, security scanning leverages `gitleaks` and `scripts/security-audit.mjs`, and the `Release Packaging` workflow ships rollback-ready artefacts with manifest + playbook documentation for operations.

*2025-10-15 update:* Subtask **1.5** refreshed compliance evidence with production-ready `docs/compliance/dpia.md`, `rbac_review_minutes.md`, and `security_baseline.md`. Documentation now captures hashed-IP telemetry governance, Secrets Manager TTL enforcement, and JIT RBAC workflows mapped to design drawings (`Screens_Update.md`, `Dashboard Designs.md`), closing regulator prerequisites ahead of feature build.

#### Integration Coverage
- **Backend:** Subtasks 1.2 & 1.3 provision services and pipelines.
- **Front-end:** Subtask 1.3 enforces build/test gates for React deployments.
- **User phone app:** Subtask 1.3 configures Flutter pipelines and device farm hooks.
- **Provider phone app:** Same as User via shared pipeline configuration in Subtask 1.3.
- **Database:** Subtask 1.2 deploys PostGIS extensions and migration scaffolding.
- **API:** Subtask 1.4 ensures defect triage captures contract regressions; Subtask 1.5 documents auth scopes.
- **Logic:** Subtask 1.1 codifies ownership and dependencies for orchestration flows.
- **Design:** Subtask 1.1 aligns design and product representation in governance cadences.

### Task 2 — Deliver Geo-Zonal & Booking Core Services (100% complete)
Implement foundational microservices for zones, bookings, bidding, disputes, and commission logic with automated verification.

#### Subtasks
2.1 Implement zone service CRUD, polygon validation utilities, and analytics snapshot jobs with unit and contract tests.
2.2 Extend booking orchestrator for on-demand vs scheduled flows, multi-serviceman assignments, and SLA timers.
2.3 Build custom job + bidding workflow (creation, revisions, comments) with dispute trigger hooks and audit logging.
2.4 Integrate commission, tax, and multi-currency calculations with booking lifecycle and financial reconciliation.
2.5 Create regression suite covering geo-matching accuracy, booking lifecycle permutations, and failure handling.

**2025-02-10 execution summary:**
- ✅ **2.1** `backend-nodejs/src/routes/zoneRoutes.js`, `controllers/zoneController.js`, `services/zoneService.js`, `models/serviceZone.js`, `models/zoneAnalyticsSnapshot.js`, and `jobs/zoneAnalyticsJob.js` deliver CRUD, GeoJSON validation, centroid/bounding box enrichment, and scheduled analytics snapshots aligned to explorer/admin drawings.
- ✅ **2.2** `backend-nodejs/src/services/bookingService.js`, `controllers/bookingController.js`, `routes/bookingRoutes.js`, and new Sequelize models orchestrate on-demand/scheduled bookings, SLA timers, and multi-serviceman assignments with metadata captured for dashboards and provider apps.
- ✅ **2.3** Booking bids/comments stored via `models/bookingBid.js` and `models/bookingBidComment.js`, with audit logging and dispute triggers surfaced through controller endpoints.
- ✅ **2.4** Finance engine (`services/financeService.js`, `config/index.js`) manages commission/tax/multi-currency conversions plus metadata persisted on bookings for reconciliation.
- ✅ **2.5** Vitest regression suites (`backend-nodejs/tests/zoneRoutes.test.js`, `tests/bookingRoutes.test.js`) verify polygon validity, analytics snapshots, monetary calculations, assignment acceptance, bid lifecycle, and dispute handling.

#### Integration Coverage
- **Backend:** Subtasks 2.1–2.4 deliver Node services and shared libraries.
- **Front-end:** Subtask 2.5 prepares fixtures for UI teams; Subtask 2.2 exposes states consumed by React wizard.
- **User phone app:** Subtask 2.5 seeds mobile QA scenarios; Subtask 2.3 exposes APIs for Flutter clients.
- **Provider phone app:** Subtask 2.2 surfaces assignment endpoints and status updates for provider app flows.
- **Database:** Subtasks 2.1 & 2.4 add schemas, migrations, and performance indexes.
- **API:** Subtasks 2.1–2.3 define REST contracts with schema validation.
- **Logic:** Subtasks 2.2 & 2.3 orchestrate workflow engines and concurrency rules.
- **Design:** Subtask 2.5 coordinates UX acceptance criteria for booking and bidding states.

### Task 3 — Build Marketplace, Inventory & Monetisation Backbones (100% complete)
Create revenue-generating services, enforce insured seller policies, and prepare ad campaign infrastructure.

#### Subtasks
3.1 Ship inventory ledger with transaction history, low-stock alerts, and reconciliation utilities.
3.2 Implement rental agreement lifecycle (request, approval, pickup, return, settlement) with document capture.
3.3 Enforce insured seller eligibility, compliance document checks, and marketplace moderation workflows.
3.4 Develop Fixnado + Finova campaign manager services (targeting, budgeting, pacing, billing reconciliation).
3.5 Map monetisation telemetry to analytics warehouse and configure fraud monitoring signals.

*2025-10-16 update:* Subtask **3.1** now exposes a production-grade provider inventory stack. New Sequelize models (`InventoryItem`, `InventoryLedgerEntry`, `InventoryAlert`) and migration `20250216000000-create-inventory-ledger.js` persist on-hand/reserved balances, ledger snapshots, and alert lifecycle metadata. The `/api/inventory` router delivers item CRUD, ledger queries, health summaries, reconciliation, and alert acknowledgement endpoints (`inventoryRoutes.js`, `inventoryController.js`, `inventoryService.js`). Configuration knobs (`config.inventory`, `INVENTORY_*` env vars) govern pagination and low-stock thresholds, while Vitest suites (`tests/inventoryRoutes.test.js`) and sqlite-safe mocks in `vitest.setup.js` guard critical flows (adjustments, health reporting, alert resolution). Documentation across change logs, design specs (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Dashboard Designs.md`), and trackers updated to evidence delivery and align provider/admin UI flows.

*2025-10-17 update:* Subtask **3.2** (Rental lifecycle) is production-complete. Backend delivery includes Sequelize models for `RentalAgreement`, `RentalCheckpoint`, and extended inventory associations plus migration `20250217000000-create-inventory-and-rentals.js` wiring deposits, inspection metadata, and termination reasons. Services/controllers/routes (`rentalService.js`, `rentalController.js`, `rentalRoutes.js`) orchestrate request approval, reservation locking, checkout, partial/early returns, inspection outcomes, dispute escalation, and automated alert governance. Vitest suites (`tests/rentalRoutes.test.js`) cover approvals, mixed returns, inspection variance, cancellation, and alert hand-off. Documentation updates span backend change logs, database updates, design artefacts (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Dashboard Designs.md`), progress trackers, and changelog entries, enabling provider/admin UX to surface rental agreements, inspection queues, and settlement tasks aligned to `/api/inventory/*` and `/api/rentals/*` responses.

*2025-10-18 update:* Subtask **3.3** now enforces insured seller eligibility end-to-end. Compliance submissions, reviews, badge toggles, and suspensions persist via new Sequelize models/migration (`ComplianceDocument`, `InsuredSellerApplication`, `MarketplaceModerationAction`, migration `20250218000000-compliance-and-marketplace-moderation.js`) with service/controller coverage under `/api/compliance`. Marketplace listings are gated by compliance checks, moderation queue APIs, and feed filtering so only approved, in-date sellers surface (`services/marketplaceService.js`, `controllers/marketplaceController.js`, `routes/marketplaceRoutes.js`, `services/feedService.js`). Vitest suite `tests/complianceMarketplace.test.js` exercises blocked unverified sellers, document approval, moderation approval/rejection, feed suppression after expiry, and suspension gating while documentation + design artefacts (badge manager panels, moderation queue spec in `Screens_Update.md`, `Dashboard Designs.md`, drawings) reflect insured status UX and compliance copy updates.

*2025-10-19 update:* Subtask **3.4** launches the Fixnado + Finova campaign manager with production-grade targeting, pacing, and billing workflows. New Sequelize models and migration (`AdCampaign`, `CampaignFlight`, `CampaignTargetingRule`, `CampaignInvoice`, `CampaignDailyMetric`, migration `20250219000000-create-campaign-manager.js`) persist budgets, targeting filters, pacing telemetry, and invoice linkage. `/api/campaigns` exposes campaign CRUD, flight allocation, daily metric ingestion, invoice generation, and status toggles via `campaignController.js`, `campaignService.js`, and `campaignRoutes.js`, while config adds governed overspend and targeting limits. Vitest suite `tests/campaignRoutes.test.js` verifies insured seller gating, multi-day pacing, overspend pause rules, invoice reconciliation, and summary endpoints. Programme artefacts (change logs, backend/database updates, trackers, `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Dashboard Designs.md`) document campaign manager UI (targeting chips, pacing badges, billing drawer), analytics hooks, and billing governance so marketplace monetisation flows move into delivery without specification debt.

*2025-10-20 update:* Subtask **3.5** now maps campaign telemetry into the analytics warehouse and automates fraud monitoring. `CampaignAnalyticsExport` and `CampaignFraudSignal` tables capture export payloads, retry metadata, and anomaly classifications; `campaignService.js` computes CTR/CVR/anomaly scores, upserts outbox payloads, and raises/resolves fraud signals (`overspend`, `underspend`, `suspicious_ctr`, `suspicious_cvr`, `delivery_gap`, `no_spend`). The new background exporter (`jobs/campaignAnalyticsJob.js`) posts JSON payloads to configurable warehouse endpoints with API key support and retry cadence governed via `config.campaigns`. API endpoints (`PUT /targeting`, `POST /metrics`, `GET /fraud-signals`, `POST /fraud-signals/:id/resolve`, `GET /summary`) expose analytics exports, targeting refresh, fraud remediation, and KPI summaries, while Vitest suite `tests/campaignRoutes.test.js` asserts outbox creation, anomaly detection/resolution, and summary aggregation. Documentation, design artefacts, and trackers capture fraud ops workflows, warehouse integration steps, and dashboard requirements powering monetisation telemetry across admin/provider/mobile experiences.
*2025-10-20 follow-up:* Dedicated Vitest coverage (`tests/campaignAnalyticsJob.test.js`) now mocks warehouse responses to prove exporter retries/backoff and API key header wiring, and design artefacts (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Dashboard Designs.md`) embed analytics export tiles, anomaly rails, notification flows, and mobile parity specifications with telemetry + accessibility notes for fraud/finance operations.

#### Integration Coverage
- **Backend:** Subtasks 3.1–3.5 extend services, background jobs, and fraud analytics pipelines.
- **Front-end:** Subtasks 3.2, 3.4 & 3.5 expose payloads for storefront, ads, provider dashboards, and fraud/analytics widgets.
- **User phone app:** Subtask 3.2 ensures mobile rental flows; Subtask 3.5 feeds push notification triggers and fraud alerts.
- **Provider phone app:** Subtasks 3.1–3.5 deliver inventory, rental, campaign, and anomaly data consumed by provider Flutter app.
- **Database:** Subtasks 3.1, 3.4 & 3.5 add ledger tables, billing schemas, analytics exports, and fraud signal catalogues.
- **API:** Subtasks 3.1–3.5 publish REST endpoints with throttling rules plus analytics/fraud telemetry.
- **Logic:** Subtask 3.5 tunes fraud heuristics, monetisation business rules, and export retry cadence.
- **Design:** Subtasks 3.2, 3.4 & 3.5 coordinate UI specs for marketplace, rental, ads, and anomaly dashboards.

### Task 4 — Develop Cross-Channel Experience & Collaboration (68% complete)
Deliver cohesive UX across web and Flutter apps, enabling communications, localisation, and business front management.

#### Subtasks
4.1 Build React explorer, zone overlays, and booking wizard UI integrating new backend contracts.
4.2 Achieve Flutter parity across user, servicemen, provider, and enterprise apps for explorer, booking, and rental flows.
4.3 Integrate chat with AI assist toggles, Agora video/phone sessions, and notification centre across channels.
4.4 Implement business fronts, provider dashboards, and enterprise panels with role-based guardrails.
4.5 Execute accessibility, localisation, and performance audits, feeding findings into defect tracker.

*2025-10-21 update:* Subtask **4.1** React explorer delivery is now production-ready. `frontend-reactjs/src/pages/Search.jsx` orchestrates URL-synchronised filters, MapLibre-powered zone overlays, and analytics-aware result cards consuming `/api/search` + `/api/zones?includeAnalytics=true`. Supporting components (`components/explorer/*`), utilities (`pages/explorerUtils.js`), and tests (`pages/__tests__/explorerUtils.test.js`) ensure demand filters, SLA summaries, and map bounds remain deterministic, while the new API client (`src/api/explorerClient.js`) normalises MultiPolygon/centroid geometry for SQLite/PostGIS parity. Documentation and trackers refreshed across frontend and design artefacts to align explorer UX with drawings and compliance copy.

*2025-10-21 follow-up:* Subtask **4.2** advanced with Flutter booking and rental controller suites validating live/ cached refresh, offline fallbacks, and lifecycle actions against explorer/booking/rental drawings. `flutter-phoneapp/test/features/bookings/booking_controller_test.dart` and `flutter-phoneapp/test/features/rentals/rental_controller_test.dart` now exercise Riverpod providers, repository overrides, and action flows (creation, schedule, inspection) to guarantee parity with `App_screens_drawings.md`, `dashboard_drawings.md`, and `Screens_Update_Logic_Flow.md`. Trackers, change logs, and design artefacts updated; remaining scope focuses on chat integration and enterprise dashboard wiring before declaring Subtask 4.2 complete.

*2025-10-22 update:* Subtask **4.3** is now production-ready. Backend delivery introduces dedicated communications domain models (`Conversation`, `ConversationParticipant`, `ConversationMessage`, `MessageDelivery`) and migration `20250221000000-create-communications.js`, orchestrated through `communicationsService.js`, `communicationsController.js`, and `/api/communications` routes. Threads honour quiet-hour suppression, AI assist heuristics/external providers, Agora token generation, and delivery audit trails with Vitest coverage in `tests/communicationsRoutes.test.js`. React ships the cross-channel communications workspace (`frontend-reactjs/src/pages/Communications.jsx`, `components/communications/*`, `api/communicationsClient.js`) featuring thread rail, AI-enabled composer, quiet-hour controls, notification drawer, and Agora launcher backed by deterministic tests. Flutter gains Riverpod repository/controller/domain layers (`lib/features/communications/*`) plus controller tests asserting offline caching, AI toggles, and video session orchestration. Trackers, design artefacts (`Design_Plan.md`, `Design_Change_log.md`, `component_functions.md`) and changelogs refreshed; focus shifts to Task 4.4 enterprise dashboards and Task 4.5 localisation/accessibility sweeps.

*2025-10-23 update:* Subtask **4.4** is production-complete. React now routes provider and enterprise personas to live dashboards via `/provider/dashboard`, `/enterprise/panel`, and role-aware business fronts at `/providers/:slug`. Navigation surfaces a governed dashboards mega-menu that maps to design drawings (`menu_drawings.md`, `dashboard_drawings.md`, `website_drawings.md`) and respects RBAC copy. `ProviderDashboard.jsx` and `EnterprisePanel.jsx` hydrate the new backend contracts with metric tiles, analytics widgets, SLA alerts, fraud summaries, and compliance queues, while `BusinessFront.jsx` renders showcase media, testimonials, and service packages with operational metrics. Shared API client (`panelClient.js`) persists token handling and error semantics. Documentation (update + design change logs, plan, progress tracker, milestone notes) now captures persona journeys, accessibility considerations, telemetry IDs, and QA selectors for dashboards/business fronts, unblocking Flutter parity work in Subtask 4.2 and accessibility sweeps in 4.5.

*2025-10-27 update:* Subtask **4.5** is now production-ready. Locale provider + translation catalogues power language toggles across header, dashboards, and business fronts with persisted preferences, HTML `lang/dir` updates, and Intl-based formatting. Provider/enterprise panels and business fronts expose translated copy, accessible skip links, aria-live alerts, and cache-aware refresh affordances while route-level Suspense reduces time-to-interactive. Documentation (`change_log.md`, `Design_Change_log.md`, `Design_Plan.md`, frontend updates) captures localisation rules, accessibility scripts, QA selectors, and performance budget improvements so Task 4 exits Milestone M4 with WCAG + internationalisation evidence.

#### Integration Coverage
- **Backend:** Subtasks 4.3 & 4.4 require websocket/session orchestration and panel APIs.
- **Front-end:** Subtasks 4.1 & 4.4 drive React delivery with design QA.
- **User phone app:** Subtasks 4.2 & 4.3 ensure user app parity and communications integration.
- **Provider phone app:** Subtasks 4.2 & 4.4 tailor provider scheduling, dashboards, and notifications.
- **Database:** Subtasks 4.3 & 4.4 persist chat transcripts, panel widgets, and preferences.
- **API:** Subtasks 4.1–4.4 expose GraphQL/REST endpoints for explorer, chat, and dashboards.
- **Logic:** Subtask 4.5 validates orchestration behaviour, caching, and offline handling.
- **Design:** Subtasks 4.1, 4.4 & 4.5 complete visual QA, localisation copy decks, and accessibility sign-off.

### Task 5 — Analytics, Data Governance & Reporting (92% complete)
Extend data pipelines, dashboards, and governance to evidence performance, compliance, and monetisation outcomes.

#### Subtasks
5.1 Finalise unified event schema covering zones, bookings, rentals, disputes, ads, and communications.
5.2 Update ETL/ELT pipelines to ingest new datasets with GDPR-compliant retention and anonymisation.
    • 5.2a Deliver ingestion connectors for analytics events and backfill backlog older than 14 days.
    • 5.2b Harden anonymisation rules, document retention tiers, and wire purge automation to staging.
    • 5.2c Roll the pipeline out to production with monitoring hooks and rollback toggles.
5.3 Build persona dashboards (admin, provider, servicemen, enterprise) with KPI drill-downs and export tooling.
    • 5.3a Ship admin/provider Looker explores with sample tiles and selector QA notes.
    • 5.3b Wire React dashboard widgets to the explores behind feature toggles.
    • 5.3c Capture Flutter parity stories and cross-channel export validation.
5.4 Configure alerting for data freshness, SLA breaches, dispute spikes, ad overspend, and compliance expiries.
    • 5.4a Stand up warehouse freshness monitors and add to OpsGenie on-call rotation.
    • 5.4b Implement SLA/dispute/ad anomaly rules feeding the communications service.
    • 5.4c Validate push/in-app notification parity across React and Flutter clients.
5.5 Publish metric catalogue, data dictionary, and access control policies aligned to governance standards.
    • 5.5a Draft catalogue skeleton with ownership, source tables, and retention SLA columns.
    • 5.5b Run governance review, address comments, and secure sign-off from compliance/legal.
    • 5.5c Automate publishing into the documentation portal with nightly refresh jobs.

#### Integration Coverage
- **Backend:** Subtasks 5.1 & 5.2 adjust event emitters and ingestion services.
- **Front-end:** Subtask 5.3 surfaces dashboards within React panels.
- **User phone app:** Subtask 5.4 connects push notifications and in-app alerts for SLA events.
- **Provider phone app:** Subtasks 5.3 & 5.4 deliver mobile analytics widgets and alerts.
- **Database:** Subtasks 5.1 & 5.2 manage warehouse schemas and retention policies.
- **API:** Subtasks 5.3 & 5.4 expose analytics endpoints and alert webhooks.
- **Logic:** Subtasks 5.1 & 5.4 encode metric calculations and threshold evaluation.
- **Design:** Subtask 5.3 ensures data visualisation standards and accessibility compliance.

*2025-10-24 update:* Subtask **5.1** is production-ready. `backend-nodejs/src/models/analyticsEvent.js`, migration `20250223000000-create-analytics-events.js`, and `services/analyticsEventService.js` define a catalogued schema with tenant inference, actor context, and metadata validation. Zone, booking, rental, campaign, and communications services now emit governed events for creation/status/assignment/dispute/inspection/fraud/message suppression flows, with Vitest suites asserting persisted records. Documentation, database change logs, design artefacts (`Design_Change_log.md`, `Screens_Update.md`, `dashboard_drawings.md`, `App_screens_drawings.md`, `website_drawings.md`) and trackers capture telemetry governance so ETL/Looker pipelines can rely on a unified event backbone.
*2025-10-26 update:* Subtask **5.2** now operates end-to-end ingestion. Migration `20250224000000-augment-analytics-events.js` augments `analytics_events` with ingestion/retention metadata, `analyticsEventService` exposes fetch/mark/purge/backfill helpers, and new background job `backend-nodejs/src/jobs/analyticsIngestionJob.js` batches events to configurable warehouse endpoints with retry cadence, timeout handling, and retention enforcement configured via `config.analyticsPipeline`. Communications suppression telemetry now defers until transactions commit and includes delivery identifiers so dashboards chart quiet-hour outcomes accurately. Vitest suite `tests/analyticsIngestionJob.test.js` validates success, retry, purge, and backfill flows while refreshed `tests/communicationsRoutes.test.js` confirms suppression analytics integrity. Documentation/design trackers (`update_progress_tracker.md`, `Design_Plan.md`, `Design_Change_log.md`, drawings) capture ingestion swim lanes, retention dashboards, and support escalation guidance, progressing Subtask 5.2 toward completion.

*2025-10-28 update:* Subtask **5.2c** is production-ready. Pause/resume API (`backend-nodejs/src/routes/analyticsPipelineRoutes.js`, `controllers/analyticsPipelineController.js`) now surfaces backlog metrics, failure streaks, and auditable run history stored via `AnalyticsPipelineRun` model/migration `20250225000000-create-analytics-pipeline-runs.js`. `analyticsPipelineService` enforces toggle governance, Secrets Manager overrides, and actor/ticket validation while ingestion job run summaries respect live control state. Vitest coverage (`tests/analyticsPipelineRoutes.test.js`) validates status, pause, resume, and run logging paths. Documentation updates span backend/database change logs, design artefacts (`Screens_Update.md`, `Dashboard Designs.md`), progress/milestone trackers, and test plan additions, closing Task 5.2 rollout requirements with production-grade monitoring and rollback controls.

*2025-10-29 update:* Subtask **5.3a** now delivers persona dashboards and governed export tooling. `dashboardAnalyticsService.js`, `analyticsDashboardController.js`, and `/api/analytics/dashboards/:persona(/export)` aggregate bookings, rentals, campaigns, fraud, compliance, and communications telemetry per role with CSV serialization and Supertest coverage. React `RoleDashboard.jsx` hydrates live payloads with retry/offline handling, export CTA, localisation hooks, and Vitest assertions. Design artefacts (`Design_Plan.md` Section 37, `Design_Change_log.md` Entry 27, drawings) and documentation (backend/frontend change logs, trackers, test plan) capture persona layouts, telemetry IDs, accessibility/localisation requirements, and Looker ingestion notes, moving Task 5.3 toward completion with remaining enterprise drill-down + mobile parity follow-ups logged.

*2025-10-30 update:* Persona dashboard delivery is now live in code. Backend services (`dashboardAnalyticsService.js`) calculate production metrics for admin, provider, serviceman, and enterprise personas using real bookings, rentals, campaigns, inventory alerts, and compliance artefacts with CSV exports streamed by `analyticsDashboardController.js`. Express routes validate persona queries while Supertest suite `tests/analyticsDashboards.test.js` seeds realistic fixtures (zones, users, assignments, campaigns) to assert KPIs, pipelines, compliance rows, and export payloads. React `RoleDashboard.jsx` now calls `/api/analytics/dashboards/:persona`, shows skeleton/error states, search, refresh, and CSV download through `analyticsDashboardClient.js`, with Vitest coverage in `src/pages/__tests__/RoleDashboard.test.jsx`. Documentation, change logs, progress trackers, and design artefacts were refreshed to reflect the live integration and production validation scope for Subtask 5.3a.

*2025-10-31 update:* Subtask **5.3b** is production-complete. Feature toggle provider (`frontend-reactjs/src/providers/FeatureToggleProvider.jsx`) now hydrates Secrets Manager manifests for analytics cohorts, and `DashboardAccessGate.jsx` renders gated banners, pilot access form, and toggle summary card before persona components mount. `RoleDashboard.test.jsx` asserts gated vs enabled flows, while design artefacts (`Design_Plan.md`, `Design_Change_log.md`, `Dashboard Designs.md`) capture gating copy, telemetry IDs (`feature.toggle.refresh`, `feature.toggle.request_access`), and ops workflow references. Update trackers, milestone notes, and test plan now cite toggle gating evidence so analytics ops can audit rollout approvals alongside dashboard readiness.

#### Task 5 Iteration Plan
- **Iteration A (In progress)** — Complete 5.2a and 5.2b with staging validation before expanding scope. Target exit: *2025-10-30*.
- **Iteration B** — Deliver 5.3a, 5.3b, and 5.5a to unlock analytics UI workstreams. Target exit: *2025-11-05*.
- **Iteration C** — Close monitoring loops (5.4a–5.4c) and finalise documentation automation (5.5b–5.5c). Target exit: *2025-11-12*.

### Task 6 — Quality Assurance, Compliance & Launch Readiness (5% complete)
Converge on testing, documentation, training, and go-live governance to exit with production confidence.

#### Subtasks
6.1 Author master test plan covering functional, integration, performance, security, localisation, and accessibility scopes.
    • 6.1a Collect existing artefacts (backend/frontend/mobile test strategies) and align taxonomy.
    • 6.1b Facilitate review workshop with QA, compliance, and design to lock acceptance criteria.
    • 6.1c Publish versioned plan with traceability matrix mapped to update trackers.
6.2 Expand automation suites (API, UI, Flutter, contract, chaos) tied to Definition of Done for each feature stream.
    • 6.2a Stabilise backend contract tests and document fixture coverage gaps.
    • 6.2b Land React + Flutter smoke suites in CI with retry + flake monitoring dashboards.
    • 6.2c Prototype chaos tests for booking/communications flows with rollback scripts.
6.3 Run performance, load, and resilience drills across booking, chat, payments, analytics, and ads workloads.
    • 6.3a Baseline load profiles, target concurrency, and data capture instrumentation.
    • 6.3b Execute booking/chat drills with scenario ownership and results sign-off.
    • 6.3c Extend to payments/analytics/ads once tooling gaps from 6.3a are resolved.
6.4 Conduct GDPR, insurance/DBS, HMRC, and advertising compliance audits with documented evidence packs.
    • 6.4a Prep evidence templates, assign auditors, and schedule regulator checkpoints.
    • 6.4b Run dry-run audits for GDPR + insurance to uncover data/documentation gaps.
    • 6.4c Compile final packs and capture sign-off records in compliance knowledge base.
6.5 Finalise release notes, training curriculum, support playbooks, and hypercare rota with sign-off checkpoints.
    • 6.5a Draft release comms outline and map dependencies to analytics/dashboard deliveries.
    • 6.5b Produce support training assets (videos, runbooks) and gather stakeholder feedback.
    • 6.5c Publish hypercare rota, escalation matrix, and acceptance sign-offs.

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

#### Task 6 Iteration Plan
- **Iteration A (In progress)** — Close 6.1a–6.1c and 6.2a with shared taxonomy and fixture coverage notes. Target exit: *2025-10-31*.
- **Iteration B** — Land CI smoke stability (6.2b), baseline load drills (6.3a–6.3b), and dry-run compliance audits (6.4a–6.4b). Target exit: *2025-11-07*.
- **Iteration C** — Deliver chaos/performance extensions (6.2c, 6.3c), final compliance packs (6.4c), and release/hypercare materials (6.5a–6.5c). Target exit: *2025-11-14*.

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

