# Design Plan — Version 1.00 UI/UX Update

## 1. Vision & Objectives
- **Unify cross-platform experience:** Align native application, provider portal, and web application visuals around a shared design language while preserving platform idioms.
- **Enable rapid theming:** Support standard, dark, and "emo" thematic expressions through configurable tokens and modular layout building blocks.
- **Elevate usability & compliance:** Improve navigation clarity, accessibility conformance (WCAG 2.2 AA+), and security transparency across sensitive workflows.
- **Future-proof extensibility:** Structure assets, components, and content templates to support emerging modules, partial page injections, and dynamic marketing surfaces.

## 2. Research Inputs & Insights
- **Artefact review:** Synthesised requirements from `Application_Design_Update.md`, `Web Application Design Update.md`, and supporting documents across menus, screens, cards, and logic flows.
- **Stakeholder interviews:** Captured feedback from product, support, marketing, compliance, and engineering groups to prioritise pain points such as dashboard overload, inconsistent forms, and insufficient theme controls.
- **User behaviour data:** Analysed funnel metrics and usability test notes highlighting navigation confusion, textual ambiguity, and low contrast issues in provider dashboards.

## 3. Experience Architecture
### 3.1 Information Architecture
- Consolidated navigation into three primary pillars: **Home & Insights**, **Operations & Tasks**, and **Account & Compliance**.
- Introduced contextual quick-action trays for provider workflows, accessible from both desktop and mobile.
- Added breadcrumbs and progress trackers for multi-step flows (onboarding, verification, claim submission).

### 3.2 Layout Grid & Responsive Rules
- Established 4/8/12 column grids for mobile, tablet, and desktop respectively with consistent gutter ratios.
- Defined breakpoint-specific adjustments for hero, card, and data-table modules to support partial page reuse.
- Documented safe-area and notch considerations for mobile header/footer placements.

### 3.3 Page & Screen Blueprints
- **Home Pages:** Modular hero band, KPI summary cards, and announcement panel supporting seasonal or theme-based swaps.
- **Dashboards:** Configurable widgets (analytics, alerts, tasks) with density controls and saved layouts per role.
- **Profile & Settings:** Two-column layout with persistent navigation rail and inline policy references.
- **Theme Management:** New settings screen enabling preview and activation of standard/dark/emo palettes plus accessibility overrides.

## 4. Visual Language
### 4.1 Colour System
- Core palette anchored in brand blues and neutrals with accent ramps for states (success, warning, error, info).
- Emo theme introduces deeper contrasts, neon accent edges, and gradient overlays while maintaining minimum contrast ratios.
- Token structure: `color.surface`, `color.text.primary`, `color.text.inverse`, `color.accent.<state>`, `color.background.alt`.

### 4.2 Typography
- Adopted variable font family with weight ranges 300–700 and fallback stacks per platform.
- Established typographic scale (Display, H1–H5, Body, Caption) with consistent line-height and letter-spacing rules.
- Introduced typographic motion guidelines for emphasised transitions (fade/slide for hero copy).

### 4.3 Imagery & Iconography
- Vector-first icons with consistent stroke weight and corner radius.
- Inclusive imagery representing diverse personas; leverage lazy-loading and responsive sources.
- Introduced new illustration style for onboarding sequences emphasising warmth and trust.

## 5. Interaction & Motion Principles
- Interaction states (hover, focus, pressed, disabled) defined for all interactive components with accessible feedback.
- Motion guidelines emphasise purposeful transitions under 250ms with easing curves matched across platforms.
- Added tactile micro-interactions (e.g., success confetti for milestone completion) limited to contexts with measurable engagement uplift.

## 6. Content Strategy
- Voice: confident, empathetic, and compliance-aware.
- Introduced templated copy blocks for alerts, onboarding steps, and policy disclosures.
- Standardised text casing, punctuation, and emoji usage (restricted to marketing modules, never in critical alerts).

## 7. Accessibility, Compliance & Security
- WCAG 2.2 AA compliance baseline with AAA for primary text/background combinations.
- Keyboard navigation and focus ordering documented for new layouts.
- Security prompts include rationale text and inline privacy references; design spec highlights audit logging placement.
- Added compliance checklist per screen covering consent capture, data minimisation, and record retention cues.

## 8. Technical Handoff & Tooling
- Exported design tokens to JSON for integration with SCSS/CSS modules and native styling libraries.
- Provided Storybook-ready component specs with state diagrams and responsiveness notes.
- Established annotation standards (component IDs, spacing, asset references) for engineer-friendly parsing.
- Linked logic-flow diagrams to backend contract expectations to reduce ambiguity during implementation.

## 9. Rollout Strategy
1. **Foundation Sprint (Week 1-2):** Finalise tokens, typography, and layout grids; update base components in design system libraries.
2. **Page Recomposition (Week 3-4):** Apply new system to critical pages (home, dashboard, settings) and iterate via weekly design reviews.
3. **Theme & Personalisation (Week 5):** Build theme toggles, emo preview, and marketing module variations.
4. **Validation & QA (Week 6):** Conduct accessibility audits, usability validation, and compliance review before final handoff.

## 10. Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Theming conflicts between legacy CSS/SCSS and new tokens | Medium | High | Audit legacy overrides, introduce linter rules, gradual rollout via feature flags. |
| Performance regressions from richer imagery | Medium | Medium | Enforce responsive image specs, leverage CDN with caching policies, lazy-load non-critical assets. |
| Compliance misalignment due to new copy | Low | High | Run legal review on templated copy, maintain versioned documentation. |
| Accessibility regressions in third-party widgets | Medium | High | Provide accessible wrappers, collaborate with vendors, schedule targeted QA sessions. |

## 11. Success Metrics
- **Adoption:** ≥90% of target screens migrated to new tokens before code freeze.
- **Usability:** 20% improvement in first-time task completion in usability testing.
- **Accessibility:** 0 critical accessibility defects at launch, ≤3 minor issues.
- **Performance:** Maintain ≥85 Lighthouse performance score on primary marketing pages post-update.
- **Support:** 30% reduction in navigation-related support tickets within first month.

## 12. Governance & Next Steps
- Weekly design council sync to track progress against milestones and address cross-team dependencies.
- Monthly audit of design documentation to ensure alignment with engineering implementation.
- Prepare backlog of future enhancements (additional emo variants, seasonal landing modules, personalization experiments) for subsequent releases.

