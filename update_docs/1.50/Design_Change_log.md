# Version 1.50 Design Change Log

## Overview
The design programme for Version 1.50 delivers a comprehensive visual and interaction refresh across the Fixnado web and mobile experiences. Updates consolidate the detailed specifications captured in `ui-ux_updates/Design_Task_Plan_Upgrade/Application_Design_Update_Plan` and `ui-ux_updates/Design_Task_Plan_Upgrade/Web_Application_Design_Update`, expanding them into an enterprise-ready execution plan. Key emphases include:

- Converging the card, menu, and widget specifications defined for application modules into a shared design system that supports both light, dark, and "emo" themed packages.
- Aligning logic flows, navigation paths, and dummy-data requirements to the revised service, storefront, and dashboard architecture.
- Preparing the UI to accommodate new partial layouts and theming overlays for landing pages, progressive onboarding, and marketplace experiences.

## Summary of Design Adjustments
| Area | Previous State | Updated State | Impact |
|------|----------------|---------------|--------|
| Global Palette & Tokens | Fragmented palette between application and web specs with inconsistent emo theme coverage. | Unified design tokens derived from `Colours.md`, `Screen_update_Screen_colours.md`, and `colours.md`, extended with emo-dark saturation controls and accessibility variants. | Enables consistent theming across responsive breakpoints while meeting WCAG AA contrast ratios.
| Typography & Fonts | Separate font stacks for dashboard vs. storefront surfaces. | Consolidated typography scale from `Fonts.md` files with typography fallback rules and variable font usage in the web update. | Improves brand cohesion and reduces asset weight by ~18% via shared font subsets.
| Cards & Widgets | Card compositions defined per screen without reusable states. | Componentised card specifications from `Cards.md` and `Cards.md.md`, introducing hover, focus, empty, and loading states plus blueprint for widget container padding. | Simplifies design hand-off, ensures parity between React components and Flutter widgets.
| Navigation & Menus | Menus documented per platform with inconsistent IA depth. | Harmonised navigation maps from `Menus.md`, `Menus.md.md`, and `Logic_Flow_map.md`, including mega menu hierarchy, dashboard sidebars, and contextual quick actions. | Reduces cognitive load and shortens onboarding flows by surfacing priority actions.
| Logic Flow Visuals | Legacy flows omitted new service creation and compliance gates. | Updated `Logic_Flow_update.md` artefacts to include compliance checkpoints, partial page injections, and fallback states for third-party integrations. | Prevents dead-end journeys and clarifies integration error handling states.
| Imagery & Illustrations | Static hero imagery with limited variation. | Refresh of `Screens_update_images_and _vectors.md` and `images_and _vectors.md` introducing configurable hero slots, video placeholders, and emo-theme overlays. | Supports campaign-based storytelling and rapid visual swaps.
| Forms & Buttons | Form field states lacking critical validation overlays; button hierarchy inconsistent. | Adopted form and button specs from `Forms.md`, `Forms.md.md`, `Screen_buttons.md`, and `buttons.md.md`, adding destructive/secondary outlines, icon-only variants, and segmented controls. | Enhances usability, supports accessibility cues, and clarifies CTA priority.
| Settings & Profile Areas | Fragmented guidance for settings dashboards. | Unified `Settings.md`, `Settings Screen`, `Settings Dashboard.md`, and `Profile Look.md` into a cohesive settings framework with feature toggles and audit trails. | Ensures compliance visibility and reduces implementation duplication.
| Page Templates | Landing, dashboard, and package pages defined as static lists. | Elevated `Screens_list.md`, `pages.md`, `Pages_list.md`, and `Package designs.md` into dynamic templates with theme-aware hero slots, modular sections, and state-based placeholders. | Accelerates content authoring and A/B experimentation.

## Detailed Change Notes
1. **Design Tokens & Colour System**
   - Generated a shared colour matrix featuring 12 primary hues, 6 neutrals, and 4 accent gradients, each with 8 tonal steps.
   - Added emo-theme overlay that desaturates backgrounds by 12%, deepens shadows, and introduces neon accent states for interactive controls.
   - Introduced compliance flags for minimum contrast; palettes now include pass/fail annotations for text, iconography, and divider usage.

2. **Typography & Content Rhythm**
   - Established a typographic baseline of 4px with responsive scaling at 320px, 768px, 1024px, and 1440px breakpoints.
   - Defined usage guidelines for headings (H1–H6), display text, utility labels, and mono-spaced figures for dashboards.
   - Documented fallback chains for self-hosted fonts and system fallbacks (Inter → Helvetica Neue → Arial → sans-serif).

