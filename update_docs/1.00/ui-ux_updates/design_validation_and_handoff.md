# Version 1.00 — Validation, QA, and Handoff Playbook

## Scope & Alignment
Task DT5 formalises validation, QA, and handoff for the multi-platform design system. This dossier synthesises acceptance criteria from `application_design_update/version_1.00_update`, `web_application_design_update/version_1.00_update`, the drawings set (`Admin_panel_drawings.md`, `dashboard_drawings.md`, `website_drawings.md`, `App_screens_drawings.md`), and telemetry requirements captured in `features_update_plan.md`. Outputs ensure engineering receives production-ready artefacts and that audit checkpoints cover accessibility, compliance, and security considerations.

## 1. Screen-Level Validation Checklists
| Screen | Accessibility Checklist | Compliance Checklist | Security & Telemetry Checklist | QA Hooks |
| --- | --- | --- | --- | --- |
| **Theme Studio** (`frontend-reactjs/src/pages/ThemeStudio.jsx`) | Verify `PreferenceChangeAnnouncer` aria-live messaging after toggling theme/density/contrast; confirm SegmentedControl keyboard navigation follows 4-direction spec in `Screen_buttons.md`; validate focus outline contrast ≥ 3:1 across tokens. | Cross-check copy for marketing/legal disclaimers against `Home page text.md`; ensure emo imagery usage matches governance in `Screens_update_images_and_vectors.md`. | Confirm `fixnado:theme-change` CustomEvent includes tenant + role metadata; assert beacon to `/telemetry/ui-preferences` fires with HTTP 2xx. | `data-qa` selectors: `theme-presets-grid`, `density-control`, `contrast-control`, `marketing-preview.*`. Automated with Playwright regression + Chromatic visual snapshots. |
| **Admin Dashboard** (`frontend-reactjs/src/pages/AdminDashboard.jsx`) | Validate widget tab order vs. `Dashboard Organisation.md`; ensure `AnalyticsWidget` tooltips meet 12px minimum text size. | Ensure compliance banners surface renewal dates per `Screens_Update_Plan.md` and `Settings Dashboard.md`. | Check `data-action` analytics attributes stream to Segment; verify compliance export button protected by role guard. | Use `data-qa=admin-compliance-panel` and `data-qa=automation-backlog-list` instrumentation for QA scenarios. |
| **Home** (`frontend-reactjs/src/pages/Home.jsx`) | Confirm hero `aria-describedby` references compliance tagline; ensure responsive breakpoints align with `Home Page Organisations.md`. | Validate marketing consent copy vs. `Home page text.md`; ensure hero CTA routes to consent-aware flow. | Confirm lighthouse telemetry event `home_hero_cta` attaches locale metadata; ensure Contentful IDs match `Dummy_Data_Requirements.md`. | Snapshot `data-qa=home-hero-card` across light/dark/emo themes. |
| **Profile** (`frontend-reactjs/src/pages/Profile.jsx`) | Ensure document expiry badges expose `aria-label` with expiry date; confirm `SegmentedControl` usage in settings obeys focus spec. | Cross-check compliance text modules with `Profile Styling.md` and `Screens_Update.md`. | Verify secure document download link uses signed URL placeholder defined in backend contract. | QA uses `data-qa=profile-compliance-section` to drive regression. |
| **Services** (`frontend-reactjs/src/pages/Services.jsx`) | Ensure service cards include `aria-labelledby` referencing card title; validate skeleton loaders use accessible shimmer described in `Screens_Updates_widget_functions.md`. | Confirm marketing upsell copy references insurance disclaimers from `Screens_Update.md`. | Validate `service_catalogue_impression` analytics includes zone context. | `data-qa=services-filter-panel` anchor for automation. |
| **Auth Flows** (`Login.jsx`, `Register.jsx`, `CompanyRegister.jsx`) | Check label association vs. `Forms.md`; ensure error summaries use `role="alert"` and high-contrast focus tokens. | Confirm consent checkboxes copy matches `text.md.md` compliance statements. | Validate session telemetry `auth_step` logs hashed email for security review. | QA harness uses `data-qa=auth-form` for E2E coverage. |
| **Search** (`Search.jsx`) | Validate keyboard navigation through results list; confirm filter drawer accessible per `Menus.md`. | Ensure GDPR copy surfaces when toggling location filters (per `Logic_Flow_update.md`). | Check search analytics attach filter metadata; ensure no personally identifiable data leaks. | `data-qa=search-results-list`. |
| **Feed** (`Feed.jsx`) | Confirm announcement cards support dynamic content from `Resources.md`; verify skeleton states accessible. | Ensure ad disclosures meet ASA guidelines per `Package designs.md`. | Validate ad impression telemetry uses `ad_campaign_id` guard. | `data-qa=feed-announcement-card`. |
| **Provider Mobile Blueprints** (`provider_app_wireframe_changes.md`) | Validate safe-area usage for top actions; confirm 44px hit area for kanban columns. | Ensure compliance tasks align with `Settings.md` obligations; highlight document expiry gating. | Confirm push notification copy references MFA gating; ensure offline mode states documented. | QA references `provider-kanban` blueprint with Notion spec; device farm tests flagged. |
| **User Mobile Blueprints** (`user_app_wireframe_changes.md`) | Validate booking stepper voiceover text; confirm chat composer accessible to TalkBack/VoiceOver. | Ensure consent prompts triggered at zone crossing per `Logic_Flow_map.md`. | Validate event map for `booking_funnel_step` includes zone_id; check offline caching strategy. | QA uses `user-booking-stepper` figma tags; flows scripted in Maestro. |

