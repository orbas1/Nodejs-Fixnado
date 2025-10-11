# Design Change Log — Version 1.00 UI/UX Update

## Summary
The Version 1.00 UI/UX refresh synthesises insights from the **Application Design Update** and **Web Application Design Update** workstreams. This change log documents major adjustments to visual language, layout, component behaviour, and supporting artefacts to ensure a reliable audit trail for future releases.

## Change Index
| Area | Description of Change | Source References | Impact |
| --- | --- | --- | --- |
| Design System Foundations | Unified colour tokens, typography scale, spacing ramp, and elevation layers across mobile, provider, and web experiences. Consolidated duplicated palettes from `Colours.md`, `Screen_update_Screen_colours.md`, and `colours.md` into a shared theme architecture with light/dark and "emo" stylistic variations. | Colours, Fonts, Colours (web), Stylings | Establishes consistent brand perception, reduces theme drift, and prepares for theme toggling. |
| Layout & Structure | Updated page- and screen-level grids using new layout specifications defined in `Organisation_and_positions.md`, `Placement.md`, and `Pages_list.md`. Introduced responsive breakpoints that align provider and web dashboards while respecting native constraints. | Organisation_and_positions (app & web), Placement, Pages_list | Improves visual hierarchy and alignment, decreases layout regressions between channels. |
| Navigation & Menus | Reworked navigation menus (`Menus.md`, `Settings.md`, `Settings Dashboard.md`) with prioritised information scent, action grouping, and persistent state indicators. Added quick-actions toolbar for high-frequency provider tasks. | Menus (app & web), Settings (app & web) | Enhances task completion speed, clarifies IA for multi-role users. |
| Component Catalogue | Rationalised button, card, form, and widget variants (`Buttons.md`, `Cards.md`, `Forms.md`, `Screens__Update_widget_types.md`). Deprecated redundant widget styles, introduced status-aware card frames, mapped widget behaviours to states, and delivered production React implementations captured in `frontend-reactjs/src/components/ui` and `frontend-reactjs/src/components/widgets`. | Cards, Buttons, Forms, Widget Types, component_catalogue_expansion.md | Reduces engineering complexity, improves accessible affordances, and accelerates engineering handoff. |
| Theme & Personalisation Toolkit | Introduced Theme Studio, ThemeProvider context, and multi-theme token exports aligning light, dark, and emo palettes with marketing modules. Embedded density/contrast personalisation and telemetry instrumentation. | theme_personalisation_toolkit.md, frontend-reactjs/src/pages/ThemeStudio.jsx, frontend-reactjs/src/styles.css | Enables governed theme switching, accessibility overrides, and marketing experimentation with analytics traceability. |
| Validation & Handoff Playbook | Authored cross-screen validation checklists, QA cadence, and handoff inventory. Added aria-live announcer and QA selectors to Theme Studio with supporting assets for automation teams. | design_validation_and_handoff.md, frontend-reactjs/src/pages/ThemeStudio.jsx, docs/design/handoff/* | Ensures accessibility/compliance sign-off, de-risks QA automation, and accelerates engineering onboarding ahead of launch. |
| Data Visualisation | Defined dashboard module styling (`Dashboard Designs.md`, `Dashboard Organisation.md`) with refreshed chart colours, tooltip treatments, and anomaly surfacing patterns. Added animated loading skeletons to reduce perceived latency. | Dashboard Designs, Dashboard Organisation | Improves interpretability of analytics and resilience to slow data responses. |
| Telemetry Dashboard | Operationalised UI preference telemetry console with KPI cards, trend widgets, and adoption breakdown modules referencing `telemetry_dashboard_enablement.md` and admin dashboard enhancements. | Telemetry dashboard docs, AdminDashboard.jsx, TelemetryDashboard.jsx | Provides governed analytics visibility and readiness for Looker dashboards. |
| Telemetry Alerting & Snapshots | Added background alerting pipeline, Slack messaging, and Looker snapshot persistence to govern telemetry health and downstream analytics feeds. | telemetry_alerting_enablement.md, backend telemetry job/model, telemetry runbook | Ensures operational teams receive timely alerts and BI tooling consumes governed datasets. |
| Telemetry Diagnostics & Governance | Extended snapshots endpoint with theme/staleness filters, aggregate stats, and diagnostics workflow documentation to support analytics rehearsals. | telemetry_dashboard_enablement.md, docs/telemetry/ui-preference-dashboard.md, backend telemetry services | Enables data engineering and ops teams to validate freshness SLAs and coverage without direct database access. |
| Content & Messaging | Refined copy tone hierarchy from `Screen_text.md`, `text.md.md`, and `Home page text.md`. Added templated microcopy for error states and guided onboarding flows aligned with compliance requirements. | Screen_text, text.md.md, Home page text | Drives consistent voice and regulatory clarity. |
| Imagery & Illustration | Curated imagery specifications (`Screens_update_images_and_vectors.md`, `images_and _vectors.md`, `Home page images.md`) to support inclusive representation and performance budgets. Implemented vector-first approach with fallbacks for offline caching. | Image/vector documents | Improves accessibility and load performance across devices. |
| Logic & Interaction | Harmonised logic flow artefacts (`Logic_Flow_update.md`, `Screens_Update_Logic_Flow.md`) to map cross-platform journeys, introducing guard-rails for security-critical paths and conditional theming triggers. | Logic Flow documents | Reduces behavioural inconsistencies and surfaces security checkpoints earlier in the experience. |
| Geo-Zonal & Booking Workflows | Synced backend booking/zone delivery with explorer overlays, booking wizard states, and finance disclosures defined in `dashboard_drawings.md`, `admin_panel_drawings.md`, `menu_drawings.md`, and `app_screens_drawings.md`. | Drawings + Application/Web design update plans | Ensures service orchestration matches UX blueprints, preserving compliance messaging and analytics instrumentation. |
| New / Adjusted Pages | Added dedicated theme configuration screen, "emo" theme preview, and modular home-page hero variants as described in `Home Page Organisations.md`, `Home page components.md`, and `Pages_list.md`. | Home page documentation, Pages_list | Enables marketing experimentation, personalisation, and theme testing. |
| Compliance & QA Artefacts | Embedded accessibility and compliance checkpoints throughout design documentation, aligning with `Compliance Grade` tracking and `Test Grade` expectations. Added spec handoffs for QA in `Screens_Update_Plan.md`. | Screens_Update_Plan, Compliance criteria | Strengthens traceability and audit readiness. |
| Compliance Evidence Refresh | Linked DPIA, RBAC minutes, and security baseline documentation to design artefacts for consent messaging, redacted UI states, and telemetry disclosures. | docs/compliance/dpia.md, docs/compliance/rbac_review_minutes.md, docs/compliance/security_baseline.md | Keeps regulator evidence, UI copy, and admin signalling in sync across web and mobile experiences. |
| Core Page Blueprints | Rebuilt home, admin dashboard, provider profile, and services marketing layouts in React using shared blueprint primitives (`PageHeader`, `BlueprintSection`). Documented in `ui-ux_updates/core_page_blueprints.md`. | Home.jsx, AdminDashboard.jsx, Profile.jsx, Services.jsx | Aligns IA with compliance overlays, boosts conversion signals, and formalises instrumentation hooks. |
| Marketplace Inventory & Monetisation | Codified provider inventory console, rental lifecycle detail screens, insured seller badge workflows, and campaign pacing dashboards across mobile and web specifications. | Screens_Update.md, Screens_Update_Logic_Flow.md, Settings.md, Dashboard Designs.md, Settings Dashboard.md | Ensures backend marketplace services plug into UI with actionable alerts, governed copy, and analytics instrumentation. |
| Inventory Ledger & Reconciliation (2025-10-16) | Captured provider/admin ledger widgets, reconciliation flows, alert acknowledgement UI, and analytics hooks consuming `/api/inventory` services. | Screens_Update.md, Screens_Update_Logic_Flow.md, Dashboard Designs.md, Admin_panel_drawings.md, dashboard_drawings.md | Aligns UI with ledger service behaviour so teams monitor stock posture, resolve alerts, and evidence audits. |
| Rental Lifecycle Experience (2025-10-17) | Documented rental agreement hubs, inspection checklists, deposit handling, dispute escalation, and settlement dashboards wired to `/api/rentals` + `/api/inventory` orchestration. | Screens_Update.md, Screens_Update_Logic_Flow.md, Dashboard Designs.md, Admin_panel_drawings.md, App_screens_drawings.md | Ensures rental approvals, inspections, and settlements expose compliance copy, telemetry hooks, and alert governance across provider/admin channels. |
| CI/CD & Rollback Enablement | Captured Build/Test/Scan workflow gates, release packaging artefacts, security audits, and rollback playbook alignment so design QA remains coupled to deployment governance. | build-test-and-scan workflow, release-artifacts workflow, scripts/security-audit.mjs, docs/operations/rollback-playbook.md | Embeds design validation into CI/CD, shortens rollback response time, and improves auditability. |
| Campaign Manager Targeting, Pacing & Billing (2025-10-19) | Added campaign workspace, targeting composer, pacing analytics, and billing drawer specs aligned to `/api/campaigns` services with overspend/invoice governance. | Screens_Update.md, Screens_Update_Logic_Flow.md, Dashboard Designs.md, Admin_panel_drawings.md, dashboard_drawings.md, App_screens_drawings.md | Equips monetisation squads with production-ready UI flows for campaign management, finance reconciliation, and compliance messaging. |
| Campaign Analytics Telemetry & Fraud Monitoring (2025-10-20) | Documented warehouse export outbox states, fraud signal alerts, and anomaly triage panels across admin/provider/mobile experiences, wiring copy to new analytics/fraud APIs. | Screens_Update.md, Screens_Update_Logic_Flow.md, Dashboard Designs.md, Admin_panel_drawings.md, dashboard_drawings.md, App_screens_drawings.md | Enables operations, finance, and fraud teams to monitor campaign health, resolve anomalies, and audit analytics exports with governed UI patterns. |
| Explorer Search & Zone Intelligence (2025-10-21) | Updated explorer specs with MapLibre overlays, demand-aware filtering, SLA insight panel, and marketplace/service segmentation aligned to `/api/search` and `/api/zones` contracts. | Screens_Update.md, Screens_Update_Logic_Flow.md, website_drawings.md, dashboard_drawings.md, frontend-reactjs/src/pages/Search.jsx | Delivers production discovery UX, surfaces compliance telemetry, and prepares Flutter parity + booking wizard integration. |

## Detailed Log Entries
### 1. System-wide Foundations
- **Tokens Normalisation:** Consolidated colour, spacing, typography, and elevation definitions into a master token table for cross-platform consumption.
- **Canonical Naming:** 2025-01-28 update established the `fx.{category}.{sub-system}.{variant}` taxonomy documented in `ui-ux_updates/design_foundations_alignment.md`, with automated exports to JSON, SCSS, and Flutter packages replacing historic aliases.
- **Accessibility Matrix:** Added validated contrast ratios with prescribed mitigations for sub-AA pairings; QA and engineering runbooks updated accordingly.
- **Theme Variants:** Introduced light, dark, and emo-inspired palettes with parameterised mood toggles and guardrails for contrast ratios.
- **Asset Pipeline:** Updated dummy data, assets, and resource references to ensure multi-environment parity and offline compatibility.

### 2. Page & Navigation Structure
- Re-mapped landing, dashboard, and profile experiences using revised grid specs for mobile and web.
- Added persistent breadcrumbs and multi-step progress trackers for onboarding and provider workflows.
- Simplified settings and profile navigation, merging redundant tabs and introducing quick search.

### 3. Component & Widget Updates
- Defined canonical button states (default, hover, focus, disabled, destructive) with accessible contrast.
- Standardised card layout for analytics, tasks, and alerts, with responsive stacking rules.
- Rebuilt form patterns to include inline validation, helper text tokens, and error summarisation.
- Documented widget behaviours in tables correlating to data states and user roles.

### 4. Content, Imagery, and Motion
- Refreshed textual hierarchy to emphasise user guidance and compliance messaging.
- Adopted illustration guidelines emphasising inclusivity and quick load times.
- Introduced micro-interactions (hover, press, loading) to emphasise discoverability without overwhelming users.

### 5. Security & Compliance Enhancements
- Added security prompts for privileged actions in flows (2FA, provider approvals).
- Documented compliance checkpoints for regional privacy requirements and audit logging.
- Embedded QA traceability matrix linking screens to regulatory controls.

### 6. Implementation Support
- Added design-to-dev handoff package with annotated Figma frames, CSS/SCSS token exports, and component story references.
- Created regression testing checklist for design-specific automated tests and manual QA sign-off.

### 7. Theme & Personalisation Enablement (2025-01-31)
- Delivered theme management interface with Standard, Dark, and Emo previews, density/contrast toggles, and marketing module prototypes.
- Documented palette tokens, imagery guidelines, telemetry, and rollout plan in `ui-ux_updates/theme_personalisation_toolkit.md`.
- Instrumented DOM/DataLayer/beacon telemetry to feed `kafka.ui-preferences.v1` and updated trackers marking DT4 complete.

### 8. Validation, QA, and Handoff (2025-02-01)
- Produced `design_validation_and_handoff.md` consolidating accessibility/compliance/security checklists across web and mobile blueprints with QA ownership.
- Added `PreferenceChangeAnnouncer` aria-live utility and deterministic `data-qa` selectors to Theme Studio, supporting assistive tech and automation reliability.
- Exported validation assets (`fx-theme-preferences.json`, `ui-qa-scenarios.csv`) to handoff bundle, ensuring telemetry schemas and QA scripts remain version-controlled.

### 9. Telemetry Ingestion & Analytics (2025-02-02)
- Partnered with data engineering to deploy the UI preference telemetry ingestion stack, adding persistent storage (`ui_preference_telemetry`), hashed IP governance, and correlation identifiers for downstream reconciliation.
- Enhanced Theme Studio instrumentation via `utils/telemetry.js` to enrich beacons with tenant, role, locale, and correlation metadata alongside fetch fallbacks for environments without `sendBeacon` support.
- Authored analytics runbook `docs/telemetry/ui-preference-dashboard.md` and expanded QA scenarios to include ingestion verification, unblocking Looker dashboard build-out and monitoring SLAs.

### 10. Telemetry Dashboard Operationalisation (2025-02-03)
- Delivered `/admin/telemetry` console with KPI cards, trend visualisation, and adoption breakdowns mapped to dashboard drawings and token palette guidance.
- Implemented `useTelemetrySummary` hook handling fetch orchestration, auto-refresh/visibility pausing, and CSV export enabling analytics backfill validation.
- Documented workflows, QA selectors, and developer sample dataset support via `ui-ux_updates/telemetry_dashboard_enablement.md`, updated runbook guidance, and extended QA scenarios.

### 11. Telemetry Alerting & Looker Snapshots (2025-02-04)
- Deployed background alerting job with configurable thresholds, Slack webhook integration, and repeat suppression to enforce telemetry freshness SLAs and emo adoption monitoring.
- Introduced `UiPreferenceTelemetrySnapshot` persistence so Looker dashboards can query governed, timestamped summaries without hitting live APIs; payload JSON preserves breakdown fidelity.
- Updated runbook (`docs/telemetry/ui-preference-dashboard.md`), QA scenarios, and trackers to cover alert rehearsal steps, environment variables, and escalation policy for ops/design/data teams.

### 12. Telemetry Snapshot Distribution Enablement (2025-02-05)
- Delivered `/api/telemetry/ui-preferences/snapshots` with cursor-based pagination so Looker and downstream BI tooling can ingest governed telemetry summaries without direct database connectivity.
- Refreshed telemetry runbook and QA assets (including `docs/design/handoff/ui-qa-scenarios.csv`) with ingestion guidance, cursor handling, and rehearsal steps for analytics/ops teams ahead of the 12 Feb readiness review.
- Updated programme trackers, design plan, and change logs to mark analytics distribution readiness and focus subsequent work on tenant segmentation and Chromatic baseline automation.

### 13. Telemetry Snapshot Diagnostics & Data Quality (2025-02-06)
- Augmented snapshots endpoint with `leadingTheme`, `staleMinutesGte`, `staleMinutesLte`, and boolean stats toggle so analytics can isolate stale windows, confirm tenant coverage, and script governance queries without SQL migrations.
- Added aggregate statistics (`stats.freshness`, tenant/range/theme breakdowns, share min/avg/max) with freshness threshold overrides to support rehearsal SLAs and Looker ingestion observability.
- Updated telemetry runbook and QA scenarios to capture diagnostics workflow, ensuring ops/design/data rehearse stats validation before the analytics readiness drill.

### 14. Theme & Telemetry Regression Automation (2025-02-09)
- Authored Vitest + Testing Library harness for `ThemeProvider` verifying DOM dataset updates, event broadcasting, telemetry beacons, and storage persistence so design instrumentation remains audit-ready.
- Captured automation uplift across `test_plan.md`, trackers, and design docs to evidence Subtask 6.2 completion and surface telemetry regression assertions for QA and analytics squads.
- Coordinated Flutter widget coverage for live feed banners, mapping design intent (priority indicators, empty/loading states) into deterministic tests referenced by design QA artefacts.

### 15. Issue Intake & Design QA Alignment (2025-10-11)
- Linked design QA governance to the new issue intake automation: `scripts/issue-intake.mjs` ingests structured defects and republishes SLA dashboards so design ops can track visual/accessibility regressions alongside backend blockers.
- Seeded tracker with authentication UX blocker (React forms) and backend flows impacting design intent; remediation guidance now references `Application_Design_Update` auth specifications and blueprint IDs for cross-team traceability.
- Updated design plans, progress trackers, and milestone notes to ensure issue SLA breaches trigger design council reviews and escalate through the same governance cadence as telemetry and theming workstreams.

### 16. Mobilisation Governance Integration (2025-10-12)
- Published `task1_mobilisation_raci_roadmap.md`, formalising design accountability within the programme RACI and mapping blueprint ownership to geo-zonal, booking, marketplace, communications, and analytics squads.
- Embedded mobilisation roadmap checkpoints that call for design artefact refreshes (drawings, telemetry dashboards, blueprint walkthroughs) across Weeks 0–14, ensuring design deliverables feature in weekly control board reviews.
- Captured dependency/compliance gates (accessibility audits, localisation QA, Stark/Chromatic capture) in the shared matrix so design risks surface alongside engineering dependencies within the tracker commentary.

### 17. Feature Toggle Governance (2025-10-13)
- Documented Secrets Manager feature toggle manifests with owner/ticket metadata so design squads can map pilots to blueprint IDs and drawings (`dashboard_drawings.md`, `website_drawings.md`, `App_screens_drawings.md`).
- Coordinated with engineering on `/api/admin/feature-toggles` endpoints powering forthcoming admin rollout UI; design QA will extend settings dashboards to visualise rollout and audit history.
- Scheduled environment parity checks in the design QA cadence to guarantee staging demos mirror production toggle states before approvals.

### 18. CI/CD & Rollback Enablement (2025-10-14)
- Embedded Build/Test/Scan workflow into design governance so Theme Studio, Telemetry dashboard, and Flutter parity tests run on every PR alongside gitleaks and dependency audits executed via `scripts/security-audit.mjs`.
- Release Packaging workflow now publishes backend/frontend/Flutter artefacts plus checksum manifest; design ops reference the manifest during Chromatic captures and accessibility sign-off to verify build integrity.
- Authored `docs/operations/rollback-playbook.md` outlining rollback triggers, validation steps, and communication cadence so design council participation is codified in incident response.

### 19. Compliance Evidence Integration (2025-10-15)
- Refreshed `docs/compliance/dpia.md` with explicit references to design drawings, consent prompts, telemetry disclosures, and retention messaging so UI copy aligns with regulator-facing documentation.
- Recorded RBAC review decisions around redacted provider addresses, dispute transcript export warnings, and JIT access banners; design backlog updated with corresponding UI/UX actions and tracked in `Design_update_task_list.md` Task 11.
- Updated security baseline to highlight telemetry dashboard disclosures, support article linkage, and Secrets Manager TTL alert badges that design must incorporate into admin experience updates.
- Synchronised trackers (Design plan, milestone list, progress tracker) to ensure compliance follow-up actions surface in design council agendas and future accessibility/legal walkthroughs.

### 20. Inventory Ledger & Reconciliation Experience (2025-10-16)
- **Provider Inventory Console:** Added three-state ledger widgets (healthy, warning, critical) that render on-hand/reserved/damaged balances, auto-reconciled variance, and next scheduled count. Widgets source `/api/inventory/health` response keys and surface quick actions for cycle count, adjustment, and ledger drill-down consistent with `dashboard_drawings.md` layouts.
- **Alert Lifecycle UI:** Authored content design for low-stock, stale adjustment, and reconciliation failure alerts leveraging `inventoryAlerts` severity levels. Copy instructs providers to restock, submit variance notes, or escalate to finance; acknowledgement flow records user, timestamp, and optional comment inline with backend API contract.
- **Ledger Drill-down Drawer:** Defined table schema for transaction history including filters for `type`, `correlationId`, `performedBy`, and date ranges. Drawer supports export with watermark, sticky totals, and an "Investigate variance" CTA linking to reconciliation sheet when imbalance exceeds `INVENTORY_LOW_STOCK_BUFFER`.
- **Reconciliation Sheet:** Documented modal workflow capturing count method, expected vs actual units, variance justification, attachments, and follow-up tasks. Submission calls `/api/inventory/{inventoryId}/reconcile` and surfaces toast plus audit log entry for compliance review.
- **Analytics & Telemetry Hooks:** Specified events (`inventory.health.view`, `inventory.alert.acknowledge`, `inventory.ledger.export`, `inventory.reconciliation.submit`) with payload requirements (inventoryId, varianceDelta, alertSeverity, acknowledgementLatencyMs) so analytics dashboards can trend adoption, variance rate, and MTTA.
- **Cross-channel Alignment:** Updated `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, and `Dashboard Designs.md` with state diagrams, copy decks, and data bindings referencing `Admin_panel_drawings.md`, `dashboard_drawings.md`, and `App_screens_drawings.md` to keep provider mobile, admin web, and finance review panels aligned on ledger workflows.

### 21. Rental Lifecycle Experience (2025-10-17)
- **Agreement Hub:** Added rental agreement board with columns (Requested, Approved, Checked-out, Inspection, Settled, Cancelled) exposing deposit balance, scheduled pickup/return, outstanding checkpoints, and insured seller status. Cards map to `/api/rentals` payload keys and expose quick actions for approve, reject, request docs, or open inspection.
- **Checkout & Return Flows:** Documented modals for checkout (signature capture, condition notes) and return (partial + full) that trigger reservation release, deposit adjustments, and alert updates. Forms include accessibility copy, error messaging, and telemetry events `rental.checkout.complete` and `rental.return.submit`.
- **Inspection Workbench:** Defined inspection drawer capturing checkpoint checklist, damage classification, photo upload, variance vs deposit comparisons, and escalation toggles. UI integrates ledger snapshot preview and auto-suggested resolution actions (charge deposit, request repair, escalate dispute).
- **Settlement & Disputes:** Settlement modal summarises fees, deposit returns, outstanding damages, and ledger reconciliation tasks. Escalation path surfaces compliance copy referencing DPIA retention and finance escalation instructions. Dashboards now show dispute queue metrics fed by rental checkpoints.
- **Alert Integration:** Rental overdue or disputed states raise alerts within existing inventory rail using severity-coded copy. Snooze/acknowledge flows feed both rental + inventory audit trails, ensuring MTTA reporting remains unified.
- **Cross-channel & QA:** Provider mobile and admin web flows share component specs for agreement details, inspection queue filters, and settlement forms. QA selectors, aria-live notes, and telemetry payload requirements embedded to support automation and analytics instrumentation.

### 22. Insured Seller Compliance & Moderation Experience (2025-10-18)
- **Badge Manager Card:** Documented provider dashboard card (refer `Screens_Update.md` Section 7.2.1, `dashboard_drawings.md`) showing insured seller countdown, renewal reminders, policy document shortcuts, and toggle to control storefront badge visibility. Copy references SLA windows, legal disclaimers, and compliance support CTAs.
- **Compliance Queue Panels:** Added admin/provider compliance queue layouts listing document status (submitted, under review, approved, rejected, expired) with filters, review action buttons, and audit metadata chips; aligns to `/api/compliance` payloads and includes error/empty states for document expiry and suspension messaging.
- **Marketplace Moderation Drawer:** Specified moderation workflow for listings (approve, reject, suspend) with compliance snapshot sidebar (expiry date, score, outstanding docs), decision rationale fields, and downstream alerts to legal/marketing teams. Drawer references new moderation queue API contract and integrates quick links to provider badge manager.
- **Feed Compliance Indicators:** Updated marketplace cards (web + mobile) to surface insured badge, compliance hold tooltips, and "Temporarily hidden" state for expired/suspended sellers. Microcopy, iconography, and analytics events (`marketplace.listing.appeared`, `marketplace.listing.onHold`) captured for instrumentation.
- **Knowledge Base & Support Touchpoints:** Added inline help links and overlays guiding providers through document upload requirements, acceptable file formats, review timelines, and escalation channels; cross-linked to upcoming support articles per update plan.
- **QA & Accessibility:** Documented aria-live announcements for moderation outcomes, focus management for review modal actions, QA selectors for toggles/buttons, and telemetry fields capturing reviewer IDs and decisions so automation and analytics mirror new backend contracts.

### 23. Campaign Manager Targeting, Pacing & Billing (2025-10-19)
- **Workspace & Builder:** `Screens_Update.md` now details campaign list, detail, and creation flows with state diagrams tied to `dashboard_drawings.md`, `Admin_panel_drawings.md`, and `website_drawings.md`. Cards highlight pacing badge, spend vs budget bar, flight window, and outstanding invoice chips so monetisation teams can triage campaigns quickly.
- **Targeting Composer:** Added chip-based targeting editor covering geography radius, category packs, slot types, and audience segments. Spec outlines validation errors, helper copy, preset management, and instrumentation to respect backend targeting caps and insured seller gating.
- **Flight Timeline & Overspend States:** Documented timeline component with flight segments, daily/total budget badges, and overspend pause/resume states. Tooltip copy explains automatic pauses triggered by overspend multiplier and manual resume workflow, aligning UI signals with backend governance.
- **Pacing Analytics:** Dashboard widget plots actual vs planned spend with forecast, delivery ratio, and segmentation filters; includes CSV export, loading skeletons, and empty/error states plus telemetry events (`campaign.pacing.view`, `campaign.pacing.export`).
- **Billing Drawer & Invoice Governance:** Billing drawer spec enumerates invoice table columns, due date countdown badges, PDF download CTA, dispute/escalation buttons, and finance notes; copy references payment policy, late fee triggers, and escalation channels documented in finance runbook.
- **Accessibility & QA:** Focus order, keyboard shortcuts (`Ctrl+Enter` add targeting rule, `Shift+P` pause campaign), aria-live pacing alerts, and `data-qa` selectors enumerated for automation and assistive tech. Telemetry schema lists `campaign.create.submit`, `campaign.targeting.add`, `campaign.invoice.pay`, `campaign.status.pause_auto` payload requirements for analytics/fraud monitoring.
- **Cross-channel Alignment:** Provider mobile drawings in `App_screens_drawings.md` mirror pacing badges and invoice chips while responsive guidance defines how tablets/desktop present pacing timeline + billing drawer via tab/accordion patterns. Knowledge base callouts keep compliance copy consistent across channels.

### 24. Campaign Analytics Telemetry & Fraud Monitoring (2025-10-20)
- **Analytics Export Status:** Added outbox status widgets (Pending, Sent, Failed) with retry countdowns and error copy referencing warehouse endpoint configuration. Specs in `Screens_Update.md` and `Dashboard Designs.md` map to `campaign_analytics_export` payloads, highlight API key alerts, and expose download JSON actions for data engineering triage.
- **Fraud Signal Triage:** Documented anomaly rail showing overspend, underspend, suspicious CTR/CVR, delivery gap, and no-spend badges with severity chips, trend sparkline, and "resolve" workflow capturing remediation notes and SLA countdowns. Interactions mirror `/api/campaigns/:id/fraud-signals` and resolution endpoints.
- **Summary KPI Cards:** Updated dashboard hero metrics to include ROI, conversion rate, net spend delta, and open anomaly count sourced from new summary endpoint. Copy provides tooltip definitions and escalation prompts for finance/fraud ops.
- **Notifications & Mobile Views:** Provider/admin mobile designs in `App_screens_drawings.md` now surface push badge states and condensed anomaly cards; email/Slack template copy added to `Screens_Update_Logic_Flow.md` for exporter failure + critical anomaly alerts.
- **Telemetry & QA Hooks:** Defined events (`campaign.analytics.export.retry`, `campaign.fraud.resolve`, `campaign.summary.view`) with payload requirements so analytics dashboards and fraud ops metrics remain governed. QA selectors and accessibility notes ensure screen reader announcements for anomaly resolution and export failure states.

## Open Questions & Follow-ups
- Validate colour token accessibility in upcoming usability study across low-vision participants.
- Confirm analytics tracking coverage for new theme toggles, personalised home variants, and telemetry dashboard interactions.
- Finalise Looker dashboard rollout using snapshot table, rehearse Slack alert channel, and deliver Chromatic/axe automation for Theme Studio + telemetry screens.
- Evaluate additional "emo" theme presets and seasonal variants after initial release metrics.
- Monitor performance impact of new imagery pipeline under constrained networks.
- Schedule explorer booking wizard integration, chat entry points, and Flutter parity to leverage the new zoning foundation while preserving telemetry and QA coverage.

## Approval History
| Date | Stakeholders | Status | Notes |
| --- | --- | --- | --- |
| 2025-01-17 | Lead Product Designer, UX Research, Engineering Lead | Approved | Foundation tokens & navigation structure locked. |
| 2025-01-22 | Compliance Officer, Security Architect | Approved | Security prompts and compliance checkpoints validated. |
| 2025-01-24 | Marketing Lead, Content Strategist | Conditional | Additional "emo" presets requested for Q2 experiment. |
| 2025-01-27 | QA Lead | In Progress | Pending validation of QA artefact alignment with automated tests. |


### 25. Explorer Search & Zone Intelligence (2025-10-21)
- **Map-first Layout:** Explorer layout adopts sticky 60/40 grid, MapLibre overlays, and legend treatments described in `website_drawings.md`/`dashboard_drawings.md`. Zones colour-code demand tiers and expose analytics summaries (open bookings, SLA breaches, match counts) referencing `/api/zones?includeAnalytics=true` payload fields.
- **Filter Governance:** Documented keyword, type, zone, availability, category, and demand filters with URL parameter persistence, telemetry hooks, and compliance copy (retention, consent). Specs updated in `Screens_Update.md` and `Screens_Update_Logic_Flow.md` to keep React + Flutter parity aligned.
- **Result Cards & Insight Panel:** Service and marketplace cards leverage shared UI tokens, provider attribution, and CTA routes mapped to Services marketing blueprint. Zone insight panel centralises SLA stats, demand signals, and coverage bounds while referencing DPIA copy requirements.
- **Operations & QA Hooks:** Added geometry-normalisation notes, QA selectors, and Vitest coverage references to ensure MapLibre overlays and filtering remain deterministic across SQLite/PostGIS. Logged backlog items for booking wizard integration, communications stack entry points, and mobile parity in upcoming Task 4 subtasks, with design change log/table updates linking to the refreshed explorer artefacts.