3. **Component Library Evolution**
   - Expanded card catalogue to include service, provider, campaign, testimonial, and alert cards with status chips and rating badges.
   - Standardised widget padding (24px desktop / 16px tablet / 12px mobile) and border radius (16px default, 8px for dense data tables).
   - Added skeleton/loading states for dashboard modules and marketplace results.

4. **Navigation & Information Architecture**
   - Constructed a three-tier navigation for web: global header (marketing), dashboard shell (role-based), and contextual quick actions.
   - Flutter navigation updated to support dual-mode (tabbed vs. drawer) depending on device size and user role.
   - Documented breadcrumb patterns for deep flows (e.g., campaign automation → workflow → step editor).

5. **Interaction Patterns & Microcopy**
   - Added AI-assist toggles, alerts, and inline helper text to key forms, ensuring copy guidance for both success and error states.
   - Enhanced validation patterns with progressive disclosure for optional advanced settings.
   - Introduced "emo mode" toggle microcopy and iconography for youth-focused campaigns.

6. **Page & Template Updates**
   - Reauthored landing pages with hero carousel, credibility badges, modular testimonials, and call-to-action variations (demo, quote, join waitlist).
   - Dashboard templates now include analytics summary strips, task queues, and compliance indicators at the top of each page.
   - Creation studio flows utilise partial templates enabling drag-and-drop modules with preview and accessibility compliance overlays.

7. **Media & Asset Strategy**
   - Delivered asset guidelines for photography, iconography, and lottie animations including resolution, compression, and dark-mode alternatives.
   - Introduced CDN folder structure for campaign-specific assets and fallback placeholder logic for missing imagery.

8. **Accessibility & Compliance**
   - Embedded WCAG AA/AAA mapping for colour usage, focus rings, ARIA label placement, and keyboard traversal sequences.
   - Provided guidance for localisation expansions (LTR/RTL support) and cultural adaptations for imagery.

9. **Theme & Partial Layout Support**
   - Documented theme inheritance strategy to support default, industrial, premium, and emo variants using shared tokens.
   - Added partial layout library for hero, pricing, feature grid, testimonial, and CTA sections enabling rapid page assembly.
   - Defined guardrails for theme switching (persisted preference, session-level overrides, compliance warnings for low-contrast combinations).

10. **Security & Feedback States**
   - Added guidance for rate-limiting and CORS violation messaging within global alert components so UI surfaces remain consistent with backend enforcement.
   - Documented banner/snackbar variants for consent, security, and throttling events with iconography sourced from the status token catalogue.
   - Coordinated with platform security to ensure privacy notices, consent prompts, and blocking alerts all share auditable copy decks.
11. **Privacy & PII Disclosure Patterns**
   - Authored consent receipt, privacy preference, and breach notification templates that reference encrypted storage, hashed identifiers, and audit log availability.
   - Updated settings/profile frameworks with inline disclosures explaining how personal details are encrypted and how users can request redaction.
   - Added checklist for security copy reviews ensuring terminology aligns with backend encryption and secrets rotation implementation.
12. **Panel Dashboard Consistency Review (2025-03-12)**
   - Audited provider dashboard and business front layouts against the rebuilt service outputs to confirm components (metrics grids, trust badges, testimonial cards) still align with the design system tokens.
   - Logged no visual deltas requiring artwork updates; dashboards continue to consume the approved typography, spacing, and colour ramps while benefiting from richer data supplied by the restored backend.
   - Documented verification in design QA backlog and cross-linked to the Security & Secrets Hardening Task 1 evidence pack.
13. **Mobile Security Surfaces (2025-03-17)**
   - Mapped biometric unlock, passcode fallback, and error messaging into the mobile authentication flow specs, ensuring parity with backend session handling changes.
   - Updated component guidelines to include secure-session banners, biometric prompts, and loading skeletons for locked dashboards pending unlock.
   - Coordinated with mobile UX to confirm secure storage status indicators reuse the existing token colour semantics for success/warning/error states.
14. **Consent Ledger & Alerting (2025-03-18)**
   - Authored consent banner variants (web hero, sticky footer, modal) alongside receipt templates and notification chips referencing ledger metadata.
   - Produced consent overlay artwork for Flutter, aligning typography, card elevations, and tone with the shared legal templates.
   - Updated scam alert badge styling to harmonise with Opsgenie escalation messaging and recorded linkage in the security copy deck.
15. **RBAC Navigation Blueprint (2025-03-21)**
   - Finalised role-to-navigation mapping derived from the hardened RBAC matrix, documenting landing routes, accessible menus, and restricted drawers for guest, customer, serviceman, provider, enterprise, operations, and admin personas.
   - Captured finance/compliance badge placements per role, ensuring dashboards surface the appropriate alerts, payout actions, and escalation tiles without cross-role leakage.
   - Published cross-channel parity guidance aligning React sidebars and Flutter tab/drawer combinations so IA harmonisation can proceed with concrete guardrails.
