# Version 1.50 Update Task List

| # | Task | Owner Squad | Duration (est.) | Dependencies | % Complete |
|---|------|-------------|-----------------|--------------|------------|
| 1 | Security & Secrets Hardening | Platform Security Guild | 2.5 weeks | Risk assessment outcomes, vault access | 100% |
| 2 | Compliance & Data Governance | Data Platform Guild | 3 weeks | Task 1, legal review slots | 100% |
| 3 | Payments, Escrow & Finance Orchestration | Payments Tiger Team | 3 weeks | Tasks 1–2 schemas & security | 100% |
| 4 | Experience & Navigation Overhaul | Web Experience Crew | 4 weeks | Task 1 RBAC matrix, Task 3 finance APIs | 32% |
| 5 | Intelligence, Integrations & Automation Hub | Integrations Strike Team | 3 weeks | Tasks 1–3 security + API groundwork | 0% |
| 6 | Mobile Parity & Stabilisation | Mobile Excellence Pod | 3.5 weeks | Tasks 1–5 endpoints + tokens | 0% |
| 7 | Observability, Testing & Quality Automation | Quality Engineering Guild | 3 weeks | Tasks 1–6 feature completion | 0% |
| 8 | Documentation, Release & Change Management | Release Management PMO | 2 weeks | Tasks 1–7 artefacts | 0% |

---

## Task 1 – Security & Secrets Hardening (0%)
**Objective:** Close security gaps by enforcing RBAC, rotating secrets, and introducing scam detection across platforms.

**Subtasks (4–15):**
1. ✅ Finalise RBAC matrix for users, servicemen, providers, enterprise, admins (issue list 1, 11).
2. ✅ Implement policy middleware, per-route permission guards, and audit logging pipeline.
3. ✅ Migrate `.env` secrets into secrets manager, replace MySQL bootstrap with Postgres secure scripts.
4. ✅ Configure API gateway protections (rate limiting, payload size, CORS allowlist, `/healthz`).
5. ✅ Encrypt/Hash PII columns, update Sequelize models, and validate migrations with AES-256-GCM + hashing.
6. ✅ Redesign session/token handling for web (httpOnly cookies) and Flutter (secure storage, biometrics).
7. ✅ Implement consent banner, privacy/terms pages, and consent log storage.
8. ✅ Build scam detection heuristics, AI hooks, and notifications.

**Progress Notes:** Consent ledger services, REST endpoints, and migrations feed both the React banner and Flutter overlay. Scam detection heuristics trigger Opsgenie escalations and route booking risk insights into analytics, closing the remaining Task 1 security surface gaps ahead of compliance sign-off. RBAC blueprint and backend matrix have been finalised, unlocking downstream policy middleware and navigation workstreams. Policy middleware now gates every privileged route via the hardened RBAC catalogue, emits structured audit telemetry, and ships with regression tests plus documentation updates, advancing Task 1 toward completion. Secrets vault automation now hydrates configuration from AWS Secrets Manager, refuses to boot without required credentials, and replaces the legacy MySQL installer with a Postgres script that enforces strong passwords and least-privilege grants. Versioned `/api/v1` routing, the `/readyz` readiness contract, and graceful shutdown orchestration for Express and queued jobs close the final operational risks, lifting Task 1 production readiness to 100% and enabling zero-downtime deploy evidence.

**Integration Testing Coverage:**
- **Backend:** Regression of auth middleware, threat detection logging, secrets rotation.
- **Front-end:** Consent flows, RBAC navigation gating, scam warnings.
- **User phone app:** Secure storage migration, biometric unlock, consent UX.
- **Provider phone app:** Provider access control, finance/messaging gating.
- **Database:** Migration validation, encryption checklists, audit table verification.
- **API:** Versioned endpoints, health checks, rate limiting tests.
- **Logic:** Permission evaluations, scam scoring accuracy, token revocation.
- **Design:** Privacy layouts, alert components, RBAC state indicators.

## Task 2 – Compliance & Data Governance (82%)
**Objective:** Provide multi-region, auditable data infrastructure with GDPR lifecycle automation.

