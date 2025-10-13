# Version 1.00 — UI/UX Validation Test Plan

## Overview
This plan operationalises Task DT5 and Milestone DM4. It bridges design artefacts (`ui-ux_updates/design_validation_and_handoff.md`, blueprint directories, and drawings) with engineering/QA execution to ensure accessibility, compliance, and telemetry acceptance criteria are verifiably met prior to launch.

## Scope
- **Web (React):** Theme Studio, Admin Dashboard, Telemetry Dashboard, Home, Profile, Services, Auth flows, Search, Feed.
- **Mobile (Flutter Apps):** Provider kanban & compliance flows, User booking wizard, Chat & notifications.
- **Shared Systems:** Theme token exports, marketing imagery guardrails, telemetry beacons (`kafka.ui-preferences.v1`).

## Test Matrix
| Area | Test Type | Owner | Tooling | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Theme Studio | Accessibility regression | Accessibility SME | Playwright + axe-core (Sprint 5), manual VoiceOver/TalkBack | `PreferenceChangeAnnouncer` announces theme/density/contrast changes; focus outlines meet contrast thresholds documented in `Screen_update_Screen_colours.md`. |
| Theme Studio | Functional telemetry | Frontend QA + Data Engineering | Cypress (event capture), Kafka consumer harness, API contract tests | `fixnado:theme-change` event and beacon payload include theme/density/contrast/marketingVariant/tenantId/role/locale; `/api/telemetry/ui-preferences/summary` returns aggregated counts with latestEventAt freshness < 10m. |
| Telemetry Dashboard | Functional analytics | Frontend QA + Data Engineering | Playwright + API contract tests + CSV comparison | Summary cards, trend chart, and breakdown panels match `/api/telemetry/ui-preferences/summary`; CSV export mirrors payload; stale warning triggers when latestEventAt > 120m. |
| Telemetry Alerting & Snapshots | Operational monitoring | Data Engineering + SRE | Jest/Node harness, Slack webhook mock, SQL assertions | Alert job triggers Slack message when freshness ≥120m or emo share <10% (≥50 events), suppresses duplicates, and persists `ui_preference_telemetry_snapshot` rows with governed payload JSON. |
| Analytics Pipeline Control | API governance + rollback | Backend QA + Data Engineering | Vitest + Supertest + Secrets Manager stub + sqlite | `/api/analytics/pipeline` status reports backlog size, oldest pending event, failure streak, and latest run metadata; `POST /pause` and `POST /resume` enforce actor/ticket validation, update Secrets Manager toggle, persist `AnalyticsPipelineRun` audit rows, and return refreshed status. Ingestion job honours disabled state and records skipped cycles without deleting pending events. |
| Persona Analytics Dashboards | Functional + export validation | Frontend QA + Analytics Ops + Finance Ops | Vitest + Supertest + CSV diff harness + Playwright (follow-up) | `/api/analytics/dashboards/:persona` aggregates bookings, rentals, campaigns, fraud, compliance, and communications telemetry per role with correct trends/deltas; React `RoleDashboard` renders KPI cards, pipeline widgets, and offline banners; CSV export mirrors UI metrics with metadata headers (persona, timezone, window) and row count parity. Validation covers error states, localisation, and accessibility announcements. |
| Theme Studio | Visual regression | Frontend QA | Chromatic (post Storybook uplift) | Snapshot deltas below 0.2% threshold across light/dark/emo variants. |
| Admin Dashboard | Accessibility + navigation | Frontend QA | Cypress + axe-core | Widget tab order matches `Dashboard Organisation.md`; compliance export button accessible and gated. |
| Admin Feature Toggle Panel | Functional + RBAC governance | Frontend QA + Backend QA | Playwright (admin UI) + Vitest + Supertest + Postgres test container | Feature lifecycle actions (create, stage, graduate, retire) persist to PostGIS-backed store, enforce rollout windows, emit audit events, and honour RBAC — viewers blocked from mutations, auditors receive read-only export. Toggle propagation webhooks acknowledged within 5s and retries logged. |
| Service Marketplace & Escrow | API + chaos regression | Backend QA | Vitest + Supertest + sqlite transaction harness + Zod contracts | Purchase flow persists order + escrow atomically, rejects unauthorised buyers, validates currency overrides, and rolls back cleanly when escrow persistence fails; response schema validated against consumer contract to prevent payload drift. |
| Campaign Analytics & Fraud | API + background job validation | Backend QA + Data Engineering + Fraud Ops | Vitest + Supertest + mocked fetch + sqlite | `/api/campaigns` metrics ingestion normalises spend/impressions, persists CTR/CVR/anomaly score, writes analytics export outbox records, emits fraud signals (overspend/underspend/CTR/CVR/delivery gap/no spend), supports targeting replacements, and resolves signals with audit notes; exporter job posts payloads to mocked warehouse endpoint using `CAMPAIGN_ANALYTICS_ENDPOINT` + API key. |
| Geo-Zone Service | API contract + geospatial validation | Backend QA + Mapping SME | Vitest + Supertest + `@turf/turf` fixtures | `/api/zones` enforces GeoJSON validity, computes centroid/bounding box within tolerance of `website_drawings.md`, and snapshot endpoint persists analytics payloads with sample size metadata. |
| Booking Orchestrator | Functional + finance validation | Backend QA + Finance Ops | Vitest + Supertest + sqlite + finance harness | Booking creation honours SLA targets, assignments update status/metadata, bidding lifecycle persists revision/audit logs, finance totals respect commission/tax rate configuration, and dispute endpoint transitions status + captures audit trail. |
| Rental Lifecycle | Functional + compliance validation | Backend QA + Marketplace Ops + Compliance | Vitest + Supertest + sqlite + file fixture harness | `/api/rentals` covers approval, checkout, partial/full returns, inspection checkpoints, settlement, cancellation, alert propagation, and deposit adjustments with audit metadata. Inspection uploads validated, overdue alerts raised, and ledger reconciliation triggered without orphaned holds. |
| Home & Services | Content compliance | Marketing Ops + Legal | Manual review | Copy matches `Home page text.md`, disclaimers present, consent CTA routes to flagged flows. |
| Auth Flows | Security telemetry | Security Analyst | Jest + mocked analytics pipeline | `auth_step` telemetry hashed email and includes locale/timezone metadata; no plaintext PII. |
| Provider Mobile | Usability & compliance | UX Research + Mobile QA | Maestro scripts + moderated study | 90% task success for kanban transitions; compliance gating mirrors `provider_app_wireframe_changes.md`. |
| User Mobile | Accessibility | Accessibility SME + Mobile QA | Flutter driver + TalkBack session | Booking stepper voice guidance matches script; chat composer accessible. |
| Marketing Imagery | Compliance | Legal + Marketing | Manual review vs. `Screens_update_images_and_vectors.md` | Emo imagery approved and recorded; seasonal overlays follow guardrails. |