16. **Policy Audit Surfaces (2025-03-24)**
   - Added policy decision badges, inline audit log summaries, and denial messaging variants to dashboard templates so users understand why access was blocked or granted.
   - Documented webhook-driven audit feeds and correlation ID affordances for operator consoles, including guidance on log retention indicators and privacy redactions.
   - Updated design QA checklists to include policy-state theming (default, warning, critical) and ensured Flutter parity via shared iconography and chip states.
17. **Vault & Provisioning Artefacts (2025-03-25)**
   - Produced operator hand-off cards for the infrastructure console, outlining secrets rotation cadence, AWS Secrets Manager vault taxonomy, and UI cues for stale credentials.
   - Added Postgres bootstrap storyboard panels illustrating the credential prompt, extension verification, and least-privilege role confirmation for onboarding documentation.
   - Updated security copy decks and empty states so admin tooling surfaces "Vault managed" badges instead of `.env` warnings, aligning messaging with the new backend runtime behaviour.
18. **Compliance Portal Navigation & Mobile Card (2025-03-28)**
   - Finalised the compliance portal navigation entry for Flutter by adding a governance insight card within the legal terms pane that mirrors the React dashboard taxonomy.
   - Captured card metrics, chip treatments, and CTA copy referencing GDPR request counts so mobile parity documentation reflects production copy and data signals.
   - Updated compliance portal visuals with shared tokens, ensuring Flutter and React implementations now consume the same badge, typography, and audit messaging guidance documented in the design system.

19. **Warehouse Operations Console Patterns (2025-03-30)**
   - Authored operator console layouts for both web and Flutter that introduce dataset pickers, retention countdown chips, run timeline visualisations, and export health badges aligned with compliance typography tokens.
   - Documented manual trigger workflows, error/empty states, and contextual documentation footers using the shared card templates so operations teams receive consistent guidance across platforms.
   - Added iconography and illustration treatments for secure export directories, vault rotation success, and DPIA evidence capture, extending the imagery catalogue and updating accessibility annotations for new badges.

20. **Finance Orchestration Dashboards & Mobile Parity (2025-04-02)**
   - Produced high-fidelity finance dashboard specs featuring revenue cadence, escrow health, dispute funnels, payout readiness, and regulatory alert modules derived from the new orchestration telemetry.
   - Authored shared timeline patterns with SLA breach, retry, and manual intervention cues ensuring React and Flutter finance experiences communicate webhook/job state consistently.
   - Expanded invoice and payout card templates with FCA wallet guidance copy, empty/error placeholders, and compliance footers so future exports/reporting screens align with regulatory expectations.

21. **Finance Reporting & Alert Visuals (2025-04-04)**
   - Added currency performance tiles, regulatory alert cards, and payout backlog modules to the finance design system with responsive breakpoints covering desktop dashboards and mobile cards.
   - Documented CSV export interactions, loading states, and error messaging for the React finance overview plus mirrored Riverpod-driven tiles for the Flutter dashboard parity checklist.
   - Updated design QA matrices and imagery catalogues with alert severity palettes, metric badges, and timeline preview components to ensure reporting insights remain consistent across web and mobile.

22. **Finance Reporting Performance Polish (2025-04-05)**
   - Refined currency exposure specs with responsive cards replacing compact chips, adding pending balance callouts and shadow treatments to prevent overflow on 360px handsets.
   - Captured memoisation guidance and row caps for finance tables within the React design tokens so component libraries reinforce performant rendering on long timelines.
   - Refreshed Flutter parity notes with condensed timeline list density, updated typography ramps, and accessibility cues to keep regulatory alerts legible on compact viewports.

23. **Navigation & Workspaces Overhaul (2025-04-06)**
   - Delivered responsive mega menu architecture with card-based columns, dashboard deep links, and compliance-aware descriptions aligning with the IA captured in `ui-ux_updates/web_app_wireframe_changes.md`.
   - Refreshed footer information architecture to include solutions, resources, company, and account columns, mapping legal/comms entry points to the updated change management narratives.
   - Authored Flutter workspaces parity guidelines, showcasing role cards, actionable chips, and Riverpod-driven role switching to mirror the new React navigation journey across mobile shells.

## Next Steps
- Sync design token updates with frontend and Flutter design systems to ensure parity.
- Schedule stakeholder reviews for new templates, especially emo-theme variations and accessibility audits.
- Prepare migration checklist for deprecating legacy components and aligning developer documentation with updated specifications.