## 13. Foundations Consolidation (Task DT1 Outcome)
- **Canonical Token Set**: Adopted the multi-platform taxonomy documented in `ui-ux_updates/design_foundations_alignment.md`, superseding historic Flutter (`fixnado.*`) and web (`--fixnado-color-*`) namespaces.
- **Accessibility Baseline**: Recorded verified contrast ratios and mitigation guidance inside the alignment doc; QA will reference this matrix during Pa11y and manual audits.
- **Export Automation**: Confirmed JSON, SCSS, and Flutter exports are generated from a single source of truth (`packages/design-tokens/dist/fx-tokens.v1.00.json`) with linting rules (`no-legacy-token`) to block regressions.
- **Adoption Governance**: Scheduled Sprint 3 migration checkpoints with Tech Leads and QA sign-off; compatibility exports decommissioned after Sprint 4 following review signoff logged in `Design_update_progress_tracker.md`.

## 14. Core Page Blueprint Recomposition (Task DT2 Progress)
- **Home & Discovery:** Implemented persona-led navigation clusters and modular blueprint sections in `frontend-reactjs/src/pages/Home.jsx`. Compliance overlays, localisation rollout status, and analytics instrumentation are surfaced directly in the layout, ensuring governance alignment.
- **Admin Dashboard:** Rebuilt `AdminDashboard.jsx` with breadcrumbed `PageHeader`, expanded operational metrics, compliance queue snapshots, and automation backlog visibility. Supports audit readiness via downloadable packs.
- **Provider Profile:** Updated `Profile.jsx` with structured meta, localisation coverage, compliance document expiries, and workflow blueprint to guide enterprise procurement teams.
- **Services & Marketing Hub:** Reauthored `Services.jsx` to showcase solution streams, marketing modules, and activation blueprint. Localisation and compliance guardrails are embedded to streamline marketing operations.
- **Shared Primitives:** Introduced `components/blueprints/PageHeader.jsx` and `components/blueprints/BlueprintSection.jsx` to enforce the recomposed 12-column grid, anchor IDs, and accessibility patterns across pages.

## 15. Component & Widget Catalogue Expansion (Task DT3 Outcome)
- **UI Primitives:** Delivered production-ready button, card, status pill, skeleton, segmented control, and text input components in `frontend-reactjs/src/components/ui`, each mapped to the token architecture defined in `design_foundations_alignment.md`.
- **Analytics Widgets:** Authored reusable `AnalyticsWidget`, `TrendChart`, `ComparisonBarChart`, `GaugeWidget`, and `MetricTile` modules in `frontend-reactjs/src/components/widgets` with accessibility-aware tooltips, target overlays, and motion profiles aligned to `component_types.md`.
- **Admin Dashboard Integration:** Upgraded `AdminDashboard.jsx` to exercise the new catalogue with real datasets (escrow trends, dispute mix, SLA gauge, compliance queue), ensuring production parity and telemetry coverage via `data-action` attributes.
- **Documentation:** Published `component_catalogue_expansion.md` capturing audit findings, regression checklist, and QA guidance for Storybook, Chromatic, accessibility, and performance validation.

## 16. Theme & Personalisation Enablement (Task DT4 Outcome)
- **Theme Studio Delivery:** Added `/admin/theme-studio` page implementing ThemeProvider context, persistent preferences, density/contrast toggles, and marketing module previews using production datasets.
- **Token Expansion:** Extended `styles.css` with theme-specific gradients, marketing surface variables, density overrides, and high-contrast focus tokens aligned to accessibility governance.
- **Documentation & Governance:** Authored `ui-ux_updates/theme_personalisation_toolkit.md` outlining palettes, imagery guardrails, telemetry schema, and rollout plan with marketing/legal checkpoints.
- **Telemetry & Rollout:** Instrumented DataLayer, DOM events, and beacon payloads feeding `kafka.ui-preferences.v1`; scheduled pilot/validation sessions (dark mode compliance, emo campaign review, personalisation usability study).

## 17. Validation, QA & Handoff (Task DT5 Outcome)
- **Cross-Screen Checklists:** `design_validation_and_handoff.md` maps accessibility, compliance, and security acceptance criteria to each high-priority screen, linking blueprint IDs, drawings, and telemetry hooks.
- **Automation & Accessibility Instrumentation:** Theme Studio now ships `PreferenceChangeAnnouncer` aria-live messaging and deterministic `data-qa` selectors, unlocking reliable Playwright/Chromatic scripts and improving assistive technology support.
- **Handoff Package:** Repository hosts version-controlled assets (`docs/design/handoff/fx-theme-preferences.json`, `ui-qa-scenarios.csv`) plus Figma/InVision references, giving engineering a single source for tokens, copy, and QA flows.
- **Governance Cadence:** QA/legal/marketing checkpoints scheduled (3–12 Feb) with action owners, ensuring audits, legal approvals, and usability studies occur before release gate; backlog seeds capture axe-core automation and telemetry dashboard follow-up.

## 18. Telemetry Ingestion Enablement (Post-DT5 Continuation)
- **API Delivery:** Built `/api/telemetry/ui-preferences` ingestion and `/summary` analytics endpoints with schema validation, hashed IP governance, and aggregation service to unblock telemetry dashboards.
- **Instrumentation Upgrade:** `utils/telemetry.js` enriches front-end beacons with tenant, role, locale, correlation, and user agent metadata while adding fetch fallbacks for environments lacking `sendBeacon` support.
- **Operational Playbook:** Authored `docs/telemetry/ui-preference-dashboard.md` covering API contracts, dashboard guidance, alerting strategy, and runbook actions for telemetry freshness monitoring.

## 19. Telemetry Dashboard Operationalisation (Task DT6 Outcome)
- **Admin Console Delivery:** Implemented `/admin/telemetry` console leveraging `useTelemetrySummary` hook, analytics widgets, and telemetry-specific components to surface adoption metrics, freshness status, and operational insights.
- **Navigation & Documentation:** Added telemetry shortcut to the admin dashboard header and published `ui-ux_updates/telemetry_dashboard_enablement.md` detailing UI behaviour, accessibility, and QA instrumentation.
- **Automation & Exports:** Provided CSV export, deterministic `data-qa` selectors, and development sample dataset workflow enabling QA automation, Looker validation, and design reviews without live data.

