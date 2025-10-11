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

