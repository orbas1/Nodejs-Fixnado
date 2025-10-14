# Version 1.50 Milestone Plan

## Milestone 1 – Security & Compliance Foundation (Target Week 1–3)
1. **RBAC & Secrets Overhaul**
   - Map role/permission matrix for all experiences using issue list references 1, 11, 19.
   - Implement policy middleware and auditing hooks in backend routes.
   - Replace insecure `.env` defaults and MySQL bootstrap with vault-managed secrets.
   - Configure httpOnly/session storage for web and secure storage for mobile tokens.
   - Encrypt core PII columns with deterministic hashes, delivering transactional migrations and rollback rehearsals.
2. **API Gateway Hardening**
   - Introduce versioned `/v1` routing, rate limiting, payload caps, and CORS allowlist.
   - Add `/healthz` and `/readyz` endpoints plus SIGTERM shutdown handling.
   - Enable structured logging with correlation IDs and threat detection alerts.
   - Document new gateway behaviour for frontend/mobile consumers.
3. **GDPR Consent & Privacy UX**
   - Implement cookie banner, consent logging service, and privacy/terms pages.
   - Surface consent status in account settings on web/mobile.
   - Automate GDPR export/delete request handling workflows.
   - Validate accessibility and localisation for legal copy.
4. **Scam Detection Enablement**
   - Define heuristics and AI scoring flows for messaging, checkout, live feed.
   - Integrate alert surfaces in React and Flutter clients.
   - Instrument backend notification triggers and audit logging.
   - Establish QA scripts covering scam alert edge cases.
5. **Compliance Documentation Kickoff**
   - Draft DPIA updates, SOC2 control mappings, and regional residency statements.
   - Update security runbooks with new vault/rotation procedures.
   - Coordinate legal review schedule and capture sign-off checkpoints.
   - Publish initial documentation outline for Milestone 1 review.

## Milestone 2 – Data Governance & Finance Platform (Target Week 2–5)
1. **Multi-Region Schema Expansion**
   - Add `region_id`, partitioning, and audit/history tables to finance, storefront, messaging schemas.
   - Update Sequelize models and migrations with cascades and reversibility tests.
   - Configure TLS enforcement and least-privilege database users.
   - Run anonymised rehearsal migrations in staging.
2. **GDPR Lifecycle Automation**
   - Implement retention schedules, purge jobs, and data export APIs.
   - Build frontend/mobile portals for export/delete requests and consent review.
   - Document retention policies and audit them in QA.
   - Verify rollback plans for compliance jobs.
3. **Payment Orchestration Service**
   - Implement checkout→escrow→dispute→payout workflows with queue-backed webhooks.
   - Create serviceman selection logic aligned with ranking/matching services.
   - Build finance dashboards (web) and finance settings (mobile) with realtime status.
   - Generate finance reports and FCA wallet guidance notices.
4. **Financial Data Quality & Reconciliation**
   - Automate payment reconciliation and ledger balancing jobs.
   - Add CDC feeds for marketing/analytics warehouses.
   - Instrument monitoring for settlement latency and queue failures.
   - Write regression tests covering dispute resolution paths.
5. **Compliance Evidence Collection**
   - Capture audit logs, consent exports, and finance reports as release artefacts.
   - Prepare compliance validation checklist for Milestone 2 exit.
   - Coordinate pen test scope covering payment services.
   - Summarise findings for leadership review.

## Milestone 3 – Experience & Integration Delivery (Target Week 4–7)
1. **Frontend Architecture & Navigation**
   - Implement feature-based React structure, design tokens, and error boundaries.
   - Rebuild navigation (public + dashboard) and ensure responsive breakpoints.
   - Sync Flutter navigation (tabs/drawer) with shared IA.
   - Run usability sessions for navigation flows.
2. **Role Dashboard Completion**
   - Develop dashboards for user, serviceman, provider, enterprise, admin roles.
   - Wire analytics, inventory, rental, finance, campaign widgets to backend APIs.
   - Ensure RBAC gating, loading states, and error handling per role.
   - Capture accessibility and localisation compliance checks.
3. **Creation Studio & Storefront Suite**
   - Finalise creation wizards for services, packages, storefronts, business fronts, campaigns.
   - Integrate preview/publish logic with audit logging and rollback states.
   - Populate templates with compliant imagery and copy.
   - Author QA scripts for end-to-end creation flows.
4. **Live Feed, Matching & Reviews**
   - Implement geozonal matching, live feed ranking, availability calendars, and review pipelines.
   - Surface scam alerts, availability overlays, and multilingual content.
   - Ensure API contracts support web/mobile parity.
   - Add performance monitoring for live feed refresh.