## 20. Telemetry Alerting & Looker Snapshots (Task DT7 Outcome)
- **Alerting Pipeline:** Added background job (`backend-nodejs/src/jobs/telemetryAlertJob.js`) to poll telemetry summaries, evaluate freshness/emo adoption thresholds, and dispatch Slack notifications with repeat suppression and runbook links.
- **Analytics Snapshots:** Persist rolling summary data via `UiPreferenceTelemetrySnapshot` model so Looker can ingest governed metrics (events, shares, staleness) without hitting production APIs; payload JSON provides full fidelity for downstream modelling.
- **Operational Governance:** Documented environment variables, alert rehearsal steps, QA scenarios, and escalation policy within `ui-ux_updates/telemetry_alerting_enablement.md` and the telemetry runbook to ensure design/ops/data share a single response playbook.

## 21. Telemetry Snapshot Distribution & Looker Enablement (Task DT8 Outcome)
- **Snapshot API Delivery:** Introduced `/api/telemetry/ui-preferences/snapshots` with cursor-based pagination and range filters, allowing Looker and downstream BI tooling to ingest governed telemetry summaries without direct database connectivity.
- **Runbook & QA Updates:** Refreshed `docs/telemetry/ui-preference-dashboard.md` with ingestion guidance, added QA scenarios for pagination/cursor chaining, and documented rehearsal checkpoints for analytics/ops teams ahead of the 12 Feb review.
- **Governance & Tracking:** Updated change logs, trackers, and milestone records to reflect analytics distribution readiness and re-focused follow-up work on tenant segmentation and Chromatic/axe automation coverage.

## 22. Telemetry Snapshot Diagnostics & Data Quality (Task DT9 Outcome)
- **Enhanced Filtering:** Extended the snapshots endpoint to support leading theme and staleness bounds plus explicit validation, enabling analytics engineers to target stale windows and tenant-specific slices without bespoke SQL.
- **Aggregate Statistics:** Added optional `includeStats` payload surfacing capture range, freshness distribution, tenant/theme coverage, and share aggregates so Looker ingestion monitors can flag anomalies during rehearsal.
- **Operational Guidance:** Updated telemetry runbook and QA scenarios with diagnostics flows, threshold override usage, and rehearsal checkpoints, ensuring ops/design/data can evidence freshness compliance during the 12 Feb drill.

## 23. Regression Automation Hardening (2025-02-09)
- **React Telemetry Harness:** Introduced Vitest + Testing Library regression covering `ThemeProvider` DOM dataset updates, custom event broadcasting, dataLayer writes, and fetch fallback telemetry to lock design instrumentation.
- **Flutter Widget Coverage:** Authored widget tests for the live feed banner verifying loading/empty/high-priority states and retry affordances so mobile design intent remains auditable despite feature flag variants.
- **Tracker Integration:** Refreshed test plan, update tracker, and design change log to document Subtask 6.2 automation maturity and surface evidence paths for QA sign-off.

## 24. Issue Intake & Design QA Alignment (Task 1.4 Outcome — 2025-10-11)
- **Automation Handshake:** `scripts/issue-intake.mjs` now enforces severity SLAs, ownership metadata, and acceptance criteria sourced from design artefacts; running the script regenerates tracker tables consumed by design ops reviews.
- **Design Traceability:** Issue payload references `Application_Design_Update` and `Web Application Design Update` specifications (e.g., auth flows, escrow governance) so squads can map remediation directly to blueprint IDs and copy guidelines.
- **Governance Integration:** Design council agenda updated to include SLA breach review; issue intake automation feeds dashboards that combine design, QA, and compliance status for readiness checkpoints.
- **Next Steps:** Wire automation into CI/Slack to broadcast design-impacting defects, extend payload schema with design QA fields (e.g., Figma frame IDs), and capture sign-off timestamps when design validation closes an issue.

## 25. Analytics Pipeline & Quiet-Hour Telemetry (2025-10-26)
- **Warehouse Monitoring Dashboards:** Added ingestion cadence widgets to analytics dashboards referencing `dashboard_drawings.md` Sections 9.3–9.5 with swim lanes for queued/delivering/ingested/purged events, success ratios, retry countdowns, and retention expiry highlights sourced from new ingestion metadata.
- **Suppressed Delivery Insights:** Updated communications workspace blueprints (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `App_screens_drawings.md`) with suppression breakdown tiles, escalation thresholds, and acknowledgement workflow copy reflecting new `deliveryId` analytics metadata.
- **Operational Playbook Hooks:** Extended Design governance checklist to include ingestion rehearsal (warehouse endpoint validation, purge cadence review) and quiet-hour alert escalation, aligning with support runbooks documented alongside `Design_update_task_list.md` milestones.

## 25. Rental Lifecycle Experience Enablement (Task 3.2 Outcome — 2025-10-17)
- **Contract Hubs:** Provider/admin consoles now include rental agreement hubs surfaced in `Screens_Update.md` and `Dashboard Designs.md`, aligning status columns (Requested, Approved, Checked-out, In Inspection, Settled, Cancelled) with `/api/rentals` payloads. Each card surfaces deposit, pickup/return schedule, outstanding checkpoints, and compliance warnings tied to insured seller status.
- **Inspection Workflows:** `Screens_Update_Logic_Flow.md` documents inspection checklists, damage evidence capture, partial return handling, and dispute escalation with telemetry events (`rental.checkpoint.submit`, `rental.inspection.dispute`). Flows require photo attachments, variance classification, and automated ledger reconciliation triggered when inspection closes.
- **Alert & Ledger Integration:** Rental state changes update inventory ledger and alert rails in real time. Design specs define inline alert banners for overdue inspections, unresolved damages, deposit holds, and auto-escalations to finance/compliance. Health widget copy updated to surface “Rental holds” count derived from inventory availability impacted by active rentals.
- **Cross-channel Parity:** Provider mobile drawings (`App_screens_drawings.md`, `dashboard_drawings.md`) and admin panel wireframes now reference shared components for agreement detail drawers, inspection queue filters, and settlement forms so Flutter and React implementations stay consistent. QA selectors, accessibility notes, and telemetry instrumentation requirements included to support automation.
- **Documentation & Governance:** Change log, milestone tracker, and task list entries updated with Task 3.2 evidence; dependency backlog lists insured seller verification UI and marketplace moderation follow-ups for Task 3.3. Compliance copy reviewed against DPIA retention rules to ensure rental document purge automation aligns with security baseline actions.

