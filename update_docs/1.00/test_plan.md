# Version 1.00 — UI/UX Validation Test Plan

## Overview
This plan operationalises Task DT5 and Milestone DM4. It bridges design artefacts (`ui-ux_updates/design_validation_and_handoff.md`, blueprint directories, and drawings) with engineering/QA execution to ensure accessibility, compliance, and telemetry acceptance criteria are verifiably met prior to launch.

## Scope
- **Web (React):** Theme Studio, Admin Dashboard, Home, Profile, Services, Auth flows, Search, Feed.
- **Mobile (Flutter Apps):** Provider kanban & compliance flows, User booking wizard, Chat & notifications.
- **Shared Systems:** Theme token exports, marketing imagery guardrails, telemetry beacons (`kafka.ui-preferences.v1`).

## Test Matrix
| Area | Test Type | Owner | Tooling | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Theme Studio | Accessibility regression | Accessibility SME | Playwright + axe-core (Sprint 5), manual VoiceOver/TalkBack | `PreferenceChangeAnnouncer` announces theme/density/contrast changes; focus outlines meet contrast thresholds documented in `Screen_update_Screen_colours.md`. |
| Theme Studio | Functional telemetry | Frontend QA + Data Engineering | Cypress (event capture), Kafka consumer harness, API contract tests | `fixnado:theme-change` event and beacon payload include theme/density/contrast/marketingVariant/tenantId/role/locale; `/api/telemetry/ui-preferences/summary` returns aggregated counts with latestEventAt freshness < 10m. |
| Theme Studio | Visual regression | Frontend QA | Chromatic (post Storybook uplift) | Snapshot deltas below 0.2% threshold across light/dark/emo variants. |
| Admin Dashboard | Accessibility + navigation | Frontend QA | Cypress + axe-core | Widget tab order matches `Dashboard Organisation.md`; compliance export button accessible and gated. |
| Home & Services | Content compliance | Marketing Ops + Legal | Manual review | Copy matches `Home page text.md`, disclaimers present, consent CTA routes to flagged flows. |
| Auth Flows | Security telemetry | Security Analyst | Jest + mocked analytics pipeline | `auth_step` telemetry hashed email and includes locale/timezone metadata; no plaintext PII. |
| Provider Mobile | Usability & compliance | UX Research + Mobile QA | Maestro scripts + moderated study | 90% task success for kanban transitions; compliance gating mirrors `provider_app_wireframe_changes.md`. |
| User Mobile | Accessibility | Accessibility SME + Mobile QA | Flutter driver + TalkBack session | Booking stepper voice guidance matches script; chat composer accessible. |
| Marketing Imagery | Compliance | Legal + Marketing | Manual review vs. `Screens_update_images_and_vectors.md` | Emo imagery approved and recorded; seasonal overlays follow guardrails. |

## Automation Strategy
1. **Playwright + axe-core**: Integrate `ui-qa-scenarios.csv` to drive deterministic flows for Theme Studio and Admin dashboard once Sprint 5 begins.
2. **Chromatic Baselines**: Generate Storybook stories for Theme Studio cards, marketing modules, and blueprint headers; integrate Chromatic thresholds into CI.
3. **Telemetry Validation**: Use staging topic `kafka.ui-preferences.v1` plus `/api/telemetry/ui-preferences/summary` contract tests to confirm payload ingestion, aggregation accuracy, and hashed IP governance before enabling GA.
4. **Maestro & Flutter Driver**: Script booking wizard, kanban transitions, and compliance flows; capture video evidence for audits.

## Schedule
| Date | Activity | Owner(s) | Notes |
| --- | --- | --- | --- |
| 3 Feb | Sprint 4 QA desk check | Design Ops, Frontend QA | Review instrumentation, align Chromatic baseline plan. |
| 5 Feb | Accessibility audits (Stark + manual) | Accessibility SME, Compliance Officer | Validate dark/emo palettes; log defects in tracker. |
| 7 Feb | Legal & marketing approvals | Legal Counsel, Marketing Strategist | Approve emo imagery, consent copy, marketing variants. |
| 9 Feb | Remote usability sessions | UX Research | Validate personalisation discoverability and clarity of new copy. |
| 12 Feb | Engineering handoff readout | Frontend Tech Lead, Flutter Lead, QA Lead, Data Engineering | Finalise automation backlog, validate telemetry dashboards, and close open issues prior to release branch freeze. |

## Reporting & Escalation
- Daily Slack digest summarising defect count, accessibility findings, telemetry anomalies.
- Weekly steering update referencing tracker grades and outstanding risks.
- Severity 1/2 issues trigger immediate triage with Product, Engineering, and Compliance; exit criteria require zero critical accessibility or compliance defects.

## Exit Criteria
- Accessibility: No critical WCAG 2.2 issues; contrast audit signed off with fallback tokens ready.
- Compliance: Legal sign-off on emo imagery and consent copy documented in playbook; GDPR telemetry validated.
- QA: Automation suite coverage ≥80% for Theme Studio interactions; Maestro scripts executed without blocker defects.
- Telemetry: `theme_change` and `auth_step` events visible in Looker dashboard with correct segmentation; `/api/telemetry/ui-preferences/summary` freshness under 10 minutes for pilot tenants.
- Documentation: Playbook, test plan, and trackers updated with evidence links and outstanding backlog items.
