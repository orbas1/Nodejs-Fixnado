# Version 1.50 Design Plan

## 1. Strategic Intent
The Version 1.50 design effort aligns the Fixnado ecosystem (provider app, user app, and enterprise web console) around a unified service marketplace vision. The design plan operationalises:
- **Persona-coordinated journeys:** Adaptive dashboards and navigation flows that surface the most relevant information per persona.
- **Operational intelligence:** Embedded AI, compliance, and analytics cues across booking, rental, and campaign journeys.
- **Trust-first commerce:** Transparent verification, policy disclosures, and consent checkpoints across all touchpoints.
- **Future-ready theming:** Scalable token architecture that powers dark mode, reduced-motion, and localisation requirements.

## 2. Experience Architecture
The `docs/architecture/platform-architecture.md` blueprint now anchors navigation and information architecture decisions. It maps domain boundaries to persona journeys and codifies deployment workflows and telemetry expectations that design teams must reflect in prototypes and UI copy.
### 2.1 Navigation Framework
- Consolidate mobile landing pages into role-specific dashboards informed by **Screens_list**, with quick actions for approvals, bidding, and scheduling.
- Implement global navigation rails and mega-menus on web per **Home Page Organisations.md** and **Menus.md.md**, including breadcrumbs and contextual filters.
- Ensure parity between web and mobile flows via shared logic diagrams (**Logic_Flow_map.md**, **Logic_Flow_update.md**) and consistent component states.

### 2.2 Flow Optimisation
- Booking and bidding wizards now follow a four-stage model (Context → Requirements → Confirmation → Follow-up) with inline validation and autosave, mapped to **Screens_Update_Logic_Flow.md**.
- Dispute and compliance escalations adopt guided workflows with AI-generated recommendations and required documentation uploads, referencing **Function Design.md**.
- Campaign wizard and marketplace discovery flows integrate persona-aware recommendations and compliance badges sourced from **Organisation_and_positions** and **Dashboard Organisation.md** documentation while respecting the shared telemetry schema outlined in the architecture blueprint.

## 3. Visual & Interaction System
### 3.1 Foundations
- **Colour Tokens:** Adopt refreshed palette from both mobile and web **Colours** specifications; define semantic tokens (Primary/Secondary/Accent/Feedback) with contrast ratios ≥ 4.5:1.
- **Typography:** Apply Display–Body–Caption hierarchy documented in **Fonts.md**, including accessible font-sizing for responsive breakpoints and fallback stacks for offline mode.
- **Spacing & Elevation:** Harmonise spacing scale (4px multiplier) and elevation levels across mobile cards and web tiles to ensure parity in visual rhythm.

### 3.2 Components & States
- Standardise cards, forms, buttons, and widget modules using patterns from **Cards.md**, **component_types.md**, and **Forms.md.md**, including loading, success, error, and disabled variants.
- Introduce accessibility-first interaction affordances: visible focus rings, keyboard navigable tabs, and motion-safe micro-interactions.
- Maintain adaptive imagery blocks referencing **Screens_update_images_and _vectors.md** and **Home page images.md**, ensuring responsive behaviour and localisation.

### 3.3 Modes & Themes
- Deliver light/dark modes with automated token switching, ensuring component parity via **Settings Dashboard.md** guidelines.
- Provide reduced-motion path that swaps animations for subtle opacity transitions following accessibility best practices.

## 4. Content & Communication
- Refresh hero copy, CTAs, and contextual helper text per **Screen_text.md** and **Home page text.md** while embedding localisation keys.
- Define AI transparency statements for recommendation modules, emphasising rationale, data provenance, and opt-out controls.
- Produce compliance-friendly notification templates covering booking approvals, rental returns, and policy updates.

## 5. Data, Dummy Content, & Imagery
- Supply dummy datasets enumerated in **Dummy_Data_Requirements.md** (provider personas, inventory samples, compliance states) to support prototyping.
- Curate imagery and vector assets per **images_and _vectors.md** to maintain brand alignment across platforms.
- Maintain structured content repository for legal copy, tooltips, and onboarding sequences.

## 6. Accessibility & Compliance
- Target WCAG 2.1 AA compliance, enforcing contrast, keyboard navigation, ARIA roles, and focus management.
- Document consent management, GDPR disclosures, and audit trails for verification processes.
- Align error messaging and form validation states with inclusive language guidelines.

## 7. Prototyping & Validation
- Build interactive Figma prototypes covering core flows (booking, campaign setup, compliance escalation, rental management).
- Schedule moderated usability tests with provider and user cohorts; capture findings and iterate before engineering handoff.
- Instrument design QA checklist for component builds (colour tokens, spacing, typography, semantics) prior to Storybook sign-off.

## 8. Handoff & Implementation Support
- Package redlines, component specs, and token documentation for React, Blade, and Flutter teams.
- Run paired review sessions with engineering to validate feasibility, especially for AI-driven recommendations and compliance indicators.
- Establish ongoing feedback loops during sprint reviews to track adherence to design intent.
- Maintain ESLint 9 / PropTypes guardrails and the dependency audit CI so design handoffs retain accessibility, localisation, and security requirements through build pipelines.

## 9. Success Metrics
- Increase booking conversion by 18% and ad click-through by 12% via improved wayfinding and trust signals.
- Reduce compliance overdue rate by 25% and dispute resolution time by 30% through dashboard clarity and guided flows.
- Achieve ≥80% adoption of campaign wizard within provider cohort and ≥70% usage of comparison trays among users in the first month.

## 10. Risks & Mitigations
- **Token Drift:** Mitigate by automating export to codebases and running UI regression audits weekly.
- **Performance Impact:** Monitor load times for media-rich surfaces; lazy-load imagery and optimise SVG usage.
- **Change Management:** Deploy release notes, in-app tours, and webinars to reduce user friction and ensure adoption.

## 11. Timeline & Dependencies
- Week 1: Finalise architecture, navigation flows, and tokens.
- Week 2: Produce hi-fidelity screens and document component specs.
- Week 3: Build prototypes, conduct usability tests, and iterate on findings.
- Week 4: Support engineering implementation, run design QA, and prepare release assets.

## 12. Approval Workflow
- Design leadership sign-off on hi-fi mocks.
- Product stakeholders approval post-usability validation.
- Engineering leads approval on component feasibility and performance considerations.
