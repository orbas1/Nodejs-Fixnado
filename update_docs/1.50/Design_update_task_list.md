# Version 1.50 Design Task List

| # | Task | Owner Squad | Duration (est.) | Dependencies | % Complete |
|---|------|-------------|-----------------|--------------|------------|
| D1 | Token & System Foundation | Design Systems Guild | 2 weeks | Existing design inventories, accessibility audit inputs | 70% |
| D2 | Navigation & IA Harmonisation | Product Experience Team | 2.5 weeks | Task D1 tokens, stakeholder IA review | 71% |
| D3 | Page Templates & Partial Library | Growth Experience Pod | 3 weeks | Tasks D1–D2 | 66% |
| D4 | Theme & Visual Narrative Development | Brand & Campaign Studio | 2 weeks | Task D1 token outputs | 0% |
| D5 | Mobile Parity & Component Adaptation | Mobile Experience Pod | 2.5 weeks | Tasks D1–D4 | 82% |
| D6 | Design QA, Documentation & Handover | Design Ops & QA | 2 weeks | Tasks D1–D5 | 28% |

---

## Task D1 – Token & System Foundation (64%)
**Objective:** Create a unified token library, baseline components, and accessibility guardrails.

**Subtasks (11):**
1. ✅ Audit `Colours.md`, `Screen_update_Screen_colours.md`, and `colours.md` to map overlaps and gaps.
2. ✅ Define colour token naming convention (core, accent, semantic) and store in shared library.
3. ✅ Establish typography scale and fallback stack referencing both application and web font specs.
4. ✅ Document spacing, elevation, and radius tokens aligned with component density guidelines.
5. ✅ Produce baseline component specs for buttons, cards, chips, alerts, and form elements.
6. Configure Style Dictionary (or equivalent) pipeline exporting JSON/Sass/Flutter tokens.
7. ✅ Draft focus, hover, pressed, and disabled state patterns including motion parameters.
8. ✅ Validate tokens against WCAG AA/AAA thresholds and annotate failures.
9. Create sample component usage pages demonstrating token application across themes.
10. Socialise token documentation with engineering teams for early feedback.
11. ✅ Extend semantic token catalogue with rate-limit, CORS, consent, and PII incident alert states aligned to backend messaging.

**Progress Notes:** Vault-managed status badges, secrets rotation callouts, and Postgres provisioning storyboards were added to the foundational token library, aligning security messaging with the new infrastructure workflows while nudging QA/ops documentation forward. Operational readiness icons, badge tones, and alert copy tied to `/readyz` states were added to the token set so deployment dashboards, release runbooks, and observability mock-ups mirror the backend readiness telemetry introduced in Task 1.

## Task D2 – Navigation & IA Harmonisation (48%)
**Objective:** Align navigation patterns, menus, and information architecture for web and Flutter clients.

**Subtasks (9):**
1. ✅ Consolidate navigation requirements from `Menus.md`, `Menus.md.md`, and logic flow maps.
2. Produce mega menu architecture with category clustering, shortcuts, and CTA slots.
3. ✅ Design dashboard sidebars and quick-action drawers for each user role.
4. Document breadcrumb patterns, contextual tabs, and in-page anchor behaviour.
5. Define notification tray layout including alerts, AI suggestions, and compliance warnings.
6. Create Flutter navigation parity plan (tab vs. drawer vs. bottom sheet) with breakpoints.
7. ✅ Overlay compliance messaging (consent, security notices) across navigation touchpoints.
8. Run moderated usability tests on desktop/tablet/mobile prototypes and capture insights.
9. Update IA documentation and publish to the knowledge base for cross-team consumption.

**Progress Notes:** Hardened RBAC matrix outputs were translated into annotated navigation blueprints for every persona, covering landing routes, sidebar groupings, compliance badge placements, and Flutter parity notes. Policy audit chips, denial copy decks, and audit log drawer patterns were added to the navigation kit, ensuring policy middleware feedback is visible in dashboard shells and raising D2 completion. The compliance portal entry card now lives inside the Flutter profile’s legal pane, validating cross-platform IA decisions and updating prototypes with explicit GDPR access pathways. Warehouse operations console user journeys now map dataset pickers, retention countdown chips, and DPIA help footers across both React and Flutter shells, closing IA gaps for manual trigger workflows and monitoring dashboards. Latest deliverables include a production-ready mega menu specification, responsive footer IA diagram, and Flutter workspaces card layouts, unlocking engineering implementation for the navigation overhaul.

## Task D3 – Page Templates & Partial Library (66%)
**Objective:** Build modular page templates and partial sections enabling rapid assembly of marketing and product surfaces.