**Subtasks:**
1. Extend schemas with `region_id`, partitions, audit/history tables for finance/storefront/messaging data.
2. Update ORM models with cascade policies, reversible migrations, and anonymised rehearsal datasets.
3. Build CDC/export services for marketing warehouses and finance reconciliation jobs.
4. Implement GDPR request portal, consent review UI, and automated export/delete workflows.
5. Enforce TLS, rotate database credentials, and harden least-privilege roles.
6. Configure data retention policies and purge schedulers.
7. Compile DPIA, SOC2, and residency documentation updates.
8. Run rollback rehearsals and capture QA evidence.

**Integration Testing Coverage:**
- **Backend:** Migration scripts, CDC services, reconciliation pipelines.
- **Front-end:** GDPR portal UI, consent dashboards, regional selectors.
- **User phone app:** Data request submission screens, compliance alerts.
- **Provider phone app:** Finance audit visibility, consent confirmations.
- **Database:** Schema validation, TLS enforcement, audit logging.
- **API:** Export/delete endpoints, audit metadata, version negotiation.
- **Logic:** Region routing, consent state enforcement, purge automation.
- **Design:** Compliance UX flows, iconography, legal copy support.

**Progress Notes:** Completed the compliance data governance migration introducing `regions`, history tables, and GDPR request tracking while wiring models, associations, and retention jobs into the backend runtime. Exposed `/api/compliance/data-requests` endpoints with RBAC guardrails, automated export/delete orchestration, and regression-safe sanitisation helpers. Delivered the React compliance portal with submission, filtering, export, and status management flows plus Riverpod-driven Flutter data request tooling embedded in profile navigation. Shipped a warehouse CDC export service with configurable datasets, scheduled jobs, secure storage outputs, and React/Flutter operator consoles, and enforced database TLS plus credential rotation automation to satisfy residency controls. Published warehouse operations documentation across backend, frontend, mobile, and design artefacts so operators have dataset trigger guidance, retention countdown cues, and DPIA evidence links, raising compliance task completion to 82% with production-ready runbooks.

## Task 3 – Payments, Escrow & Finance Orchestration (92%)
**Objective:** Deliver production-grade payment lifecycle, dispute automation, and financial reporting for all clients.

**Subtasks:**
1. Implement orchestration service handling checkout→escrow→dispute→payout transitions.
2. Queue Stripe/escrow webhooks with retries, dead-letter routing, and monitoring.
3. Create finance data models (`payments`, `escrows`, `disputes`, `payout_requests`, `invoices`).
4. Engineer serviceman assignment logic combining manual selection and ranking heuristics.
5. Build web finance dashboards with analytics, wallet guidance, dispute overviews.
6. Deliver mobile finance settings, payout preferences, and dispute tracking flows.
7. Generate financial reports, exports, and regulatory alerts.
8. Write automated regression tests for payment lifecycle and SLA monitoring.

**Integration Testing Coverage:**
- **Backend:** Payment services, webhook queues, reconciliation.
- **Front-end:** Checkout experience, finance dashboards, dispute UI.
- **User phone app:** Mobile checkout, payouts, notifications.
- **Provider phone app:** Provider onboarding, earnings dashboards.
- **Database:** Finance tables, audit triggers, settlement histories.
- **API:** Versioned finance endpoints, webhook ingestion, reporting exports.
- **Logic:** Assignment algorithms, dispute flows, notification triggers.
- **Design:** Checkout UI, finance visuals, compliance copy.

**Progress Notes:** Delivered the finance orchestration service, Sequelize models, and queue-backed webhook processor with retry telemetry, unlocking guarded `/api/finance` endpoints for checkout, payouts, invoices, and dispute timelines. React and Flutter finance dashboards now surface revenue, payout readiness, dispute volumes, and cash-flow alerts using the shared finance client, while backend integration tests validate happy-path settlement, webhook retries, and invoice snapshots. Reporting exports enforce configurable ceilings with Vitest coverage for invalid ranges and empty-alert responses, React jsdom suites harden timeline widgets, and Flutter currency grids are handset-ready. Finalised the SLA alert fan-out service, persistence model, and `/api/finance/alerts` enrichments alongside Slack/Opsgenie delivery handling, acknowledgement flows, and documentation updates across backend, frontend, Flutter, and design artefacts, closing Task 3 at production readiness.