## 25. Mobilisation Governance Alignment (Task 1.1 Outcome — 2025-10-12)
- **Design Accountability in RACI:** `task1_mobilisation_raci_roadmap.md` assigns Design Ops Lead as accountable for design system governance and UX handoff while consulting on geo-zonal, booking, marketplace, and communications pillars. Blueprint IDs from `Application_Design_Update_Plan` and `Web_Application_Design_Update` are referenced so design sign-off is auditable per squad.
- **Roadmap Integration:** The mobilisation roadmap codifies when design artefacts (drawings, telemetry dashboards, blueprint walkthroughs) must be updated across Weeks 0–14, aligning with the existing DM1–DM10 cadence. Weekly control board checkpoints now reference design deliverables explicitly, ensuring design participation in compliance reviews and hypercare planning.
- **Dependency Controls:** Dependency matrix entries highlight accessibility audits, localisation QA, and Stark/Chromatic capture as compliance gates for design-led workstreams. Risks and mitigations feed into the programme tracker so Design Ops can escalate blocked audits alongside engineering dependencies.
- **Next Actions:** Feed dependency risk scoring into design council agendas, publish Confluence summary linking mobilisation RACI to Figma frames, and ensure CI documentation checks validate references to the governance pack when design artefacts change.

## 26. Feature Toggle Governance Alignment (Task 1.2 Outcome — 2025-10-13)
- **Design-aware rollout controls:** Secrets Manager manifests now store owner, ticket, and description metadata for each feature flag, enabling Design Ops to trace pilots (e.g., communications suite, rental marketplace) back to wireframes (`dashboard_drawings.md`, `menu_drawings.md`, `App_screens_drawings.md`).
- **Admin tooling coordination:** Backend `/api/admin/feature-toggles` endpoints will power the forthcoming rollout panel in admin dashboards; design team to integrate parity checks and audit history UI per `Web_Application_Design_Update/Settings Dashboard.md` guidance.
- **Parity-driven QA:** Environment parity script feeds design QA scheduling so staging demos match production toggles before review sessions. Design Ops to subscribe to parity failures and update handoff artefacts when rollout states change.
- **Next Actions:** Collaborate with engineering to visualise toggle states/audit history within admin UI, extend design QA checklists to include toggle verification, and capture parity status snapshots within design council weekly notes.

## 27. CI/CD & Rollback Enablement (Task 1.3 Outcome — 2025-10-14)
- **Design QA Gate in CI:** `Build, Test & Scan` workflow now blocks merges unless React, Flutter, and backend suites — including Theme Studio/Telemetry dashboard regression tests — pass alongside gitleaks and dependency audits triggered by `scripts/security-audit.mjs`.
- **Artefact & Manifest Packaging:** `Release Packaging` workflow publishes production-ready artefacts plus `rollback-manifest.json`; design ops use the manifest to ensure Chromatic captures and accessibility sign-offs reference the correct build hash.
- **Operational Playbook:** `docs/operations/rollback-playbook.md` documents how design, QA, and ops coordinate during rollbacks, including re-running Stark/Chromatic checks and notifying design council, embedding design governance into incident response.
- **Next Actions:** Schedule quarterly rollback rehearsals including design validation, integrate Chromatic snapshot verification into release summary, and update design QA checklist to confirm manifest checksum capture post-deploy.