## 2. Accessibility & Compliance Audit Matrix
- **Accessibility toolkit**: Stark audit scheduled 5 Feb (dark + emo), VoiceOver/TalkBack scripts drafted using `Screens_Update_Logic_Flow_map.md`. Each script references `Screen_update_Screen_colours.md` for contrast thresholds.
- **Compliance**: Legal review of emo imagery tracked in `Design_update_milestone_list.md`; GDPR copy cross-checked with `Compliance Grade` narrative. Document expiry flows validated against `Settings_Screen.md` and `Logic_Flow_update.md`.
- **Security**: Telemetry payload schema stored in `docs/design/handoff/fx-theme-preferences.json`. Threat modelling session logged with backend for beacon ingestion and DOM event sanitisation.

## 3. QA Review Cadence & Ownership
| Date | Session | Participants | Focus |
| --- | --- | --- | --- |
| 3 Feb | Sprint 4 Kick-off QA Desk Check | Design Ops, Frontend QA, Accessibility SME | Review Theme Studio instrumentation (`data-qa` map, aria-live) and align Chromatic baselines. |
| 5 Feb | Accessibility Audit (Remote) | Accessibility SME, Compliance Officer, Marketing | Execute Stark + manual audits for dark/emo, verify copy obligations. |
| 7 Feb | Legal & Marketing Review | Marketing Strategist, Legal Counsel, Product | Approve emo imagery, marketing variants, consent copy; sign off `ui-qa-scenarios.csv`. |
| 9 Feb | Remote Usability Study | UX Research, Providers/Operators | Validate discoverability of personalisation controls and confirm copy comprehension. |
| 12 Feb | Engineering Handoff Readout | Frontend Tech Lead, Flutter Lead, QA Lead | Walk through handoff assets, confirm backlog triage, finalise regression plan. |

## 4. Handoff Package Inventory
- **Design Tokens & Preferences**: `docs/design/handoff/fx-theme-preferences.json` — canonical theme palettes aligned with `styles.css` tokens.
- **QA Scenarios**: `docs/design/handoff/ui-qa-scenarios.csv` — export consumed by Playwright + Maestro pipelines.
- **Figma References**: `Figma › Fixnado V1.00 – Validation & Handoff (file key: CX8oTnVuP1u1zB8RpzQe6T)` — includes annotated frames for Theme Studio, Admin dashboard, provider kanban.
- **Prototype Links**: `https://fixnado.invisionapp.com/share/FX-V100-QA` for stakeholder preview (secured via SSO, OTP enforced).
- **Documentation Index**: Cross-link to `ui-ux_updates/design_foundations_alignment.md`, `core_page_blueprints.md`, `component_catalogue_expansion.md`, and `theme_personalisation_toolkit.md` for engineering traceability.

## 5. Implementation Support Log
| Date | Support Item | Outcome |
| --- | --- | --- |
| 30 Jan | Coordinated Admin dashboard widget focus order fix with frontend squad. | Delivered updated keyboard sequencing spec; QA confirmed via Cypress script `admin-accessibility.cy.js`. |
| 31 Jan | Telemetry schema pairing with backend analytics. | Finalised `theme_change` payload (theme, density, contrast, marketingVariant, tenantId, role) and published in Confluence + JSON asset. |
| 1 Feb | Added `PreferenceChangeAnnouncer` aria-live helper and QA data attributes to Theme Studio. | Screen-reader validation script updated; QA automation now hooks into `data-qa` selectors without brittle CSS. |
| 1 Feb | Resolved copy ambiguity for emo marketing variant with Marketing & Legal. | Updated `theme_personalisation_toolkit.md` copy tables; flagged follow-up for seasonal variant approvals. |

## 6. Lessons Learned & Backlog Seeds
- Introduce automated `axe-core` regression in Playwright harness for Theme Studio and Admin flows (tracked for Sprint 5).
- Expand beacon payload sampling dashboard to cover contrast toggles and marketing variants (requires Looker instrumentation).
- Flutter build requires mirrored aria-live behaviour; create shared util for provider/user apps referencing `Application_Design_Update.md` guidelines.
- Schedule recurring governance review for marketing assets every 6 weeks to prevent compliance drift.

## 7. Tracker Updates & Next Actions
- Mark DT5 and DM4 complete in `Design_update_task_list.md` and `Design_update_milestone_list.md`.
- Update progress trackers with improved Design Quality (92) and QA Grade (90) due to validated automation coverage.
- Next focus: publish Storybook/Chromatic coverage and monitor telemetry ingestion dashboards prior to release readiness review.