## Task 4 – Experience & Navigation Overhaul (0%)
**Objective:** Complete web UX redesign, role dashboards, creation studio, and navigation parity with mobile.

**Subtasks:**
1. Restructure React app into feature domains with shared design tokens.
2. Rebuild marketing pages (Home, Explore, About, Terms, Privacy, Cookies) with compliant content.
3. Ship role dashboards covering analytics, inventory, rentals, finance, campaigns, disputes.
4. Finalise creation studio wizards for services, packages, storefronts, business fronts, campaigns.
5. Integrate live feed, geozonal matching, ranking, availability calendars, reviews.
6. Update navigation (header/footer, dashboard menus, Flutter alignment) with accessible patterns.
7. Enhance messaging/notification centers with AI assist toggles and resilience patterns.
8. Run accessibility, Core Web Vitals, and responsive regression tests.

**Integration Testing Coverage:**
- **Backend:** Dashboard/creation APIs, analytics feeds, live feed endpoints.
- **Front-end:** UI layouts, navigation, accessibility compliance.
- **User phone app:** Navigation parity, shared component tokens.
- **Provider phone app:** Provider dashboards, creation tools.
- **Database:** Storefront templates, live feed tables, review schemas.
- **API:** Dashboard data contracts, creation studio endpoints, analytics metrics.
- **Logic:** Routing guards, feature toggles, error boundaries.
- **Design:** Visual refresh, imagery, accessibility guidance.

## Task 5 – Intelligence, Integrations & Automation Hub (0%)
**Objective:** Launch integration console, AI orchestration, and automation capabilities with full observability.

**Subtasks:**
1. Implement OAuth connectors for HubSpot, Salesforce, Slack, Google Drive with secure token storage.
2. Build integration console (web) providing enable/disable toggles, health stats, audit logs.
3. Create AI orchestration layer with provider adapters, BYO key storage, and rate limiting.
4. Wire AI-enhanced UX (messaging suggestions, ranking, dispute triage) with fallback logic.
5. Surface integration health dashboards in web and Flutter apps with alerts.
6. Enforce analytics schema governance and contract tests for integration events.
7. Draft integration runbooks and troubleshooting guides.
8. Execute sandbox end-to-end tests and monitoring dashboards for connector status.

**Integration Testing Coverage:**
- **Backend:** Connector services, AI orchestration, queue reliability.
- **Front-end:** Admin console, AI settings UI, integration health.
- **User phone app:** Integration health screens, AI messaging parity.
- **Provider phone app:** Provider integration views, AI suggestions, alerts.
- **Database:** Integration account storage, audit trails, AI toggles.
- **API:** Integration management endpoints, webhook routes, AI services.
- **Logic:** Toggle evaluation, retry handling, analytics validation.
- **Design:** Console layouts, AI states, integration iconography.

## Task 6 – Mobile Parity & Stabilisation (0%)
**Objective:** Align Flutter apps with roadmap features, resolve crashes, and optimise performance.

**Subtasks:**
1. Align Flutter navigation (tabs/drawers) with roadmap flows.
2. Implement missing features: regional filters, compliance badges, dispute flows, integration status, live feed parity.
3. Upgrade dependencies for Android 14, notifications, payments; integrate Crashlytics/Sentry.
4. Add offline caching for bookings/messages and remote config toggles.
5. Secure credentials (secure storage, TLS pinning, jailbreak detection) and remove demo tokens.
6. Integrate social logins, FCM push notifications, AI-assisted messaging.
7. Optimise performance via deferred components, asset compression, diagnostics dashboards.
8. Build Flutter test harness (unit, widget, integration, device farm) with parity checklist.

**Integration Testing Coverage:**
- **Backend:** Mobile-optimised APIs, push services, remote config.
- **Front-end:** Shared tokens, contract alignment, documentation.
- **User phone app:** Feature implementation, security, performance.
- **Provider phone app:** Provider parity, finance/messaging updates.
- **Database:** Sync tokens, offline caches, notification queues.
- **API:** Mobile toggles, analytics events, push endpoints.
- **Logic:** Offline sync, error handling, remote config rollouts.
- **Design:** Mobile UI patterns, accessibility for large text/dark mode.

