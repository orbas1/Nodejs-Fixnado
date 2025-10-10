# Version 1.50 – Detailed Task List

> All tasks derive from the Version 1.50 feature brief, feature plan, issue reports, and fix suggestions. Percentages reflect current completion estimates during planning.

## Task 1 – Platform Architecture & Security Foundations *(10% complete)*
**Goal:** Close foundational gaps in security, dependency governance, and shared architecture so advanced features can land on a stable base.

### Subtasks
1. ✅ Document target architecture and service boundaries (monolith vs services, messaging, infra topology) – captured in `docs/architecture/platform-architecture.md` with deployment workflow and observability guidelines.
2. ✅ Implement MFA, JWT rotation, rate limiting, hardened CORS, and secret management using environment vaults.
3. ✅ Run dependency audits/upgrades across backend, frontend, and Flutter apps; enforce lockfiles and CI scanning (Node services now on Express 5, Sequelize 6.37, Vite 6, PropTypes linting, Flutter locks, and CI-driven audit with pinned major roadmap).
4. ✅ Publish shared OpenAPI spec, schema validation, and generated SDK packages for React and Flutter.
5. ✅ Provision IaC baselines (staging/prod), backup/DR runbooks, and environment promotion checklists via Terraform module and operational playbooks.

### Integration Coverage
- **Backend:** Middleware for auth, rate limiting, logging, tracing, health probes; refactor controllers for consistent error contracts.
- **Front-end:** Configure secure auth flows, feature flags, and env management; integrate telemetry clients.
- **User phone app:** Add secure token storage, refresh logic, and central config ingestion.
- **Provider phone app:** Mirror secure storage, enforce MFA enrolment, and add analytics hooks.
- **Database:** Introduce migration scaffolding, SSL enforcement, seed data, and audit columns.
- **API:** Publish versioned endpoints, health/status routes, and rate limit headers.
- **Logic:** Align domain services with validation layers and shared DTOs.
- **Design:** Produce UX for MFA setup, consent modals, and security notifications.

### Dependencies
- None (kick-off task). Supports all subsequent tasks.

---

## Task 2 – Zone Intelligence & Matching Enablement *(0% complete)*
**Goal:** Deliver geospatial zone management, geo-matching, and analytics to personalise marketplace experiences.

### Subtasks
1. Model zones, hierarchies, and metrics; create migrations, indices, and seed data.
2. Build admin tooling for zone CRUD, bulk import/export, and version history.
3. Implement matching services that combine zone, compliance, availability, and performance data.
4. Render heatmaps, overlap alerts, and zone badges across web and mobile clients.
5. Instrument dashboards tracking zone coverage, demand, and conversion metrics.

### Integration Coverage
- **Backend:** Geospatial services, caching, queue workers for analytics rollups.
- **Front-end:** Admin management consoles, explorer filters, and map visualisations.
- **User phone app:** Zone-filtered discovery flows, prompts, and offline fallbacks.
- **Provider phone app:** Zone availability management and proactive notifications.
- **Database:** PostGIS enablement, constraints, history tables, and audit triggers.
- **API:** Zone CRUD endpoints, search filters, analytics feeds.
- **Logic:** Matching heuristics, ranking, fallback strategies.
- **Design:** Map UX, zone badge styles, responsive layouts.

### Dependencies
- Task 1 (shared contracts, security baselines).

---

## Task 3 – Booking & Workforce Management Expansion *(0% complete)*
**Goal:** Enable flexible bookings (on-demand, scheduled, recurring) with team coordination and notifications.

### Subtasks
1. Extend booking schema for recurrence, mixed packages, compliance prerequisites, and audit metadata.
2. Build booking lifecycle workflows (create, reassign, escalate, complete) with transactional safety.
3. Launch team coordination (shared calendars, checklists, workload balancing) across panels.
4. Implement localisation-aware notifications (email/SMS/push/in-app) with scheduling controls.
5. Write operational runbooks and automation for booking SLAs, escalations, and reporting.

### Integration Coverage
- **Backend:** Booking services, queue workers, notification orchestrators, SLA monitors.
- **Front-end:** Booking flows, scheduler UI, checklist dashboards, real-time updates.
- **User phone app:** Booking creation/edit, offline caching, notification inbox.
- **Provider phone app:** Team assignment tools, checklist progress, time tracking.
- **Database:** Booking, recurrence, checklist, notification tables with FKs and constraints.
- **API:** Booking CRUD, assignment, cancellation, webhook endpoints.
- **Logic:** SLA timers, compliance gating, pricing validation.
- **Design:** Timeline views, team coordination screens, notification templates.

### Dependencies
- Tasks 1 & 2 for shared data contracts and zone-aware context.

---

## Task 4 – Marketplace, Rentals & Inventory Automation *(0% complete)*
**Goal:** Introduce rentals, inventory tracking, deposit handling, and compliance filters across marketplace experiences.