## Automation Strategy
1. **Playwright + axe-core**: Integrate `ui-qa-scenarios.csv` to drive deterministic flows for Theme Studio, Admin dashboard, and feature toggle governance panel once Sprint 5 begins.
2. **Vitest + Testing Library (React)**: Execute ThemeProvider regression harness to assert DOM dataset updates, event broadcasting, telemetry beacons (dataLayer + fetch fallback), and localStorage persistence so telemetry governance cannot silently regress.
3. **Chromatic Baselines**: Generate Storybook stories for Theme Studio cards, marketing modules, blueprint headers, and toggle rollout cards; integrate Chromatic thresholds into CI.
4. **Node/Vitest Coverage**: Extend backend suites with sqlite-backed transaction tests covering service creation/purchase, RBAC guardrails, chaos-induced escrow failures, geo-zone CRUD/analytics, booking lifecycle (assignments, bids, disputes), rental lifecycle (approval, checkout, partial returns, inspections, settlements, cancellations, alert propagation), campaign analytics/fraud ingestion + export outbox assertions, and contract schema validation via Zod; pipe coverage into CI alongside telemetry contracts and toggle governance specs.
5. **Telemetry Validation**: Use staging topic `kafka.ui-preferences.v1`, `/api/telemetry/ui-preferences/summary` contract tests, Playwright coverage for `/admin/telemetry`, and Slack webhook mocks to confirm payload ingestion, dashboard rendering, CSV export accuracy, alert delivery, and snapshot persistence.
6. **Maestro, Flutter Driver & Widget Tests**: Script booking wizard, kanban transitions, compliance flows, and live feed/banner states; new widget tests assert loading/empty/high-priority render paths and feed telemetry selectors for analytics rehearsal evidence.
7. **Issue Intake Automation Validation**: Enforce CI step that executes `node scripts/issue-intake.mjs` and lints the generated Markdown so severity SLAs, due dates, and ownership metadata remain deterministic across branches.
8. **Environment Parity Audit**: Execute `node scripts/environment-parity.mjs` during staging → production promotion to block mismatched tfvars or feature toggle manifests; failures trigger design + engineering review before rollout.

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
- Telemetry: `theme_change` and `auth_step` events visible in Looker dashboard with correct segmentation; `/api/telemetry/ui-preferences/summary` freshness under 10 minutes for pilot tenants; alert job posts/resolves Slack notifications and snapshots are ingested by Looker.
- Geo-zonal, booking, & rental: `/api/zones`, `/api/bookings`, and `/api/rentals` Vitest suites green (polygon validation, SLA timers, finance totals, bidding/dispute flows, rental approvals/returns/inspections/settlements) with PostGIS-compatible payloads verified against explorer/admin drawings.
- Documentation: Playbook, test plan, and trackers updated with evidence links and outstanding backlog items.

### Execution Evidence — 2025-10-30
- **Backend Node.js:** `npm test` (Vitest) executed under `backend-nodejs/`, exercising 13 files / 33 tests including `tests/analyticsDashboards.test.js`; spinner output noted, prompting action to switch CI scripts to pass `CI=1` or force non-interactive reporters.【3d3b31†L1-L38】
- **Frontend React:** `CI=1 npm test -- --reporter=dot` executed under `frontend-reactjs/`, covering explorer utilities, RoleDashboard, ThemeProvider, and MessageComposer suites; spinner overflow warning captured for backlog item to default to CI reporters in package scripts.【152a08†L1-L10】
- **Manual staging rehearsal:** Analytics operators validated persona dashboards with live staging data to verify timezone-filtered metrics, upcoming booking pipelines, fraud alert tiles, and CSV export row limits ahead of Looker ingestion rehearsal. Results summarised in `end_of_update_report.md`.

### Outstanding QA Actions
1. Update backend/frontend `test` npm scripts to apply `CI=1` and explicit reporters (e.g., `dot`/`junit`) to eliminate spinner overflow in console logs.
2. Add Playwright smoke test to load `/dashboards/:roleId` for admin/provider personas validating skeleton fade, error fallback copy, and download CTA disablement during fetch, capturing accessibility snapshots for Stark review.
3. Extend CSV diff harness with persona-specific assertions (bookings vs. rentals vs. campaigns) to guard against metric regression when enterprise drill-down tables land.
