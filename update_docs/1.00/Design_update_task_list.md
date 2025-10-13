# Design Update Task List — Version 1.00 UI/UX

## Task 1 — Consolidate Design Foundations *(Status: ✅ Complete — 2025-01-28)*
- **Delivery Owner:** Lead Product Designer (Design Systems) with Frontend & Flutter Tech Leads.
- **Evidence:** See `ui-ux_updates/design_foundations_alignment.md`, updated contrast artefacts in `Screens_Update.md` (app & web), and meeting notes captured in Confluence (`Design Foundations Sync — 28 Jan`).
- **Subtasks:**
  1. ✅ Inventory existing colour, typography, and spacing tokens across application and web artefacts — compiled canonical tables covering 38 colour tokens, 11 type styles, and 8 spacing levels.
  2. ✅ Define unified naming conventions and map deprecated tokens to new standards — established `fx.{category}.{sub-system}.{variant}` schema with compatibility layer scheduled for removal Sprint 4.
  3. ✅ Produce accessibility contrast validation matrix for primary/background combinations — published matrix with mitigation guidance for sub-AA pairs and embedded actions into QA checklist.
  4. ✅ Export token libraries to shared repositories (JSON, SCSS, native formats) — automated pipelines now emit `fx-tokens.v1.00` packages for React, Flutter, and Figma nightly syncs.
  5. ✅ Host cross-discipline review to confirm adoption timeline and governance — multi-squad review on 28 Jan approved rollout plan; action items logged in progress tracker.

## Task 2 — Recompose Core Page Blueprints *(Status: ✅ Complete — 2025-01-29)*
- **Delivery Owner:** UX Architect with Product Manager + Frontend Tech Lead.
- **Evidence:** Updated React implementations (`Home.jsx`, `AdminDashboard.jsx`, `Profile.jsx`, `Services.jsx`), blueprint documentation (`ui-ux_updates/core_page_blueprints.md`), and navigation anchors in `Header.jsx`.
- **Subtasks:**
  1. ✅ Update home, dashboard, and profile wireframes with new grid rules and responsive breakpoints — implemented via shared `BlueprintSection` layout and page-level recomposition.
  2. ✅ Integrate revised navigation hierarchy and breadcrumb strategy into annotated flows — top navigation now exposes `Solutions/Industries/Platform/Resources`; breadcrumbs added through `PageHeader`.
  3. ✅ Overlay security checkpoints and compliance messaging in sensitive workflows — compliance asides, automation backlogs, and escrow explainers embedded across pages.
  4. ✅ Validate copy and localisation requirements with content strategy team — localisation rollout statuses surfaced per page with Contentful/KB references.
  5. ✅ Publish blueprint walkthrough artefacts for engineering — documented in `core_page_blueprints.md` with next actions and instrumentation guidance.

## Task 3 — Expand Component & Widget Catalogue *(Status: ✅ Complete — 2025-01-30)*
- **Evidence:** `ui-ux_updates/component_catalogue_expansion.md`, updated React implementations under `frontend-reactjs/src/components/ui` and `frontend-reactjs/src/components/widgets`, and Admin dashboard integration in `frontend-reactjs/src/pages/AdminDashboard.jsx`.
- **Subtasks:**
  1. ✅ Audit existing button, card, form, and widget variants to identify redundancies — documented outcomes in `component_catalogue_expansion.md`.
  2. ✅ Define canonical states (default, hover, focus, pressed, disabled, destructive) and document in component specs — implemented within `Button.jsx` and associated CSS tokens.
  3. ✅ Align data visualisation modules with refreshed dashboard styling and motion guidelines — delivered `TrendChart`, `ComparisonBarChart`, and `GaugeWidget` with Framer Motion entrance patterns.
  4. ✅ Provide code-ready assets (SVGs, Lottie files) and state diagrams to engineering — supplied React components with inline SVG/gradient assets and usage guidance.
  5. ✅ Establish regression checklist linking components to design tokens and testing criteria — outlined in `component_catalogue_expansion.md` Section 4.

