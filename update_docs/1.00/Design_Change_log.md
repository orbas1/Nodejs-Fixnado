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
| Core Page Blueprints | Rebuilt home, admin dashboard, provider profile, and services marketing layouts in React using shared blueprint primitives (`PageHeader`, `BlueprintSection`). Documented in `ui-ux_updates/core_page_blueprints.md`. | Home.jsx, AdminDashboard.jsx, Profile.jsx, Services.jsx | Aligns IA with compliance overlays, boosts conversion signals, and formalises instrumentation hooks. |
| Marketplace Inventory & Monetisation | Codified provider inventory console, rental lifecycle detail screens, insured seller badge workflows, and campaign pacing dashboards across mobile and web specifications. | Screens_Update.md, Screens_Update_Logic_Flow.md, Settings.md, Dashboard Designs.md, Settings Dashboard.md | Ensures backend marketplace services plug into UI with actionable alerts, governed copy, and analytics instrumentation. |

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

## Open Questions & Follow-ups
- Validate colour token accessibility in upcoming usability study across low-vision participants.
- Confirm analytics tracking coverage for new theme toggles, personalised home variants, and telemetry dashboard interactions.
- Finalise Looker dashboard rollout using snapshot table, rehearse Slack alert channel, and deliver Chromatic/axe automation for Theme Studio + telemetry screens.
- Evaluate additional "emo" theme presets and seasonal variants after initial release metrics.
- Monitor performance impact of new imagery pipeline under constrained networks.

## Approval History
| Date | Stakeholders | Status | Notes |
| --- | --- | --- | --- |
| 2025-01-17 | Lead Product Designer, UX Research, Engineering Lead | Approved | Foundation tokens & navigation structure locked. |
| 2025-01-22 | Compliance Officer, Security Architect | Approved | Security prompts and compliance checkpoints validated. |
| 2025-01-24 | Marketing Lead, Content Strategist | Conditional | Additional "emo" presets requested for Q2 experiment. |
| 2025-01-27 | QA Lead | In Progress | Pending validation of QA artefact alignment with automated tests. |