## 28. Compliance Evidence Integration (Task 1.5 Outcome — 2025-10-15)
- **DPIA Alignment:** `docs/compliance/dpia.md` now references design artefacts (`Screens_Update.md`, `Dashboard Designs.md`, `Menus.md`) to evidence consent prompts, redacted UI states, and telemetry opt-out messaging. Design Ops will update copy decks to match DPIA retention disclosures across admin and mobile flows.
- **RBAC Copy & UI Hooks:** RBAC minutes capture new admin banner requirements, redaction states, and JIT access alerts. Design backlog includes chat transcript warning modals and provider address masking, tracked in `Design_update_task_list.md` Task 11.
- **Security Baseline Signalling:** Security baseline highlights telemetry KPI modules and admin help links that design must maintain. Telemetry dashboard will surface hashed-IP disclosure with support article link; Theme Studio to expose anonymisation note.
- **Follow-up Actions:** Deliver chat consent microcopy updates (Due 20 Oct), embed telemetry opt-out support article in Admin UI, and incorporate Secrets Manager TTL alert badges into rollout timeline screens before communications beta.
- **Communications Suite Alignment:** Publish cross-channel transcripts, AI toggle guardrails, and Agora launch patterns inside `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `menu_drawings.md`, and `dashboard_drawings.md` so React `/messages` workspace and Flutter chat controller remain specification-locked with consent and retention copy in place for compliance sign-off.

## 29. Inventory Ledger & Reconciliation Alignment (Task 3.1 Outcome — 2025-10-16)
- **Experience Scope:** Provider mobile dashboards, admin finance panels, and inventory reconciliation workflows now mirror the `/api/inventory` service contracts (items, ledger entries, health summaries, alert lifecycle). Design artefacts reference `Admin_panel_drawings.md`, `dashboard_drawings.md`, `App_screens_drawings.md`, and `website_drawings.md` to guarantee channel parity.
- **Widget Architecture:** Introduced tiered ledger widgets that surface on-hand/reserved/damaged balances, auto-reconciled variance, and next scheduled count with health status badges (`healthy`, `warning`, `critical`). Widgets consume `inventoryService.getInventoryHealth` output and expose context actions (cycle count, adjustment, ledger drill-down) with deterministic QA selectors.
- **Alert Framework:** Authored microcopy, iconography, and escalation affordances for low-stock, stale adjustment, and reconciliation failure alerts. Alerts derive severity and threshold metadata from configuration (`INVENTORY_LOW_STOCK_BUFFER`, `INVENTORY_CRITICAL_FLOOR`) and provide acknowledgement, snooze (4h/24h), and escalate options with audit logging captured in `InventoryAlert` records.
- **Ledger Drill-down:** Documented transaction drawer/table schema with filters for transaction type, correlation ID, adjustment reason, user, and time range. Interactions support CSV export, sticky totals, anomaly banners, and contextual links to reconciliation forms for high-variance entries.
- **Reconciliation Workflow:** Designed reconciliation sheet capturing count method (cycle scan/manual), counted quantity, variance justification, attachments (photo/pdf), and follow-up tasks. Submission patterns align with `/api/inventory/:inventoryId/reconcile`, ensuring providers record evidence for finance review while UI surfaces post-submit toasts and inline audit log updates.
- **Analytics & Telemetry:** Defined telemetry events (`inventory.health.view`, `inventory.alert.acknowledge`, `inventory.ledger.export`, `inventory.reconciliation.submit`) and dashboard instrumentation requirements so analytics squads can trend adoption, MTTA, variance ratios, and snooze frequencies. Guidance pushes Looker widgets to highlight high-risk items and reconciliation SLA breaches.

## 30. Business Front & Role Dashboard Integration (Task 4.4 Outcome — 2025-10-23)
- **Navigation & IA:** Header navigation now features a dashboards mega-menu clustering provider console, enterprise analytics, and curated business fronts. Drawings (`menu_drawings.md`, `website_drawings.md`) document hover/focus states, Escape handling, mobile accordion patterns, and breadcrumb entry points.
- **Panel Resilience Patterns:** Provider/enterprise dashboards and business fronts include cache-aware banners, skeleton placements, and concierge contact modules. `dashboard_drawings.md` and `website_drawings.md` capture messaging for cached snapshots, retry controls, and fallback storytelling that must be exercised during Task 4.5 accessibility/localisation audits.
- **Provider Console Blueprint:** `dashboard_drawings.md` and `Screens_Update.md` capture KPI tile layout, bookings trend chart, inventory/campaign widgets, compliance queues, and fraud signal treatments. React implementation references these specs with `MetricTile`, `TrendChart`, and `AnalyticsWidget` components plus deterministic `data-qa` attributes.
- **Enterprise Analytics Panel:** Updated design artefacts outline spend trend visualisations, provider ranking lists, rental exposure summaries, and upcoming visit timelines with status pills. Accessibility cues (aria-live alerts, keyboard focus order, skeleton states) and localisation placeholders are captured for Task 4.5 audits.
- **Business Front Storyboards:** `website_drawings.md` and `Screens_Update.md` illustrate hero bands, testimonials, service packages, compliance badges, and support channels mapped to `/api/business-fronts/:slug` payloads. Copy decks include procurement-friendly messaging, CTA variants, and fallback content when optional modules are absent.
- **Telemetry & QA Hooks:** Documentation enumerates analytics events (`provider.dashboard.view`, `enterprise.panel.view`, `business_front.package.view`, `business_front.support.click`), QA selectors (`data-qa="provider-dashboard-*"`, `data-qa="enterprise-panel-*"`, `data-qa="business-front-*"`), and token-handling guidance so React, Flutter, and automation suites stay aligned.
- **Outstanding Actions:** Task 4.5 accessibility/localisation sweep will validate keyboard navigation, high-contrast themes, copy deck translations, and voice-over behaviour. Flutter parity (Task 4.2) will reuse telemetry IDs and widget architecture captured here to mirror dashboards on mobile.
- **Accessibility & Compliance:** Inventory alerts leverage aria-live polite announcements, keyboard-manageable focus traps, and descriptive copy referencing stock ownership responsibilities. Reconciliation forms surface retention messaging and privacy disclaimers consistent with DPIA updates.

## 30. Communications Suite & Notification Centre Alignment (Task 4.3 Outcome — 2025-10-22)
- **Workspace Blueprint:** `/communications` route now references conversation rail, active thread canvas, AI assist sidebar, and notification drawer anatomy captured in `Design_Task_Plan_Upgrade/Web_Application_Design_Update/component_functions.md`, `menu_drawings.md`, and `dashboard_drawings.md`. Layout locks 320px thread rail with adaptive density tokens so enterprise panels can embed escalation metadata without disrupting composer ergonomics.
- **AI Assist & Compliance Guardrails:** Composer spec defines AI toggle placement, prompt usage meter, attachment handling, and consent banner states tied to Secrets Manager-backed provider policies. Copy decks in `Screens_Update.md` and `text.md.md` describe onboarding, token exhaustion, moderation, retention messaging, and heuristic fallback text when AI is offline, satisfying DPIA transparency requirements.
- **Notification Centre & Quiet Hours:** Notification drawer patterns coordinate in-app alerts, webhook escalation, and quiet-hour batching. Documentation across `Screens_Update_Logic_Flow.md`, `Design_update_task_list.md`, and `Design_update_progress_tracker.md` maps severity badges, acknowledgement flows, quiet-hour override audit payloads, and SLA countdown chips so automation and ops tooling reference identical UX cues.
- **Agora Session Launch & Failover:** Video escalation buttons surface readiness badges, bandwidth checks, and PSTN fallback entry recorded in `Function Design.md` and `App_screens_drawings.md`. Specs call the `/api/communications/:conversationId/video-session` contract, ensuring Flutter/React parity for token rotation, lobby timers, and hardware permission prompts.
- **Telemetry & Regression Coverage:** Instrumentation requirements enumerate `communications.thread.view`, `communications.message.send`, `communications.ai.toggle`, `communications.notification.ack`, and `communications.session.start` payloads, linking React Vitest composer tests and Flutter communications controller tests to UX artefacts. Tracker entries cite accessibility focus order, aria-live messaging, and offline caching heuristics to keep QA and analytics teams aligned during rollout.

## 30. Explorer Search & Zone Intelligence (Task 4.1 Progress — 2025-10-21)
- **Map-first Discovery:** Explorer experience now mirrors drawings (`website_drawings.md`, `dashboard_drawings.md`) with a 60/40 sticky layout: MapLibre renders service zone polygons, demand tiers, and centroids while a right-rail insight panel surfaces SLA breaches, open bookings, and inventory matches sourced from `/api/zones?includeAnalytics=true`.
- **Filter Orchestration:** React filter shell exposes keyword, type, zone, availability, category, and demand toggles. Filters persist to URL parameters, emit telemetry hooks for analytics, and include compliance copy referencing retention and consent requirements documented in `Screens_Update.md` & `Screens_Update_Logic_Flow.md`.
- **Result Cards & Copy:** Service and marketplace cards adopt governed component tokens (status pills, meta grids) with provider/company attribution, price formatting, and CTA routing aligning with Services blueprint guidance. Accessibility copy and QA selectors support automation and screen-reader parity across personas.
- **Design Ops Alignment:** New API client + utilities normalise MultiPolygon/centroid data for SQLite/PostGIS, enabling accurate overlays in both React and forthcoming Flutter parity builds. Documentation links recorded across change logs, progress trackers, and design drawings to evidence Task 4.1 progression and to set up booking wizard + communications follow-on work.

## 30. Insured Seller Compliance & Marketplace Moderation (Task 3.3 Outcome — 2025-10-18)
- **Badge Manager & Renewal UX:** `Screens_Update.md` and `Dashboard Designs.md` now include provider badge manager card (countdown chip, renewal CTA, policy doc shortcuts) with microcopy referencing renewal SLAs, compliance disclaimers, and accessible toggle semantics for storefront badge visibility.
- **Compliance Queue & Review Modals:** Admin/provider compliance queues document list/table patterns for document status, reviewer metadata, SLA countdown chips, and actions (approve, request info, reject). Review modals capture rationale, supporting notes, and audit summaries aligned with `/api/compliance` responses, ensuring ops/legal teams can evidence decisions.
- **Marketplace Moderation Drawer:** Web/app marketplace drawings define moderation drawer with compliance snapshot (score, expiry, outstanding docs), decision actions, follow-up tasks (notify marketing, flag legal), and hold messaging for suspended/expired listings. States cover approved, rejected, suspended, and automatically hidden listings.
- **Feed & Card Treatments:** Marketplace cards across web/mobile surface insured badge, compliance hold tooltips, and "Hidden pending review" message. Design plan captures iconography, colour tokens, and telemetry events (`marketplace.listing.onHold`, `marketplace.listing.reinstated`) for analytics and QA instrumentation.
- **Support & Knowledge Base Hooks:** Added contextual help links and tip banners guiding providers through document requirements, acceptable file formats, review timelines, and escalation steps. Support article references wired into badge manager, compliance queue, and moderation drawer tooltips.
- **Accessibility, QA, and Telemetry:** Documented focus management, aria-live announcements for review outcomes, QA selectors for toggles/buttons, and analytics payload requirements (reviewerId, decision, expiresInDays, renewalDue). Compliance evaluation flows now mirror backend `InsuredSellerApplication` schema, enabling deterministic automation and dashboards.
- **Implementation Guidance:** Updated `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, and `Dashboard Designs.md` with annotated states, motion guidance (countdown pulses, alert escalation), and QA hooks. Engineering tickets can now reference specific blueprint IDs and acceptance criteria for provider/admin ledger delivery.