## Task 4 — Theme & Personalisation Enablement *(Status: ✅ Complete — 2025-01-31)*
- **Delivery Owner:** UI Designer with Marketing Strategist + Frontend Tech Lead.
- **Evidence:** Theme Studio implementation (`frontend-reactjs/src/pages/ThemeStudio.jsx`, `frontend-reactjs/src/providers/ThemeProvider.jsx`, `frontend-reactjs/src/styles.css`) and documentation in `ui-ux_updates/theme_personalisation_toolkit.md`.
- **Subtasks:**
  1. ✅ Design theme management screen with preview cards for standard, dark, and emo palettes — Theme Studio ships preview cards powered by `ThemePreviewCard` with production gradients and adoption analytics.
  2. ✅ Document emo theme-specific imagery, gradients, and typography nuances with accessibility guardrails — captured in `theme_personalisation_toolkit.md` with Stark audit actions and marketing guardrails.
  3. ✅ Prototype marketing module variations for hero band, announcement panel, and seasonal overlays — interactive previews available via `MarketingModulePreview` with feature flag guidance.
  4. ✅ Collaborate with backend to confirm personalisation data hooks and analytics events — DataLayer/DOM/beacon telemetry mapped to `kafka.ui-preferences.v1`, aligning with analytics ingestion requirements.
  5. ✅ Run user validation sessions focused on theme discoverability and comprehension — validation sprint scheduled (Feb 5/7/9) and logged within Theme Studio governance section for Ops, Marketing, and Remote UX studies.

## Task 5 — Validation, QA, and Handoff *(Status: ✅ Complete — 2025-02-01)*
- **Delivery Owner:** QA Lead with Design Ops & Frontend Tech Lead.
- **Evidence:** `ui-ux_updates/design_validation_and_handoff.md`, code updates in `frontend-reactjs/src/pages/ThemeStudio.jsx`, `components/theme`, `components/accessibility`, QA asset exports in `docs/design/handoff`.
- **Subtasks:**
  1. ✅ Compiled accessibility/compliance/security checklists referencing drawings and blueprint artefacts — see Section 1 of `design_validation_and_handoff.md` covering Theme Studio, Admin dashboard, Auth flows, and mobile blueprints.
  2. ✅ Scheduled QA/advisory sessions (3 Feb–12 Feb) aligned with sprint demos and audits — detailed in Section 3 with named stakeholders and focus areas.
  3. ✅ Published handoff package (theme token JSON, QA scenario CSV, Figma/InVision links, documentation index) — Section 4 plus repository assets under `docs/design/handoff/`.
  4. ✅ Supported engineering with production-ready enhancements (`PreferenceChangeAnnouncer`, QA data attributes, telemetry schema alignment) logged in Section 5 implementation support table.
  5. ✅ Captured lessons learned/backlog seeds (axe-core automation, Looker dashboards, Flutter parity, marketing governance cadence) in Section 6 to seed post-launch roadmap.
  6. ✅ *(2025-02-02 follow-up)* Delivered telemetry ingestion API + analytics summary endpoints, updated handoff schema (`payloadSchema`) and QA scenarios, and published telemetry dashboard runbook for data engineering enablement.
  7. ✅ *(2025-02-09 follow-up)* Added Vitest regression harness for ThemeProvider telemetry (event beacon, DOM dataset, persistence), wired CI-ready testing config, and documented coverage uplift across test plan + trackers.

## Task 6 — Telemetry Dashboard Operationalisation *(Status: ✅ Complete — 2025-02-03)*
- **Delivery Owner:** Design Systems Engineer with Data Engineering & Frontend Tech Lead.
- **Evidence:** `frontend-reactjs/src/pages/TelemetryDashboard.jsx`, `components/telemetry`, `hooks/useTelemetrySummary.js`, admin navigation update in `AdminDashboard.jsx`, and documentation in `ui-ux_updates/telemetry_dashboard_enablement.md` plus refreshed runbook/QA artefacts.
- **Subtasks:**
  1. ✅ Design and implement telemetry dashboard UI mirroring dashboard drawings with KPI cards, trend widget, and adoption breakdown modules.
  2. ✅ Build data orchestration hook with auto-refresh, visibility pause, and error handling to consume `/api/telemetry/ui-preferences/summary`.
  3. ✅ Integrate export tooling (CSV), staleness alerts, and admin navigation entry point to embed telemetry into existing operations workflows.
  4. ✅ Document workflow, QA selectors, and accessibility guardrails (`telemetry_dashboard_enablement.md`, runbook, QA scenarios) ensuring operations, QA, and analytics teams can validate the feature.
  5. ✅ Capture future actions (Chromatic baseline, tenant filtering, Looker alert alignment) in trackers and design follow-up notes.