**Subtasks (12):**
1. ✅ Prioritise page list from `Screens_list.md`, `pages.md`, and `Pages_list.md` for redesign.
2. Create hero section variants (static, carousel, video, emo overlay) with responsive rules.
3. Design feature grid partials with iconography, copy blocks, and CTA placement.
4. Develop testimonial and social proof modules for marketing pages.
5. Define pricing/package comparison tables referencing `Package designs.md`.
6. ✅ Rebuild dashboard overview template with KPI ribbons, task queues, and compliance widgets.
7. Map creation studio wizard steps with inline previews and validation messaging.
8. ✅ Design finance/escrow timeline cards and dispute resolution checklists.
9. Produce component usage documentation for partials, including spacing and theme overrides.
10. Assemble partial library into reusable Figma/UXPin master components.
11. Create dummy-data scaffolding guidelines for QA/staging use.
12. Review templates with marketing, product, and compliance stakeholders for alignment.
13. ✅ Validate provider dashboard and business front templates against restored backend payloads; document evidence in design QA backlog.

**Progress Notes:** Creation studio blueprints now have responsive wizard flows, autosave panels, compliance checklist overlays, and slug validation messaging documented for both React and Flutter implementations. The partial library gained creation summary cards, pricing grids, and publish confirmation states with annotated dummy-data scaffolding, while finance escalation templates remain aligned with the alert fan-out contract. These artefacts, alongside refreshed navigation callouts for the solutions mega menu, lift Task D3 completion into the high-50% range and hand design-ready references to engineering.

## Task D4 – Theme & Visual Narrative Development (0%)
**Objective:** Deliver theme variants (default, industrial, premium, emo) with imagery and motion guidance.

**Subtasks (8):**
1. Draft mood boards and art direction for each theme using asset inventories.
2. Define theme token overrides (colour, typography accents, motion intensity).
3. Establish imagery and illustration guidelines including emo-theme overlays.
4. Create motion design specifications for hero transitions, button feedback, and loading states.
5. Document microcopy tone adjustments required per theme (e.g., emo vs. enterprise).
6. Produce theme preview prototypes for key pages (home, dashboard, creation studio).
7. Validate theme accessibility, ensuring compliance with contrast and motion preferences.
8. Publish theme adoption playbook for engineering and marketing teams.

## Task D5 – Mobile Parity & Component Adaptation (82%)
**Objective:** Translate web patterns into Flutter-ready components with parity across user and provider apps.

**Subtasks (11):**
1. ✅ Inventory Flutter screens from application update files and match them to web counterparts.
2. Adapt card, list, and widget components to Material 3 standards with shared tokens.
3. Design navigation transitions (tab ↔ drawer) with gesture support and accessibility cues.
4. ✅ Build mobile forms with inline validation, multi-step progress, and secure input states.
5. ✅ Align messaging threads with AI-assist overlays, attachment trays, and emo theme variants.
6. ✅ Create finance module layouts (payouts, disputes, wallets) aligned with web dashboards.
7. ✅ Document offline/loading placeholders mirroring web skeleton patterns.
8. Specify push notification banners, in-app alerts, and settings toggles.
9. Provide asset sizing and compression guidelines for mobile packaging.
10. Coordinate with engineering on component feasibility and edge cases.
11. ✅ Prepare parity checklist verifying feature coverage, theme support, and compliance cues.

**Progress Notes:** Flutter finance dashboard specs now mirror the React experience with shared KPI ribbons, dispute funnels, payout readiness chips, regulatory alert cards, and the escalation trays/acknowledgement flows documented for Slack/Opsgenie parity. Latest updates swap chip-based currency exposure for responsive cards with pending balance callouts, tighten timeline density guidance, and align accessibility cues so compact devices avoid overflow. Creation studio parity pack introduces mobile blueprint cards, autosave status chips, compliance checklists, and publish confirmation overlays, fully documenting navigation hooks, localisation behaviour, and accessibility cues for Flutter. Consent overlays, compliance cards, and warehouse export tooling remain in parity, and new guidance covers finance empty/error states plus timeline gestures to support mobile-first operations teams.

## Task D6 – Design QA, Documentation & Handover (28%)
**Objective:** Finalise design QA artefacts, documentation, and engineering handover materials.

**Subtasks (9):**
1. Compile design QA checklist covering accessibility, theming, responsive behaviour, and localisation.
2. Run visual regression baselines (per theme) using automated comparison tools.
3. Validate component implementations against specs via collaborative reviews with engineering.
4. Document known gaps, follow-up tasks, and backlog items for post-1.50 iterations.
5. Produce handover kits (annotated specs, asset bundles, token files, redlines).
6. Update `Design_Change_log.md` with finalised adjustments and approval signatures.
7. Create implementation playbooks for marketing partials, dashboards, and creation studio flows.
8. Coordinate with QA to integrate design checkpoints into overall test plan.
9. Conduct final stakeholder walkthrough and capture sign-off artefacts.

**Progress Notes:** Compiled QA checklist entries for the warehouse operations console and the new finance escalation flows, including annotation guidelines, alert badge colour references, responder acknowledgement paths, and DPIA documentation link placements so engineering handover kits capture the compliance and finance workflows. Added operational readiness and finance alert handover notes describing `/readyz` states, alert palette references, Slack/Opsgenie copy decks, and deployment dashboard mock-ups so release management receives design-backed guidance for the new telemetry. Creation studio QA packs now bundle wizard stepper audits, localisation spot checks (including RTL Arabic copy), publish confirmation redlines, and changelog cross-references so design, engineering, and release teams can evidence parity and accessibility across platforms.
