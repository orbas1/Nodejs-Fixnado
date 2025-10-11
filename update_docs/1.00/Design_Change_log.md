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
| Data Visualisation | Defined dashboard module styling (`Dashboard Designs.md`, `Dashboard Organisation.md`) with refreshed chart colours, tooltip treatments, and anomaly surfacing patterns. Added animated loading skeletons to reduce perceived latency. | Dashboard Designs, Dashboard Organisation | Improves interpretability of analytics and resilience to slow data responses. |
| Content & Messaging | Refined copy tone hierarchy from `Screen_text.md`, `text.md.md`, and `Home page text.md`. Added templated microcopy for error states and guided onboarding flows aligned with compliance requirements. | Screen_text, text.md.md, Home page text | Drives consistent voice and regulatory clarity. |
| Imagery & Illustration | Curated imagery specifications (`Screens_update_images_and_vectors.md`, `images_and _vectors.md`, `Home page images.md`) to support inclusive representation and performance budgets. Implemented vector-first approach with fallbacks for offline caching. | Image/vector documents | Improves accessibility and load performance across devices. |
| Logic & Interaction | Harmonised logic flow artefacts (`Logic_Flow_update.md`, `Screens_Update_Logic_Flow.md`) to map cross-platform journeys, introducing guard-rails for security-critical paths and conditional theming triggers. | Logic Flow documents | Reduces behavioural inconsistencies and surfaces security checkpoints earlier in the experience. |
| New / Adjusted Pages | Added dedicated theme configuration screen, "emo" theme preview, and modular home-page hero variants as described in `Home Page Organisations.md`, `Home page components.md`, and `Pages_list.md`. | Home page documentation, Pages_list | Enables marketing experimentation, personalisation, and theme testing. |
| Compliance & QA Artefacts | Embedded accessibility and compliance checkpoints throughout design documentation, aligning with `Compliance Grade` tracking and `Test Grade` expectations. Added spec handoffs for QA in `Screens_Update_Plan.md`. | Screens_Update_Plan, Compliance criteria | Strengthens traceability and audit readiness. |
| Core Page Blueprints | Rebuilt home, admin dashboard, provider profile, and services marketing layouts in React using shared blueprint primitives (`PageHeader`, `BlueprintSection`). Documented in `ui-ux_updates/core_page_blueprints.md`. | Home.jsx, AdminDashboard.jsx, Profile.jsx, Services.jsx | Aligns IA with compliance overlays, boosts conversion signals, and formalises instrumentation hooks. |

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

## Open Questions & Follow-ups
- Validate colour token accessibility in upcoming usability study across low-vision participants.
- Confirm analytics tracking coverage for new theme toggles and personalised home variants.
- Evaluate additional "emo" theme presets and seasonal variants after initial release metrics.
- Monitor performance impact of new imagery pipeline under constrained networks.

## Approval History
| Date | Stakeholders | Status | Notes |
| --- | --- | --- | --- |
| 2025-01-17 | Lead Product Designer, UX Research, Engineering Lead | Approved | Foundation tokens & navigation structure locked. |
| 2025-01-22 | Compliance Officer, Security Architect | Approved | Security prompts and compliance checkpoints validated. |
| 2025-01-24 | Marketing Lead, Content Strategist | Conditional | Additional "emo" presets requested for Q2 experiment. |
| 2025-01-27 | QA Lead | In Progress | Pending validation of QA artefact alignment with automated tests. |