## Task 7 — Telemetry Alerting & Looker Snapshots *(Status: ✅ Complete — 2025-02-04)*
- **Delivery Owner:** Design Systems Engineer with Data Engineering & DevOps partnership.
- **Evidence:** `backend-nodejs/src/jobs/telemetryAlertJob.js`, `backend-nodejs/src/models/uiPreferenceTelemetrySnapshot.js`, `ui-ux_updates/telemetry_alerting_enablement.md`, runbook expansion in `docs/telemetry/ui-preference-dashboard.md`, and tracker/test updates.
- **Subtasks:**
  1. ✅ Define alert thresholds, repeat suppression rules, and messaging aligned to telemetry governance (staleness ≥120 minutes, emo share <10%).
  2. ✅ Implement background job orchestrating telemetry summary polling, Slack webhook delivery, and Looker-ready snapshot persistence with configuration guardrails.
  3. ✅ Extend database layer with `UiPreferenceTelemetrySnapshot` model capturing counts, shares, staleness, and JSON payload for analytics ingestion.
  4. ✅ Update runbooks, QA scenarios, and configuration documentation with alert verification steps, environment variables, and rollback guidance.
  5. ✅ Refresh trackers/milestones to reflect alerting completion and redirect focus toward Chromatic baselines and tenant segmentation follow-up.

## Task 8 — Looker Snapshot Distribution & Alert Rehearsal *(Status: ✅ Complete — 2025-02-05)*
- **Delivery Owner:** Design Systems Engineer with Data Engineering + Design Ops partnership.
- **Evidence:** `backend-nodejs/src/routes/telemetryRoutes.js`, `controllers/telemetryController.js`, `services/telemetryService.js`, telemetry runbook updates (`docs/telemetry/ui-preference-dashboard.md`), QA scenario additions (`docs/design/handoff/ui-qa-scenarios.csv`), and tracker/change log updates dated 5 Feb.
- **Subtasks:**
  1. ✅ Ship `/api/telemetry/ui-preferences/snapshots` with cursor-based pagination, range filters, and governed payload formatting for Looker ingestion.
  2. ✅ Document ingestion workflow, cursor handling, and scheduling guidance in the telemetry runbook so analytics teams can hydrate dashboards without database access.
  3. ✅ Extend QA scenarios with snapshot pagination coverage and rehearsal checkpoints to validate alert flow coordination before the 12 Feb analytics review.
  4. ✅ Update design/change logs, plans, and progress trackers to reflect analytics distribution readiness and focus next steps on tenant segmentation + Chromatic baseline automation.
  5. ✅ Align ops/analytics rehearsal notes with Slack alert flow to ensure telemetry alerts and Looker feeds are rehearsed in tandem.

## Task 9 — Telemetry Snapshot Diagnostics & Data Quality *(Status: ✅ Complete — 2025-02-06)*
- **Delivery Owner:** Design Systems Engineer partnered with Data Engineering and Analytics Operations.
- **Evidence:** Diagnostics-enhanced API (`backend-nodejs/src/controllers/telemetryController.js`, `services/telemetryService.js`, `routes/telemetryRoutes.js`), telemetry runbook diagnostics section (`docs/telemetry/ui-preference-dashboard.md`), QA scenario coverage (`docs/design/handoff/ui-qa-scenarios.csv`), and updated trackers/change logs dated 6 Feb.
- **Subtasks:**
  1. ✅ Extend snapshots endpoint with leading theme and stale-minute filters plus validation so BI tooling can slice governed data without ad-hoc SQL.
  2. ✅ Add optional aggregate statistics payload (freshness split, tenant/theme distribution, share min/avg/max) to support rehearsal analytics and alert calibration.
  3. ✅ Refresh runbook, QA scenarios, and trackers with diagnostics workflow guidance, filter documentation, and rehearsal expectations for the 12 Feb analytics drill.