## 31. Campaign Manager Experience (Task 3.4 Outcome — 2025-10-19)
- **Campaign Workspace Blueprint:** `Screens_Update.md` introduces campaign list, detail, and builder screens referencing `dashboard_drawings.md`, `Admin_panel_drawings.md`, and `website_drawings.md`. Cards surface delivery status, spend vs budget, pacing badge, flight window, and outstanding invoice chips mapped to `/api/campaigns` summary payloads.
- **Targeting Composer:** UI spec documents targeting chip editor supporting geography radius, category bundles, audience segments, and slot types. Validation reflects backend caps (`CAMPAIGN_TARGETING_CAP`) with inline error copy, contextual helper text, and saved preset support for high-volume advertisers.
- **Flight & Budget Governance:** Detail drawer outlines flight timeline, daily/total budgets, pacing chart, and overspend guard-rails. Design enumerates states for active, scheduled, completed, paused (overspend), and archived flights with tooltip copy describing automatic pauses/resumes triggered by overspend multiplier.
- **Pacing Timeline & Delivery Analytics:** Dashboard spec adds pacing timeline widget plotting spend vs goal with trendline, overspend/underspend badges, and forecast callouts. Widgets integrate export and segmentation controls, referencing telemetry events `campaign.pacing.view` and `campaign.pacing.export`.
- **Invoice & Billing Drawer:** Billing section describes invoice table with due date countdown, status pill (Draft, Issued, Paid, Overdue), outstanding balance summary, and CTA `Download PDF`. Drawer includes finance notes, reconciliation checklist, and escalation CTA triggering Slack/email templates aligned to finance operations runbook.
- **Compliance & Eligibility Messaging:** Copy deck covers insured seller gating, pending documentation banners, and inline education linking to knowledge base entries. States cover blocked creation, pending approval, and compliance expiry warnings triggered from backend eligibility checks.
- **Accessibility, QA & Telemetry:** Documented focus order, keyboard shortcuts (e.g., `Ctrl+Enter` to add targeting rule), aria-live pacing alerts, and `data-qa` selectors for automation. Telemetry schema enumerates events (`campaign.create.submit`, `campaign.targeting.add`, `campaign.invoice.pay`, `campaign.status.pause_auto`) with payload requirements (campaignId, flightId, spendDelta, ruleType) to align analytics + fraud monitoring with backend service output.
- **Cross-channel Continuity:** Provider mobile previews in `App_screens_drawings.md` mirror campaign list widgets and pacing badges with condensed layout, ensuring Flutter parity. Web application blueprint references shared theming tokens and responsive breakpoints, while knowledge base callouts align with Application_Design_Update_Plan logic flows.

## 32. Campaign Analytics Telemetry & Fraud Monitoring (Task 3.5 Outcome — 2025-10-20)
- **Analytics Export Visibility:** `Screens_Update.md` and `Dashboard Designs.md` now include export outbox tiles showing Pending/Sent/Failed states with retry timers, API key warnings, and "Download payload" actions for data engineering triage. Visual treatments map to `CampaignAnalyticsExport` payload keys and trigger telemetry event `campaign.analytics.export.retry`.
- **Fraud Signal Console:** Added anomaly rail specifications covering overspend, underspend, suspicious CTR/CVR, delivery gap, and no-spend badges with severity colour tokens, sparkline trends, and resolve/assign buttons. Copy references backend resolution metadata and escalation channels documented in finance/fraud runbooks.
- **Summary KPI Updates:** Dashboard hero metrics incorporate ROI, conversion rate, spend delta, and open anomaly count with tooltips outlining formulas and linking to fraud escalation procedures. Data bindings reference `/api/campaigns/:id/summary` output.
- **Notifications & Mobile Treatments:** Provider/admin mobile wireframes highlight push badge icons and condensed anomaly cards; Slack/email templates for exporter failures and critical anomalies captured in `Screens_Update_Logic_Flow.md`. Accessibility annotations ensure anomaly updates fire polite live region announcements and include keyboard shortcuts for resolve/defer actions.

