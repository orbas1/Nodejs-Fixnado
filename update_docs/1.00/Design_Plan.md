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

## 29. Inventory Ledger & Reconciliation Alignment (Task 3.1 Outcome — 2025-10-16)
- **Experience Scope:** Provider mobile dashboards, admin finance panels, and inventory reconciliation workflows now mirror the `/api/inventory` service contracts (items, ledger entries, health summaries, alert lifecycle). Design artefacts reference `Admin_panel_drawings.md`, `dashboard_drawings.md`, `App_screens_drawings.md`, and `website_drawings.md` to guarantee channel parity.
- **Widget Architecture:** Introduced tiered ledger widgets that surface on-hand/reserved/damaged balances, auto-reconciled variance, and next scheduled count with health status badges (`healthy`, `warning`, `critical`). Widgets consume `inventoryService.getInventoryHealth` output and expose context actions (cycle count, adjustment, ledger drill-down) with deterministic QA selectors.
- **Alert Framework:** Authored microcopy, iconography, and escalation affordances for low-stock, stale adjustment, and reconciliation failure alerts. Alerts derive severity and threshold metadata from configuration (`INVENTORY_LOW_STOCK_BUFFER`, `INVENTORY_CRITICAL_FLOOR`) and provide acknowledgement, snooze (4h/24h), and escalate options with audit logging captured in `InventoryAlert` records.
- **Ledger Drill-down:** Documented transaction drawer/table schema with filters for transaction type, correlation ID, adjustment reason, user, and time range. Interactions support CSV export, sticky totals, anomaly banners, and contextual links to reconciliation forms for high-variance entries.
- **Reconciliation Workflow:** Designed reconciliation sheet capturing count method (cycle scan/manual), counted quantity, variance justification, attachments (photo/pdf), and follow-up tasks. Submission patterns align with `/api/inventory/:inventoryId/reconcile`, ensuring providers record evidence for finance review while UI surfaces post-submit toasts and inline audit log updates.
- **Analytics & Telemetry:** Defined telemetry events (`inventory.health.view`, `inventory.alert.acknowledge`, `inventory.ledger.export`, `inventory.reconciliation.submit`) and dashboard instrumentation requirements so analytics squads can trend adoption, MTTA, variance ratios, and snooze frequencies. Guidance pushes Looker widgets to highlight high-risk items and reconciliation SLA breaches.
- **Accessibility & Compliance:** Inventory alerts leverage aria-live polite announcements, keyboard-manageable focus traps, and descriptive copy referencing stock ownership responsibilities. Reconciliation forms surface retention messaging and privacy disclaimers consistent with DPIA updates.
- **Implementation Guidance:** Updated `Screens_Update.md`, `Screens_Update_Logic_Flow.md`, and `Dashboard Designs.md` with annotated states, motion guidance (countdown pulses, alert escalation), and QA hooks. Engineering tickets can now reference specific blueprint IDs and acceptance criteria for provider/admin ledger delivery.

