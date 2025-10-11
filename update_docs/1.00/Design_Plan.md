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