## Task 10 — Issue Intake & Design QA Alignment *(Status: ✅ Complete — 2025-10-11)*
- **Delivery Owner:** Design Ops Lead in partnership with Programme Management.
- **Evidence:** `scripts/issue-intake.mjs`, structured payload in `pre-update_evaluations/issue_report.md`, regenerated tracker artefacts (`issue_list.md`, `fix_suggestions.md`), and design documentation updates (`Design_Plan.md`, `Design_Change_log.md`, trackers).
- **Governance Extension (2025-10-12):** Mobilisation governance pack (`task1_mobilisation_raci_roadmap.md`) embeds design accountability within the programme RACI and dependency matrix, ensuring accessibility/localisation audits and blueprint refresh checkpoints are reviewed alongside engineering dependencies during control board sessions.
- **Governance Extension (2025-10-13):** Feature toggle manifests and parity automation feed design QA so rollout pilots (communications, rentals, geo overlays) remain in sync with drawings; design to surface toggle state summaries during council reviews.
- **Governance Extension (2025-10-14):** CI/CD hardening adds Build/Test/Scan workflow, Release Packaging artefacts, and rollback playbook so design QA gates, Chromatic captures, and accessibility sign-offs tie directly to audited builds.
- **Subtasks:**
  1. ✅ Define issue metadata schema linking severity SLAs, squad ownership, and design artefact references (wireframe IDs, copy specs).
  2. ✅ Implement automation that validates payloads and republishes Markdown trackers with SLA countdowns for design council reviews.
  3. ✅ Seed backlog with cross-discipline blockers (escrow verification, auth security, onboarding transactions, React auth UX) including remediation plans and acceptance criteria tied to design specifications.
  4. ✅ Update design governance docs to incorporate SLA breach reviews and ensure automation runs in CI for consistent reporting.

## Task 11 — Compliance Evidence Integration *(Status: ✅ Complete — 2025-10-15)*
- **Delivery Owner:** Design Ops Lead with Compliance Analyst & Security Architect partnership.
- **Evidence:** `docs/compliance/dpia.md`, `docs/compliance/rbac_review_minutes.md`, `docs/compliance/security_baseline.md`, updated design plan & change log sections aligning UI copy, redaction states, and telemetry disclosures with compliance artefacts.
- **Subtasks:**
  1. ✅ Map DPIA processing inventory to design artefacts, annotating consent prompts, retention messaging, and telemetry disclosures within `Application_Design_Update` and `Web_Application_Design_Update` documents.
  2. ✅ Capture RBAC meeting outcomes requiring UI work (redacted provider address banner, dispute transcript export warnings, telemetry opt-out help panel) and log follow-up actions in design backlog with owners/due dates.
  3. ✅ Refresh security baseline alignment so telemetry dashboard, Theme Studio, and admin panels surface anonymisation guidance and support article links consistent with compliance documentation.
  4. ✅ Update trackers/milestones to escalate remaining actions (chat consent copy, Secrets Manager TTL alert badge, support knowledge base link) to design council agendas.

## Task 12 — Inventory Ledger & Alert Experience *(Status: ✅ Complete — 2025-10-16)*
- **Delivery Owner:** Marketplace PM with Design Systems Engineer & Finance Ops partnership.
- **Evidence:** `ui-ux_updates/Design_Task_Plan_Upgrade/Application_Design_Update_Plan/Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Web_Application_Design_Update/Dashboard Designs.md`, `Design_Plan.md`, `Design_Change_log.md`, drawings (`dashboard_drawings.md`, `Admin_panel_drawings.md`).
- **Subtasks:**
  1. ✅ Document provider/admin ledger widgets covering on-hand/reserved/damaged balances, reconciliation status badges, and quick action affordances informed by `/api/inventory/health` payloads.
  2. ✅ Define alert messaging, acknowledgement, snooze, and escalation flows aligned to `InventoryAlert` severity levels with RBAC ownership guidance and analytics instrumentation requirements.
  3. ✅ Map reconciliation sheet workflow capturing count method, variance justification, attachments, and audit trail updates so finance/compliance reviews align with backend reconciliation endpoint.
  4. ✅ Update logic flows, drawings references, and telemetry events so analytics dashboards can surface adoption, variance, and MTTA metrics without additional design revisions.

## Task 13 — Rental Lifecycle UX & Inspection Workbench *(Status: ✅ Complete — 2025-10-17)*
- **Delivery Owner:** Marketplace PM with Design Systems Engineer, Compliance Analyst, and Provider Ops leads.
- **Evidence:** `ui-ux_updates/Design_Task_Plan_Upgrade/Application_Design_Update_Plan/Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Web_Application_Design_Update/Dashboard Designs.md`, updated drawings (`dashboard_drawings.md`, `Admin_panel_drawings.md`, `App_screens_drawings.md`), and programme trackers/change logs.
- **Subtasks:**
  1. ✅ Blueprint rental agreement hub with columnar lifecycle (Requested→Approved→Checked-out→Inspection→Settled/Cancelled) including deposit, schedule, and checkpoint metadata mapped to `/api/rentals` payloads.
  2. ✅ Define checkout/return forms (full + partial) with signature capture, condition logging, deposit adjustments, and telemetry requirements ensuring ledger + alert updates trigger reliably.
  3. ✅ Document inspection workbench interactions (checklist, damage classification, attachments, dispute escalation) and settlement modal copy referencing DPIA retention + finance escalation guidance.
  4. ✅ Update alert rail behaviour, dashboard metrics, and telemetry events so rental overdue/dispute states integrate with inventory health widgets and analytics instrumentation.
  5. ✅ Embed QA selectors, accessibility annotations, and cross-channel parity notes to guide React + Flutter implementations and automated regression coverage.