### Subtasks
1. Expand schemas for rentals, deposits, stock tracking, supplier linkage, and audit fields.
2. Build provider inventory dashboards, reorder automation, and analytics visualisations.
3. Implement rental lifecycle (availability, booking, pickup/delivery, return, damage assessment).
4. Add insured-only filters, compliance badges, and seasonal pricing governance across listings.
5. Sync inventory movements with bookings/custom jobs, ensuring real-time availability.

### Integration Coverage
- **Backend:** Inventory/rental services, reconciliation jobs, deposit calculations.
- **Front-end:** Rental catalogues, inventory dashboards, compliance badges, upsell flows.
- **User phone app:** Rental browsing, deposit status, return reminders.
- **Provider phone app:** Inventory adjustments, rental handoffs, low-stock alerts.
- **Database:** Inventory, rental, deposit, badge tables with referential integrity.
- **API:** Endpoints for rentals, inventory adjustments, compliance metadata.
- **Logic:** Reservation algorithms, deposit/refund rules, badge eligibility.
- **Design:** Listing cards, badge icons, rental workflows, responsive dashboards.

### Dependencies
- Tasks 1–3 for secure foundations, booking integrations, and zone context.

---

## Task 5 – Custom Jobs, Messaging & AI Collaboration *(0% complete)*
**Goal:** Enable bespoke job workflows, AI-assisted communications, and Agora-powered calls.

### Subtasks
1. Build custom job schema/forms capturing media, budgets, compliance data, autosave drafts.
2. Implement bid lifecycle (submission, edit, acceptance/rejection, audit trails, analytics).
3. Launch threaded Q&A with dispute escalation hooks and notification routing.
4. Integrate AI assistance (OpenAI/Claude keys) with moderation, usage caps, consent tracking.
5. Embed Agora voice/video calls with session logging, feedback prompts, and fallback channels.

### Integration Coverage
- **Backend:** Custom job services, AI proxy, Agora session coordination, audit logs.
- **Front-end:** Messaging UI, bid dashboards, AI suggestion prompts, call controls.
- **User phone app:** Chat threads, AI assistance, call management, offline caching.
- **Provider phone app:** Bid management, AI drafting, call workflows, analytics.
- **Database:** Custom job, bid, conversation, call session, AI usage tables.
- **API:** Chat, bid, AI key registration, call signalling endpoints.
- **Logic:** Moderation pipelines, scoring algorithms, SLA tracking.
- **Design:** Chat hierarchies, AI disclosure, call UI/UX, consent banners.

### Dependencies
- Tasks 1–4 (security, booking hooks, inventory integration).

---

## Task 6 – Compliance, Trust & Monetisation Panels *(0% complete)*
**Goal:** Provide verification workflows, dispute tooling, ads/commission engines, and multi-panel dashboards.

### Subtasks
1. Implement ID/DBS/insurance verification with document uploads, expiry monitoring, and escalation routing.
2. Build compliance dashboards, public trust signals, and insured-only filters across marketplace views.
3. Deliver multi-panel dashboards (Admin, Servicemen, SME, Enterprise) with onboarding and operational metrics.
4. Develop commission management, Fixnado/Finova Ads targeting, budgeting, and billing workflows.
5. Produce revenue/compliance analytics with exports, alerts, and governance playbooks.

### Integration Coverage
- **Backend:** Verification services, dispute management, ads/commission engines, audit exports.
- **Front-end:** Panel-specific UI, verification flows, trust badges, ads campaign management.
- **User phone app:** Verification status views, consent prompts, ads engagements.
- **Provider phone app:** Document submission, compliance alerts, revenue insights.
- **Database:** Verification, dispute, commission, ads campaign tables with lifecycles.
- **API:** Verification submission, review workflows, ads targeting endpoints.
- **Logic:** Compliance rules, commission calculators, targeting algorithms.
- **Design:** Panel layouts, badge systems, analytics visualisations, consent flows.

### Dependencies
- Tasks 1–5 (security, matching, booking, marketplace, collaboration capabilities).

---

## Task 7 – Experience Parity Across Web & Mobile Clients *(5% complete)*
**Goal:** Transform static clients into production-ready experiences with accessibility, localisation, and shared branding.

### Subtasks
1. Implement global state management, protected routing, and secure storage patterns across React and Flutter apps.
2. Replace mock data with live API integrations, error boundaries, loading skeletons, and retry logic.
3. Enhance accessibility (ARIA, keyboard support), responsiveness, localisation, multi-currency/tax formatting.
4. Add offline support, caching strategies, analytics instrumentation, and crash reporting.
5. Align design systems (tokens, components, branding) across all clients and documentation.

### Integration Coverage
- **Backend:** Provide consistent API contracts, pagination, and telemetry for client integrations.
- **Front-end:** Fully functional flows for onboarding, bookings, marketplace, compliance.
- **User phone app:** Feature parity for discovery, bookings, messaging, compliance tasks.
- **Provider phone app:** Inventory, bookings, bids, and analytics parity with responsive UX.
- **Database:** Ensure data models and caching strategies meet client needs.
- **API:** Version management, schema validation, error handling for client resilience.
- **Logic:** Shared DTOs, localisation catalogs, validation frameworks.
- **Design:** Unified component library, accessibility guidelines, dark/light themes.