## 33. Flutter Booking & Rental Parity QA (Task 4.2 Progress — 2025-10-21)
- **Controller Test Coverage:** Riverpod controller tests for bookings and rentals (`flutter-phoneapp/test/features/bookings/booking_controller_test.dart`, `test/features/rentals/rental_controller_test.dart`) validate cached refresh vs live fetch, offline banner messaging, booking creation/status advancement, and rental scheduling/inspection flows. Scenarios reference explorer, booking, and rental drawings (`App_screens_drawings.md`, `dashboard_drawings.md`, `menu_drawings.md`, `Screens_Update_Logic_Flow.md`) so QA evidence ties back to design intent.
- **Rental Creation Sheet Alignment:** `_DateField` logic on `RentalCreationSheet` now mirrors inspection scheduling guidance—default 09:00 local selection, optional time skip (date-only), and UTC persistence—matching copy in `Application_Design_Update_Plan/Screens_Update.md` and preventing regressions flagged in pre-update evaluations.
- **Governance & Next Actions:** Design change log, milestone list, progress tracker, and task list updated to reflect Flutter parity maturity while calling out remaining chat/enterprise dashboard follow-ups required for Task 4.2 completion before Milestone M4 exit.

## 34. Unified Analytics Event Schema Alignment (Task 5.1 Outcome — 2025-10-24)
- **Catalogue Mapping:** `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, and telemetry briefs now document analytics event coverage across zones, bookings, rentals, campaigns, and communications, with references to `dashboard_drawings.md`, `Admin_panel_drawings.md`, `App_screens_drawings.md`, and `website_drawings.md` so every UI trigger is paired with a telemetry ID.
- **Metadata & Tenant Guidance:** Added metadata tables listing required fields (demand level, SLA expiry, assignment ID, inspection outcome, fraud signal type, suppression reason) plus tenant/actor derivation hints to help analytics teams validate instrumentation and Looker models without backend code spelunking.
- **QA & Accessibility Hooks:** Annotated explorer, booking, rental, campaign, and communications drawings with `data-qa` selectors and aria-live callouts next to telemetry-emitting components, ensuring automation and assistive technology coverage remains intact as new events roll out.
- **Governance Integration:** Progress trackers, milestone commentary, and support copy now reference analytics retention defaults (400-day baseline) and ETL rehearsal cadence; telemetry dashboard documentation links to the event catalogue so data ops can script backfills and schema validations against a single source of truth.

## 35. Accessibility, Localisation & Panel Performance (Task 4.5 Outcome — 2025-10-27)
- **Locale Provider Blueprint:** Documented the `LocaleProvider` contract covering available locales (English, Spanish), storage precedence (URL → localStorage → browser preference), analytics hooks (`ui.locale.change`), and graceful degradation rules (fallback to English when catalogue miss occurs). `Screens_Update.md` and `Screens_Update_Logic_Flow.md` now include interaction diagrams showing header language selector, persisted preference banner, and analytics instrumentation so React and Flutter teams implement identical flows.
- **Navigation & Skip-to-Content Patterns:** Updated `website_drawings.md` and `menu_drawings.md` to capture the skip-link placement, focus ring styling, and keyboard order from mega-menu → skip anchor → dashboard content. Footer callouts list locale-aware sitemap, compliance copy, and support microcopy to align with marketing/legal requirements. Business front hero sections annotate bilingual testimonials and CTA copy, ensuring layout resilience under long-form Spanish strings.
- **Dashboard Localisation States:** `dashboard_drawings.md` and `App_screens_drawings.md` now document translated KPI tiles, aria-live refresh banners, Suspense skeleton overlays, and cached snapshot toasts for provider/enterprise dashboards. Specs call out Intl formatting (currency, date, percentage) and error/fallback copy so engineering can wire translations and persisted metrics without regressions.
- **QA & Governance Alignment:** Added pseudo-locale stress checklist, translation cache invalidation steps, and accessibility regression scripts to `Design_update_progress_tracker.md` and `Design_update_task_list.md`. QA selectors (`data-qa="skip-nav"`, `data-qa="locale-toast"`, `data-qa="language-picker"`) plus performance guardrails (≤100 ms locale toggle re-render, ≤2 additional Suspense frames) keep automated testing, analytics, and accessibility sign-off auditable ahead of Milestone M4 closure.

## 36. Analytics Pipeline Control Console (Task 5.2c Outcome — 2025-10-28)
- **Status Command Centre:** Added analytics control card spec summarising ingestion state (`status`, `pendingEvents`, `oldestPendingAt`, `nextRetryAt`, `failureStreak`) with severity-aware badges and inline compliance copy reminding operators to log incident/ticket IDs. Card pulls metrics from `/api/analytics/pipeline` and references `Admin_panel_drawings.md` Section 11 to align with dashboard visuals.
- **Governed Pause/Resume Flow:** Documented pause/resume modal sequence capturing actor name, role, ticket reference, reason, and expected duration. Confirm actions emit telemetry event `analytics.pipeline.control` and require acknowledgement checkboxes describing downstream impact (ingestion halted, purge cadence remains active). Copy references runbook ID `OPS-AN-07` for escalation.
- **Run History Ledger & Detail Drawer:** Specified paginated table mirroring `AnalyticsPipelineRun` schema with columns for start/end times, processed/purged counts, duration, status pill, failure streak, actor/ticket metadata, and response excerpt. Clicking a row opens drawer with structured error context, payload diff, and follow-up CTAs (`Download JSON`, `Escalate to data engineering`). Accessibility guidance includes sticky headers, keyboard row navigation, and polite live region updates for new runs.
- **Dashboard Widgets & Alerts:** `Dashboard Designs.md` now features backlog trend sparkline, failure streak gauge, and toggle audit feed modules. Widgets expose `data-qa` selectors (`analytics-control-status`, `analytics-run-history-row`, `analytics-toggle-feed-item`), aria-live messaging for state changes, and tooltip copy defining metrics so analytics ops and support teams can rehearse incidents. Integration notes cover Looker tile parity and Slack alert linking.
- **Cross-environment & Mobile Considerations:** Updated `Screens_Update.md` and `Screens_Update_Logic_Flow.md` to flag staging read-only behaviour, Secrets Manager fallback messaging when ARN absent, and Flutter admin backlog for future parity. Support overlays highlight migration dependency (`20250225000000-create-analytics-pipeline-runs.js`) and compliance obligations for storing actor/ticket metadata, keeping design, ops, and legal teams aligned.

## 37. Persona Analytics Dashboards & CSV Export (Task 5.3 Kick-off — 2025-10-29)
- **Persona Tile Architecture:** `dashboard_drawings.md` and `Screens_Update.md` now document admin, provider, serviceman, and enterprise dashboard layouts powered by `/api/analytics/dashboards/:persona`. Each persona maps the returned overview metrics, pipeline snapshots, and queue widgets into governed grid slots with density variants, ensuring visual hierarchy mirrors operational priorities (e.g., admin SLA breach tile above finance backlog, serviceman job pipeline to the left of earnings trends).
- **Insight & Alert Modules:** Added fraud/compliance rails, booking queues, revenue deltas, and communications backlog widgets with microcopy derived from service payloads (`breachReason`, `fraudType`, `queueOwner`). Tooltips explain metric formulas and escalation paths, while status badges reuse analytics palette tokens introduced in `Dashboard Designs.md` Section 12. Empty/error states echo backend messages and include CTA links to runbooks.
- **Export Toolbar & Governance:** `Screens_Update_Logic_Flow.md` and `Web_Application_Design_Update/Dashboard Designs.md` capture the CSV export toolbar with persona badge, reporting window pill, timezone indicator, and "Download CSV" CTA. Interaction notes ensure aria-live announcements on success/failure, disabled states during fetch, and telemetry event `analytics.dashboard.export` with payload `{ persona, companyId, timezone, rowCount }`.
- **Persona Access Gating & Ops Workflow:** Documented feature toggle gating across persona dashboards referencing Secrets Manager manifests and React provider (`FeatureToggleProvider.jsx`). Gated states show `beta-locked`, `pilot-ready`, and `general access` messaging with CTA copy (“Request pilot access”), ticket input, and compliance acknowledgement so analytics ops can approve cohorts. Toggle summary card surfaces manifest ID, owner, cohort, last rotated timestamp, and refresh CTA wired to `DashboardAccessGate.jsx` + `featureToggleClient.js`; telemetry emits `feature.toggle.refresh` and `feature.toggle.request_access` while audit copy links to runbook `OPS-AN-12`.
- **Accessibility & Localisation:** Specifications include keyboard shortcuts (`Shift+R` refresh, `Shift+E` export), focus order, and live region messaging for data refreshes. Translation tables list copy keys per persona so LocaleProvider integration delivers bilingual dashboards without layout shift; charts include data table toggle for screen readers, matching `Screens_Update.md` accessibility annotations.
- **Operational & QA Hooks:** Progress trackers and QA scenarios now reference persona dashboards, covering smoke tests for metric accuracy, export parity, and offline fallbacks. `Design_update_task_list.md` logs follow-up actions for enterprise cohort drill-downs and Flutter parity, while `Design_Change_log.md` entry documents new blueprint IDs and telemetry requirements to keep analytics, finance, and success stakeholders aligned.
- **Verification Outcomes (2025-10-30):** Staging rehearsal confirmed export toolbar copy (row limits, timezone label, last refresh timestamp), persona-specific insight copy, and localisation fallbacks align with live payloads. Dashboard drawings annotated with CSV governance notes, aria-live messaging, and Vitest reporter improvements required for CI evidence, ensuring analytics ops and design QA share a complete, production-ready blueprint prior to enterprise drill-down delivery.

## 38. Flutter Operations Dashboard Parity (Task 5.3c Outcome — 2025-11-01)
- **Mobile Grid Adaptations:** `Screens_Update.md`, `Dashboard Designs.md`, and `App_screens_drawings.md` now capture Flutter layout variants for persona dashboards, including column collapse rules, scroll choreography, and touch-friendly metric tiles. Provider/serviceman boards reuse kanban patterns with condensed cards, admin/enterprise tables support horizontal scroll with sticky headers, and automation lists inherit consistent iconography.
- **Export & Offline UX:** Export toolbar specs call out Secrets Manager row limit messaging, last-export location, and offline banners referencing warehouse rehearsal guidance. `Screens_Update_Logic_Flow.md` documents export happy-path, timeout, and offline flows with aria-live copy, storage permission prompts, and telemetry events `analytics.dashboard.export`, `analytics.dashboard.offline`, and `analytics.dashboard.refresh` to align with Flutter controller logic.
- **Repository/Controller Responsibilities:** Design notes reference Riverpod repository/controller boundaries (`analytics_repository.dart`, `operations_dashboard_controller.dart`) for cache hydration, persona query parameters, and CSV persistence via `path_provider`. Logic flow diagrams illustrate when Flutter falls back to cached analytics, surfaces quiet-offline banners, and rehydrates sections post-export, ensuring resiliency matches design intent.
- **QA, Telemetry & Localisation Hooks:** Updated artefacts add mobile-specific `data-qa` selectors (`dashboard-metric`, `dashboard-export`, `dashboard-sidebar-highlight`), localisation copy for timezone badges/export toasts, and accessibility requirements (polite banners, keyboard shortcuts). `test_plan.md` gains Flutter analytics scenarios while `Design_update_task_list.md` and `Design_Change_log.md` reference the new parity milestones and rehearsal checklist.


## 33. Warehouse Freshness Monitoring & OpsGenie Escalation (Task 5.4a Outcome — 2025-11-02)
- **Alert Surface & Copy:** Admin telemetry dashboard and mobile analytics consoles now include "Warehouse freshness" status banners referencing OpsGenie incident IDs, thresholds, and runbook links. Copy, colours, and iconography map to alert severity tokens defined in `Dashboard Designs.md` and `dashboard_drawings.md`.
- **On-call Integration:** `backend-nodejs/src/jobs/warehouseFreshnessJob.js` evaluates dataset freshness, backlog volume, and pipeline failure streaks, dispatching OpsGenie alerts through the new service wrapper (`services/opsgenieService.js`). Configurable thresholds/live responders documented in `config/index.js` ensure alerts inherit productised escalation metadata.
- **Runbook & QA:** Telemetry runbook (`docs/telemetry/ui-preference-dashboard.md`) and QA scenarios (`docs/design/handoff/ui-qa-scenarios.csv`) now reference OpsGenie rehearsal steps: trigger stale datasets via fixtures, validate alert payload JSON, confirm dashboard banner state, and rehearse closure once ingestion recovers.
- **Design Follow-ups:** Upcoming Subtask 5.4b will extend the alert centre with dispute/ad anomaly surfacing; design backlog captures required iconography updates and push notification parity for mobile OpsGenie escalations.