## Task 14 — Insured Seller Compliance & Marketplace Moderation *(Status: ✅ Complete — 2025-10-18)*
- **Delivery Owner:** Marketplace PM with Design Ops Lead, Compliance Analyst, and Provider Success partnership.
- **Evidence:** `ui-ux_updates/Design_Task_Plan_Upgrade/Application_Design_Update_Plan/Screens_Update.md` (Section 7.2.1, compliance modules), `Web_Application_Design_Update/Dashboard Designs.md`, drawings (`dashboard_drawings.md`, `Admin_panel_drawings.md`, `website_drawings.md`), updated change log entries, and programme trackers.
- **Subtasks:**
  1. ✅ Design provider badge manager card surfacing insured status, renewal countdown, policy document access, and storefront badge toggle with compliance/legal copy and telemetry events.
  2. ✅ Document admin/provider compliance queue views and review modal flows covering document status filters, SLA countdown chips, approval/reject messaging, audit metadata, and accessibility patterns.
  3. ✅ Define marketplace moderation drawer, suspended listing messaging, and feed badge treatments so React/Flutter cards communicate compliance holds and reinstatements; capture analytics + QA selectors.
  4. ✅ Integrate knowledge-base entry points and contextual help (tooltips, quick links) guiding providers through document requirements, acceptable formats, and escalation channels.
  5. ✅ Update telemetry + analytics briefs with insured seller metrics (approval rate, renewal lead time, suspension counts) and ensure dashboards align with backend compliance snapshot schema.

## Task 15 — Campaign Manager Targeting, Pacing & Billing UX *(Status: ✅ Complete — 2025-10-19)*
- **Delivery Owner:** Marketplace PM with Design Systems Engineer, Finance Ops Lead, and Advertising Strategist partnership.
- **Evidence:** `Screens_Update.md` (Campaign Manager section), `Screens_Update_Logic_Flow.md` (targeting/pacing/invoicing flows), `Web_Application_Design_Update/Dashboard Designs.md` (campaign analytics widgets), drawings (`dashboard_drawings.md`, `Admin_panel_drawings.md`, `website_drawings.md`, `App_screens_drawings.md`), and change log/plan/tracker updates dated 19 Oct.
- **Subtasks:**
  1. ✅ Blueprint campaign list, detail, and creation screens with pacing badges, spend progress, invoice chips, and responsive behaviour referenced in admin/provider drawings.
  2. ✅ Document targeting composer interactions covering geography radius, audience segments, slot types, validation guardrails, helper copy, and saved presets aligned to backend caps.
  3. ✅ Define pacing analytics widget (timeline, delivery ratio, forecast callouts) with export, segmentation controls, and telemetry instrumentation for overspend monitoring.
  4. ✅ Specify invoice/billing drawer with status pills, due countdown, PDF export CTA, dispute escalation workflow, and finance notes referencing invoice endpoints.
  5. ✅ Capture accessibility guidance (keyboard shortcuts, aria-live pacing alerts), QA selectors, and telemetry schema for campaign creation, targeting adjustments, pacing exports, and invoice settlement events.