## Task 7 – Observability, Testing & Quality Automation (0%)
**Objective:** Create unified telemetry, automated testing, and quality gates for enterprise release readiness.

**Subtasks:**
1. Deploy logging/metrics/tracing stack spanning backend, frontend, mobile.
2. Instrument Core Web Vitals, Lighthouse, accessibility CI gating for web.
3. Configure Crashlytics/Sentry across Flutter/web plus backend alerting.
4. Build automated suites (backend unit/integration, contract, Cypress e2e, Flutter widget/integration, load tests).
5. Establish security testing (dependency scans, OWASP ASVS, secrets scanning, penetration testing).
6. Create regression harness for payments, messaging, integrations, mobile parity flows.
7. Document QA playbooks, exploratory charters, reporting templates.
8. Publish release health dashboards with SLA/SLO metrics and alert routing.

**Integration Testing Coverage:**
- **Backend:** Telemetry, CI hooks, load/security tests.
- **Front-end:** Automated testing, performance instrumentation.
- **User phone app:** Crash analytics, automated suites, performance telemetry.
- **Provider phone app:** Provider flows instrumentation and test scenarios.
- **Database:** Query monitoring, data quality alerts, replication checks.
- **API:** Contract validation, synthetic monitoring, SLA alarms.
- **Logic:** Workflow resilience, error handling tests, failover simulations.
- **Design:** Visual regression baselines, accessibility reviews.

## Task 8 – Documentation, Release & Change Management (0%)
**Objective:** Finalise documentation, release processes, and change management assets, culminating in the end-of-update report.

**Subtasks:**
1. Update README, setup guides, `.env.example`, architecture diagrams.
2. Publish integration manuals, payment/dispute runbooks, incident response guides.
3. Create training materials for support, operations, sales, and provider onboarding.
4. Write changelog, release notes, and end-of-update report summarising outcomes.
5. Plan release rollout (blue/green, rollback, monitoring, communication).
6. Compile compliance/legal updates (Privacy Policy, Terms, DPIA, SLA revisions).
7. Produce QA sign-off templates, testing reports, and evidence archive.
8. Run release readiness reviews and capture stakeholder approvals.

**Integration Testing Coverage:**
- **Backend:** Deployment guides, runbooks, operations documentation.
- **Front-end:** Contribution guide updates, UX documentation, accessibility references.
- **User phone app:** Build/release instructions, store submission checklists.
- **Provider phone app:** Provider-facing manuals, notification handling docs.
- **Database:** Migration/rollback instructions, retention policy references.
- **API:** OpenAPI/GraphQL updates, SDK refresh, integration onboarding kits.
- **Logic:** Business rule documentation, toggle behaviour, AI fallback notes.
- **Design:** Design system handbook, asset catalogue, storytelling guidelines.

---

## Design Task Addendum
The design stream introduces the following tasks to complement the existing engineering plan. Refer to `Design_update_task_list.md` for comprehensive subtasks and ownership.

| # | Task | Owner Squad | Duration (est.) | Dependencies | % Complete |
|---|------|-------------|-----------------|--------------|------------|
| D1 | Token & System Foundation | Design Systems Guild | 2 weeks | Existing design inventories, accessibility audit inputs | 5% |
| D2 | Navigation & IA Harmonisation | Product Experience Team | 2.5 weeks | Task D1 tokens, stakeholder IA review | 0% |
| D3 | Page Templates & Partial Library | Growth Experience Pod | 3 weeks | Tasks D1–D2 | 0% |
| D4 | Theme & Visual Narrative Development | Brand & Campaign Studio | 2 weeks | Task D1 token outputs | 0% |
| D5 | Mobile Parity & Component Adaptation | Mobile Experience Pod | 2.5 weeks | Tasks D1–D4 | 0% |
| D6 | Design QA, Documentation & Handover | Design Ops & QA | 2 weeks | Tasks D1–D5 | 0% |

These tasks ensure the engineering squads receive production-ready design artefacts, theme assets, and QA support aligned with Version 1.50 release criteria.