5. **Integration & AI Console MVP**
   - Deliver admin console for HubSpot, Salesforce, Slack, Google Drive connectors.
   - Implement AI provider toggles with BYO key storage and rate limiting.
   - Provide integration health dashboards and alerting hooks.
   - Test sandbox integrations and document onboarding steps.

## Milestone 4 – Mobile Parity & Quality Engineering (Target Week 6–9)
1. **Flutter Feature Parity**
   - Ship regional filters, compliance badges, dispute flows, integration status screens.
   - Align bookings, messaging, live feed, finance preferences with backend APIs.
   - Provide deep links for desktop-only features with contextual guidance.
   - Validate localisation and accessibility (large text, screen readers).
2. **Mobile Stability & Security**
   - Update dependencies for Android 14, add Crashlytics/Sentry, and resolve crashes.
   - Implement secure storage, TLS pinning, jailbreak/root detection, remove demo tokens.
   - Configure remote config for staged rollouts and fail-safes.
   - Create incident response runbooks for mobile releases.
3. **Performance Optimisation**
   - Enable deferred components, asset compression, and caching for offline resilience.
   - Monitor app size budgets and network performance metrics.
   - Optimise backend endpoints for mobile payload efficiency.
   - Conduct device farm tests across OS/browser variants.
4. **Unified Observability & Testing**
   - Deploy telemetry stacks (logging, metrics, tracing) for all clients.
   - Implement automated test suites (backend, frontend, Flutter, load, security).
   - Integrate Core Web Vitals/Lighthouse gating and QA dashboards.
   - Produce exploratory testing charters and defect triage workflows.
5. **Integration AI Experience Enhancements**
   - Roll out AI-assisted messaging, recommendation chips, and dispute triage flows.
   - Ensure graceful degradation when providers are disabled or rate limited.
   - Add offline caching for integration-driven data.
   - Validate analytics schema governance across channels.

## Milestone 5 – Release, Documentation & Production Readiness (Target Week 8–10)
1. **Documentation & Training Completion**
   - Update README, setup guides, architecture diagrams, and `.env.example`.
   - Publish integration manuals, payment/dispute runbooks, and operator guides.
   - Deliver training sessions for support, ops, sales teams.
   - Capture feedback and iterate on materials.
2. **Release Engineering & Automation**
   - Finalise CI/CD pipelines with blue/green deployments, rollback scripts, and environment validation.
   - Generate SBOMs, license scans, and dependency audit reports.
   - Configure monitoring alerts for release rollout.
   - Dry-run deployment and rollback rehearsals.
3. **Compliance & Security Sign-Off**
   - Complete penetration tests, dependency scans, OWASP ASVS checks.
   - Gather GDPR, SOC2, accessibility evidence packages.
   - Review security posture with leadership and legal teams.
   - Approve release gate checklist.
4. **Testing & QA Closure**
   - Compile automated and manual test reports covering payments, messaging, integrations, mobile parity.
   - Execute final regression suite and capture defect burn-down metrics.
   - Finalise QA sign-off templates and archive evidence.
   - Document post-launch monitoring plan.
5. **Change Management & End-of-Update Report**
   - Write changelog, release notes, and end-of-update report summarising milestones.
   - Host stakeholder walkthrough and capture final approvals.
   - Transition monitoring to production support with on-call rotation updates.
   - Schedule post-launch review and feedback loop.

---

## Design Milestone Addendum
To support the wider Version 1.50 delivery, the design organisation will track the following complementary milestones (see `Design_update_milestone_list.md` for full detail):

1. **Milestone D1 – System Foundations & Tokenisation (Week 1–2):** Finalise cross-platform tokens, typography, and baseline components with accessibility validation.
2. **Milestone D2 – Navigation & IA Alignment (Week 2–4):** Harmonise navigation artefacts, compliance overlays, and Flutter parity plans.
3. **Milestone D3 – Page Templates & Partial Library (Week 3–6):** Produce modular templates for marketing, dashboards, creation studio, and finance journeys.
4. **Milestone D4 – Mobile Parity & Theme Extensions (Week 5–7):** Adapt shared components for Flutter and deliver emo/premium theme executions.
5. **Milestone D5 – Design QA & Handover (Week 7–9):** Complete design QA, documentation, and cross-functional sign-offs prior to development freeze.

These design milestones integrate with Milestones 1–5 by supplying the visual system, navigation artefacts, and QA gates required for implementation readiness.