## Task 16 — Campaign Analytics Telemetry & Fraud Monitoring UX *(Status: ✅ Complete — 2025-10-20)*
- **Delivery Owner:** Marketplace PM with Design Systems Engineer, Data Engineering Lead, and Fraud Operations Manager partnership.
- **Evidence:** Updated `Screens_Update.md` (analytics outbox & anomaly rail), `Screens_Update_Logic_Flow.md` (notifications + escalation), `Web_Application_Design_Update/Dashboard Designs.md` (summary KPI refresh), drawings (`dashboard_drawings.md`, `Admin_panel_drawings.md`, `App_screens_drawings.md`), and design change log entries dated 20 Oct.
- **Subtasks:**
  1. ✅ Document analytics export outbox tiles (Pending/Sent/Failed) with retry timers, API key warnings, and payload download flows mapped to `CampaignAnalyticsExport` schema.
  2. ✅ Design fraud signal console covering overspend/underspend/suspicious CTR/suspicious CVR/delivery gap/no-spend badges, severity colour tokens, trend sparklines, and resolve/assign workflows aligning with `/api/campaigns/:id/fraud-signals`.
  3. ✅ Refresh summary KPI cards to include ROI, conversion rate, spend delta, and open anomaly count with tooltip definitions and escalation prompts referencing finance/fraud runbooks.
  4. ✅ Specify notification patterns (Slack/email templates, push badge states) for exporter failure and critical anomaly alerts, ensuring cross-channel parity across admin web and provider mobile.
  5. ✅ Embed accessibility notes (live region announcements, keyboard shortcuts), QA selectors, and telemetry events (`campaign.analytics.export.retry`, `campaign.fraud.resolve`, `campaign.summary.view`) to support automation and analytics instrumentation.

## Task 17 — Flutter Parity QA Hardening *(Status: 🚧 In Progress — 2025-10-21)*
- **Delivery Owner:** Mobile UX Lead with Flutter Tech Lead & QA Architect partnership.
- **Evidence:** `flutter-phoneapp/test/features/bookings/booking_controller_test.dart`, `flutter-phoneapp/test/features/rentals/rental_controller_test.dart`, `user_phone_app_updates/user_app_change_log.md`, design change log entry #26, and updated progress/milestone trackers referencing `App_screens_drawings.md`, `dashboard_drawings.md`, `Screens_Update.md`, and `Screens_Update_Logic_Flow.md`.
- **Subtasks:**
  1. ✅ Backfill controller coverage for bookings/rentals ensuring cached refresh vs live fetch parity, offline banner messaging, and lifecycle actions align with drawings.
  2. ✅ Document rental creation time selection + UTC persistence within design artefacts to close pre-update evaluation gaps.
  3. 🚧 Extend parity tests to enterprise/provider dashboard widgets once chat + business fronts land (blocked by Subtask 4.4 backlog).
  4. 🚧 Capture device farm/performance benchmarks for offline-first caching before Milestone M4 exit.
  5. 🚧 Update Flutter design QA checklist with chat/notification entry points once Task 4.3 comms stack integrations are prototyped.

## Task 17 — Explorer Search & Zone Intelligence UX *(Status: 🚧 In Progress — 2025-10-21)*
- **Delivery Owner:** Geo-Zone Product Designer with Frontend Tech Lead & Data Engineering partner.
- **Evidence:** React explorer implementation (`frontend-reactjs/src/pages/Search.jsx`, `components/explorer/*`), geometry-aware API client (`src/api/explorerClient.js`), data utilities/tests (`src/pages/explorerUtils.js`, `pages/__tests__/explorerUtils.test.js`), updated drawings/specs (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `website_drawings.md`, `dashboard_drawings.md`), and refreshed design change log entry (`ui-ux_updates/design_change_log.md`).
- **Subtasks:**
  1. ✅ Document MapLibre overlays, legend treatments, and zone insight panel states mapped to `/api/zones?includeAnalytics=true` payloads — explorer drawings updated with demand tiers, SLA metrics, and accessibility copy.
  2. ✅ Capture result card patterns for services & marketplace inventory with provider attribution, compliance disclosures, and CTA routing that mirrors Services blueprint guidance.
  3. ✅ Specify filter orchestration (keyword, type, zone, availability, category, demand), URL sync rules, telemetry events, and QA selectors so automation validates demand toggles, map clicks, and SLA announcements.
  4. 🚧 Outline booking wizard, chat entry points, and Flutter parity requirements leveraging the new explorer foundation — backlog entries recorded in change log/progress tracker; wireframes pending Flutter sync with follow-up work item logged against Task 4.2.
  5. 🚧 Produce accessibility validation checklist (MapLibre keyboard handling, aria-live for zone announcements, high-contrast legends) and schedule Stark/axe audits post booking wizard integration — draft checklist linked in backlog, awaiting audit scheduling once booking wizard specs land.

