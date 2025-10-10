# Version 1.50 – Milestone List

## Milestone 1 – Foundational Security & Alignment *(Target completion: Week 3)*
**Scope:** Tasks 1 & 7 (subtasks 1–2)  
**Objectives:**
- Finalise cross-stack architecture blueprint, dependency governance, and security baselines.
- Stand up shared configuration, schema contracts, and feature flag frameworks across web/mobile.
- Deliver initial accessibility, localisation, and state management groundwork on clients.
**Entry Criteria:** Issues on hard-coded secrets, absent rate limiting, and dependency drift triaged with owners.  
**Exit Criteria:**
- Environment-managed secrets, MFA, JWT rotation, and rate limiting live in staging.
- OpenAPI specs and shared env packages published with generated SDKs.
- React/Flutter clients authenticate against staging APIs with protected routes and secure storage.
- Architecture decision records signed off by engineering, security, and product leads.
- Version 1.50 testing plan baseline (testing_plan.md) published with scope, schedule, and ownership mapping to Milestones 1–6.
**Dependencies:** none (kick-off milestone).

## Milestone 2 – Zone Intelligence & Booking Orchestration *(Target completion: Week 6)*
**Scope:** Task 2 and Task 3  
**Objectives:**
- Implement polygon zone schemas, CRUD tooling, and geo-matching services.
- Upgrade booking models, workflows, and multi-serviceman coordination across panels.
- Activate notification pipelines and timezone-aware scheduling across channels.
**Entry Criteria:** Milestone 1 artifacts deployed to integration environment.  
**Exit Criteria:**
- Zone admin UI and explorer search leverage live geospatial APIs with heatmaps.
- Booking lifecycle E2E tests pass for on-demand, scheduled, and recurring scenarios.
- Mobile apps display zone-aware listings and support booking creation/updates.
- Monitoring dashboards report zone coverage and booking SLA compliance.
**Dependencies:** Milestone 1 (shared contracts, security).

## Milestone 3 – Marketplace Rentals & Collaborative Workflows *(Target completion: Week 9)*
**Scope:** Task 4 and Task 5  
**Objectives:**
- Launch rentals, inventory automation, and compliance badge filters.
- Enable custom job creation, bidding, AI-assisted messaging, and Agora communications.
- Synchronise inventory reservations with booking/custom job flows.
**Entry Criteria:** Zone intelligence and booking services stable in staging.  
**Exit Criteria:**
- Inventory dashboards and rental workflows operational across web/mobile.
- Custom job and bidding flows functional with audit trails and analytics.
- AI chat assistance accessible with provider-supplied keys, moderation, and usage caps.
- Agora voice/video calling integrated with post-call logging and customer satisfaction prompts.
**Dependencies:** Milestones 1 & 2.

## Milestone 4 – Compliance, Trust & Monetisation Panels *(Target completion: Week 12)*
**Scope:** Task 6 plus Task 7 (subtasks 3–4)
**Objectives:**
- Deliver verification pipelines, dispute tooling, and trust analytics.
- Stand up multi-panel dashboards, commission management, and Fixnado/Finova Ads suite.
- Finalise accessibility, localisation, branding, and analytics parity across clients.
**Entry Criteria:** Marketplace, custom job, and AI collaboration features validated in staging.  
**Exit Criteria:**
- Providers complete verification workflows with expiry reminders and badge propagation.
- Admin/SME/Enterprise panels expose compliance dashboards, ads management, and revenue reports.
- Commission and ads billing flows reconcile with finance exports.
- Accessibility audits and localisation QA pass across web and mobile clients.
**Dependencies:** Milestones 1–3.

## Milestone 5 – Mobile Application Completion & Store Launch *(Target completion: Week 13)*
**Scope:** Task 7 (remaining subtasks) and Task 9
**Objectives:**
- Close remaining parity gaps, localisation, and branding polish for user/provider apps.
- Optimise performance, security, and offline resilience tailored to mobile usage patterns.
- Achieve app store readiness with compliance artefacts, release pipelines, and monitoring dashboards.
**Entry Criteria:** Compliance/monetisation panels functional in staging with stable APIs and design systems.
**Exit Criteria:**
- Feature-complete Flutter apps pass accessibility, localisation, and device matrix QA.
- Mobile telemetry, secure storage, and certificate pinning validated in staging builds.
- App store submissions prepared with approved assets, privacy manifests, and phased rollout plan.
- Launch playbooks and support readiness reviews signed off by product, support, and marketing.
**Dependencies:** Milestones 1–4.

## Milestone 6 – QA Hardening & Release Operations *(Target completion: Week 14)*
**Scope:** Task 8 plus residual items from Tasks 1–9
**Objectives:**
- Complete automated and manual test suites, load/performance benchmarks, and security audits.
- Finalise observability stack, incident response playbooks, and production readiness reviews.
- Produce change logs, training materials, and the end-of-update report.
**Entry Criteria:** All feature work code-complete, with staging environments in sync.
**Exit Criteria:**
- CI pipelines green with unit, integration, E2E, and mobile test coverage meeting KPIs.
- Observability dashboards (logs, metrics, tracing) live with alert thresholds approved.
- Go-live checklist signed off, including DR drills, beta feedback resolution, and release notes.
- Testing_plan.md fully executed with status dashboards showing ≥95% completion across planned suites and audits.
- End-of-update report delivered with KPI tracking, risk assessment, and follow-up backlog.
**Dependencies:** Milestones 1–5.

## Milestone 7 – Design System Convergence *(Target completion: Weeks 1–4 parallel)*
**Scope:** Dedicated design workstream spanning the mobile and web Application Design Update Plans.
**Objectives:**
- Align experience architecture, navigation frameworks, and flow diagrams across personas (Week 1).
- Finalise colour/typography tokens, component specs, and annotated hi-fi mocks (Week 2).
- Validate prototypes through usability testing and accessibility audits, actioning findings (Week 3).
- Support engineering implementation with design QA and release enablement assets (Week 4).
**Entry Criteria:** Foundational artefacts from Application and Web Design Update Plans catalogued in the design repository.
**Exit Criteria:**
- Approved IA maps, sitemaps, and cross-platform flow diagrams published.
- Exported design tokens and annotated mocks available for engineering consumption.
- Usability and accessibility reports completed with remediation tracked to closure.
- Design QA checklist signed off with release communications (tours, webinars, notes) prepared.
**Dependencies:** Milestone 1 (security foundations); runs concurrently with Milestones 2–6 to ensure UI readiness.