### Dependencies
- Tasks 1–6 for API readiness, security, and feature availability.

---

## Task 8 – Quality Assurance, Observability & Release Readiness *(5% complete)*
**Goal:** Embed automated testing, observability, and release governance culminating in an end-of-update report.

### Subtasks
1. Author automated tests (unit/integration/E2E, API, contract, load) covering new features across stacks.
2. Establish observability stack (logging, metrics, tracing, alerting) with dashboards per service.
3. Define QA protocols: regression suites, beta programs, accessibility/performance audits.
4. Produce release documentation, training materials, change logs, and support playbooks.
5. Compile end-of-update report with KPI tracking, risk/issue logs, and follow-up backlog.
6. Publish and maintain the Version 1.50 testing plan (testing_plan.md), aligning coverage matrices, environments, and schedules with milestone gates.

### Integration Coverage
- **Backend:** CI pipelines, telemetry exporters, contract tests, security scans.
- **Front-end:** Automated UI tests (Cypress/Playwright), Lighthouse/Axe scans, bundle analysis.
- **User phone app:** Widget/integration tests, device farm runs, crash analytics.
- **Provider phone app:** Parity test suites, beta feedback loops, telemetry dashboards.
- **Database:** Migration tests, backup/restore drills, data quality monitoring.
- **API:** Synthetic monitors, load/stress tests, contract validation.
- **Logic:** KPI instrumentation, anomaly detection, feature flag rollouts.
- **Design:** Usability studies, accessibility sign-off, documentation review.

### Dependencies
- Tasks 1–7 (requires feature completeness and telemetry hooks).


## Task 9 – Mobile Application Completion & Store Launch Readiness *(0% complete)*
**Goal:** Finalise user and provider Flutter apps for production delivery, ensuring performance, compliance, and store approval.

### Subtasks
1. Close feature parity gaps (rentals, bookings, messaging, compliance flows) with responsive layouts and localisation.
2. Optimise performance (startup, bundle size, memory) and implement advanced caching/offline resilience strategies.
3. Harden mobile security (secure storage, jailbreak/root detection, certificate pinning, telemetry privacy controls).
4. Execute device matrix QA, accessibility audits, and integration tests across user/provider apps with issue triage loops.
5. Prepare app store assets, release pipelines, phased rollout strategy, and post-launch monitoring dashboards.

### Integration Coverage
- **Backend:** Ensure mobile-optimised endpoints, pagination, push notification hooks, and telemetry ingestion.
- **Front-end:** Align shared design tokens/components with mobile variants and orchestrate web-to-mobile deep links.
- **User phone app:** Deliver production-ready UX with offline, localisation, analytics, and compliance features.
- **Provider phone app:** Finalise provider workflows (inventory, bookings, bids, verification) with performance tuning.
- **Database:** Validate mobile data access patterns, caching policies, and telemetry storage models.
- **API:** Provide versioned mobile SDKs, backwards-compatible contracts, and feature flag controls for phased rollout.
- **Logic:** Coordinate feature flags, rollout sequencing, and experimentation frameworks spanning mobile clients.
- **Design:** Produce store assets, motion guidelines, accessibility documentation, and launch marketing collateral.

### Dependencies
- Tasks 1–8 (relies on backend stability, feature completion, and QA frameworks).

---

## Task 10 – Design System Convergence & Handoff *(0% complete)*
**Goal:** Execute the dedicated design workstream that unifies mobile and web experiences, delivering artefacts required for engineering and release enablement.

### Subtasks
1. Consolidate experience architecture by auditing existing flows, producing updated IA diagrams, and aligning persona journeys.
2. Finalise visual system by harmonising colour/typography tokens, spacing, and component specs with exportable assets.
3. Build interactive prototypes for core journeys (booking, campaign setup, compliance, rentals) and source dummy data/imagery libraries.
4. Conduct usability and accessibility testing, capturing remediation actions and iterating prototypes accordingly.
5. Facilitate engineering handoff with redlines, Storybook/Tailwind references, Flutter specs, and recorded walkthroughs.
6. Run design QA across staging builds, log defects, and prepare release communications (tours, webinars, notes) with marketing.

### Integration Coverage
- **Backend:** Provide API mocks/dummy data for prototypes and ensure analytics/compliance data availability.
- **Front-end:** Consume updated tokens, components, and motion guidance across React and Blade implementations.
- **User phone app:** Apply refreshed tokens, imagery, and flows to Flutter widgets with accessibility validation.
- **Provider phone app:** Mirror design updates for provider-specific dashboards, inventory management, and compliance flows.
- **Design:** Maintain Figma libraries, token repositories, research reports, and QA checklists.
- **Product/Marketing:** Coordinate release communications, webinars, and adoption campaigns using new assets.

### Dependencies
- Tasks 1–9 for functional readiness; runs in parallel with engineering milestones to ensure UI maturity.