## Task 18 — Communications Suite & Notification Centre *(Status: ✅ Complete — 2025-10-22)*
- **Delivery Owner:** Communications UX Lead with Frontend Tech Lead, Mobile UX Lead, and Support Operations partner.
- **Evidence:** Communications workspace implementation (`frontend-reactjs/src/pages/Communications.jsx`, `frontend-reactjs/src/components/communications/*`, `frontend-reactjs/src/api/communicationsClient.js`), Flutter controller/tests (`flutter-phoneapp/lib/features/communications/**/*`, `flutter-phoneapp/test/features/communications/communications_controller_test.dart`), backend communications specs, updated design artefacts (`Design_Plan.md`, `Design_Change_log.md`, `Design_update_progress_tracker.md`), and drawings (`menu_drawings.md`, `dashboard_drawings.md`, `App_screens_drawings.md`).
- **Subtasks:**
  1. ✅ Blueprint React `/communications` layout covering thread rail, conversation canvas, AI assist sidebar, and persistent notification drawer referencing drawings and `component_functions.md` so enterprise/admin panels inherit consistent scaffolding.
  2. ✅ Document composer behaviour with AI assist toggle, prompt history, usage meter, attachment validation, and quiet-hour states in `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, and copy decks, aligning with Secrets Manager governance and compliance requirements.
  3. ✅ Map notification centre flows (polling cadence, quiet-hour batching, acknowledgement, escalation) in `Screens_Update_Logic_Flow.md` and `Function Design.md`, linking severity badges to `/api/communications` delivery receipts and operations runbook expectations.
  4. ✅ Capture Agora session launch UX, hardware permissions, lobby timers, and PSTN fallback interactions across web (`Function Design.md`) and Flutter (`Screens_Update_Logic_Flow.md`, communications controller tests) ensuring cross-channel parity and resilience.
  5. ✅ Catalogue telemetry, accessibility, and QA selectors (`communications.thread.view`, `communications.message.send`, aria-live announcements, focus traps, `data-qa` hooks) within design artefacts and progress tracker so automation, analytics, and support tooling validate communications behaviour end-to-end.

## Task 19 — Business Front & Role Dashboard Integration *(Status: ✅ Complete — 2025-10-23 — Cache resilience refreshed 2025-10-25)*
- **Delivery Owner:** Experience Platform UX Lead with Frontend Tech Lead, Provider Success Strategist, and Enterprise Ops partnership.
- **Evidence:** `frontend-reactjs/src/App.jsx`, `components/Header.jsx`, `pages/BusinessFront.jsx`, `ProviderDashboard.jsx`, `EnterprisePanel.jsx`, updated panel API client (`src/api/panelClient.js`), drawings (`website_drawings.md`, `dashboard_drawings.md`, `menu_drawings.md`, `App_screens_drawings.md`), and refreshed documentation (`Design_Plan.md`, `Design_Change_log.md`, `Design_update_progress_tracker.md`, `Design_update_milestone_list.md`). 2025-10-25 addendum captures cache-aware fallback banners, concierge storytelling, and QA selectors ensuring `/providers/:slug` renders during outages.
- **Subtasks:**
  1. ✅ Recompose navigation with dashboards mega-menu, hover/focus states, keyboard support, and mobile accordion behaviour aligning with drawings and accessibility notes.
  2. ✅ Map provider dashboard widgets (KPI tiles, bookings trend, inventory health, campaign analytics, compliance queues, fraud rail) to backend payloads, telemetry events, and QA selectors referenced in `Screens_Update.md` and `dashboard_drawings.md`.
  3. ✅ Document enterprise analytics panel layout (spend trend, provider leaderboard, rental exposure, upcoming visits) with status pills, aria-live alerts, localisation placeholders, and telemetry instrumentation for Task 5 analytics integration.
  4. ✅ Finalise business front storytelling (hero, testimonials, service packages, compliance badges, support channels) with fallback content, telemetry IDs, CTA/breadcrumb copy, and slug routing guidance tied to `/api/business-fronts/:slug`.
  5. ✅ Update change logs, progress trackers, and milestone commentary capturing RBAC guardrails, token/error patterns, localisation/accessibility follow-ups (Task 4.5), and Flutter parity dependencies (Task 4.2).

## Task 20 — Analytics Event Schema UX Alignment *(Status: ✅ Complete — 2025-10-24)*
- **Delivery Owner:** Data Experience Designer with Analytics Lead, Backend Analytics Engineer, and Communications UX Lead partnership.
- **Evidence:** Updated telemetry briefs, `Design_Plan.md` Section 34, `Design_Change_log.md` Entry 28, drawings (`dashboard_drawings.md`, `Admin_panel_drawings.md`, `App_screens_drawings.md`, `website_drawings.md`), and tracker entries (`Design_update_progress_tracker.md`, `Design_update_milestone_list.md`).
- **Subtasks:**
  1. ✅ Catalogue analytics events across zones, bookings, rentals, campaigns, and communications with telemetry IDs, trigger descriptions, and UI references embedded in `Screens_Update.md` and `Screens_Update_Logic_Flow.md`.
  2. ✅ Document metadata requirements (demand level, SLA expiry, assignment ID, inspection outcome, spend metrics, suppression reason) and tenant/actor derivation guidance so analytics/ops teams can validate instrumentation without backend spelunking.
  3. ✅ Update QA selectors, aria-live callouts, and automation notes adjacent to telemetry-triggering components in drawings to guarantee accessibility + regression coverage while emitting events.
  4. ✅ Align support copy, retention disclosures, and Looker modelling plan with the new `analytics_events` schema, capturing rehearsal cadence and backfill steps in telemetry runbook + progress trackers.
  5. ✅ *(2025-10-26 addendum)* Layered warehouse ingestion dashboards, retry/purge swim lanes, and quiet-hour suppression insight widgets into `dashboard_drawings.md`, `Screens_Update.md`, and `Design_Plan.md`, ensuring design artefacts reflect ingestion governance and support escalation workflows enabled by the new analytics pipeline.

## Task 21 — Accessibility & Localisation Hardening *(Status: ✅ Complete — 2025-10-27)*
- **Delivery Owner:** Experience Platform UX Lead with Accessibility SME, Localisation Producer, and Frontend Tech Lead partnership.
- **Evidence:** `Design_Plan.md` Section 35, `Design_Change_log.md` Entry 25, drawings (`website_drawings.md`, `menu_drawings.md`, `dashboard_drawings.md`, `App_screens_drawings.md`), localisation copy decks referenced in `Screens_Update.md` & `Screens_Update_Logic_Flow.md`, and refreshed trackers/milestones capturing QA/performance guardrails.
- **Subtasks:**
  1. ✅ Document `LocaleProvider` contract (available locales, persistence precedence, analytics hooks, graceful fallback) and propagate into design artefacts so React/Flutter implementations align on behaviour.
  2. ✅ Annotate header/footer navigation, dashboards mega-menu, and business front hero sections with skip-link focus order, language selector placement, bilingual copy, and compliance messaging referencing drawings and update plans.
  3. ✅ Capture dashboard/business front widget translations (KPI tiles, alerts, concierge modules) with Intl formatting guidance and aria-live refresh banners to safeguard WCAG 2.2 AA during Suspense/loading states.
  4. ✅ Update QA selectors, pseudo-locale stress scripts, translation cache invalidation checklist, and performance guardrails within `Design_update_progress_tracker.md`, `Design_update_milestone_list.md`, and `Design_update_task_list.md` to keep localisation accessibility sign-off auditable before Milestone M4 closure.

## Task 22 — Analytics Pipeline Control Console UX *(Status: ✅ Complete — 2025-10-28)*
- **Delivery Owner:** Data Experience Designer with Analytics Ops Lead, Support Ops Manager, and Backend Analytics Engineer partnership.
- **Evidence:** `Design_Plan.md` Section 36, `Design_Change_log.md` Entry 26, updated artefacts (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Design_Task_Plan_Upgrade/Application_Design_Update_Plan/Screens_Update.md`, `Design_Task_Plan_Upgrade/Web_Application_Design_Update/Dashboard Designs.md`), drawings (`Admin_panel_drawings.md`, `dashboard_drawings.md`), and tracker updates across `Design_update_progress_tracker.md` & `Design_update_milestone_list.md`.
- **Subtasks:**
  1. ✅ Blueprint analytics pipeline status card and telemetry widgets mapping `/api/analytics/pipeline` metrics (status, backlog, oldest pending, next retry, failure streak) with severity badges, compliance copy, and QA selectors for automation.
  2. ✅ Define pause/resume modal UX capturing actor, role, ticket ID, justification, expected duration, and acknowledgement toggles; embed telemetry schema (`analytics.pipeline.control`) and runbook links ensuring audit readiness.
  3. ✅ Document run history table + detail drawer mirroring `AnalyticsPipelineRun` schema (processed/purged counts, duration, status, response excerpt) with accessibility guidance (sticky headers, keyboard navigation, live region updates) and export CTAs.
  4. ✅ Update cross-channel artefacts noting staging read-only behaviour, Secrets Manager fallback messaging, Flutter parity backlog, and migration dependency `20250225000000-create-analytics-pipeline-runs.js`, keeping ops/support/legal alignment explicit in trackers.

