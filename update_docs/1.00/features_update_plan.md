# Version 1.00 – Features Update Plan

> **Scope Reminder**: Version 1.00 combines geo-zonal intelligence, advanced booking flows, marketplace & inventory, monetisation, compliance, analytics, and multi-app delivery across web and four Flutter apps. This plan outlines end-to-end execution across discovery, design, implementation, testing, launch, and post-launch governance.

## 1. Programme Mobilisation & Governance
1. **Executive Kick-off (Week 0)**
   - Confirm feature objectives, budget, and target launch window.
   - Ratify KPIs (matching accuracy, adoption metrics, compliance SLAs, ad revenue targets).
2. **Operating Model**
   - Create cross-functional squads aligned to pillars: Geo-Zone, Booking Lifecycle, Marketplace & Inventory, Communications, Compliance & Governance, Monetisation & Ads, Analytics, Internationalisation.
   - Assign squad leads, delivery managers, QA owners, and compliance champions.
3. **Planning Artefacts**
   - Build programme roadmap with phased milestones (Alpha, Beta, GA) and gate reviews.
   - Establish RACI matrix covering product, engineering, design, QA, legal, ops, finance.
   - Configure project tracker (JIRA/Linear) with epic/story hierarchy mapped to requirement IDs.
4. **Risk & Dependency Management**
   - Stand up risk register with weekly review cadence.
   - Document external dependencies (Agora contracts, AI provider agreements, FX feeds, identity verification vendors) and assign owners.
5. **Communication Plan**
   - Publish weekly status digest, bi-weekly steering committee, and ad-hoc incident protocol.

## 2. Discovery & Solution Design
1. **User & Market Research Refresh**
   - Conduct interviews with consumers, servicemen, SMEs, and enterprises to validate feature expectations.
   - Review competitor landscape (UK service marketplaces) for compliance handling and monetisation tactics.
2. **Process Mapping Workshops**
   - Document end-to-end flows: zone creation, booking funnel (on-demand/booked), custom jobs & bidding, rentals & sales, dispute escalation, commission settlement, ads campaign management.
   - Identify control points for GDPR consent, insurance/DBS verification, and marketplace eligibility.
3. **Experience Design**
   - Produce UX flows and high-fidelity designs for web and Flutter apps (all personas) covering explorer, profiles, panels, chat, video calling, inventory, and analytics dashboards.
   - Define accessibility compliance requirements (WCAG 2.1 AA) and localisation rules.
4. **Technical Architecture**
   - Update architecture diagrams showing services (Zones Service, Booking Orchestrator, Marketplace Engine, Compliance Vault, Ads Manager, Analytics Pipeline).
   - Design data schemas, message queues, caching strategy, and observability instrumentation.
   - Define integration contracts for Agora, AI providers (OpenAI/Claude), payment gateways, FX/tax providers, document verification partners.
5. **Security & Compliance Design Review**
   - Align with InfoSec on RBAC changes, MFA, session management, audit logging.
   - Produce Data Protection Impact Assessment (DPIA) updates for new data flows.

## 3. Backend Engineering Plan
1. **Foundational Setup**
   - Create feature branches, update coding standards, configure database migrations, and set up PostGIS/geo-indexing.
2. **Geo-Zonal Services**
   - Implement APIs: `POST/PUT/DELETE /zones`, `POST /zones/{id}/services`, `GET /zones/analytics`.
   - Add zone validation utilities (polygon snapping, overlap detection) and admin simulation endpoints.
3. **Booking & Custom Job Engine**
   - Extend booking schema for on-demand flag, scheduling, and multi-serviceman assignments.
   - Build workflow engine for custom jobs: creation, bidding, comment threads, acceptance/rejection, dispute triggers.
   - Integrate commission engine and tax/multi-currency calculations into booking lifecycle.
4. **Marketplace & Inventory**
   - Develop services for inventory ledger, rental agreements, marketplace listings (rent/sell), insured seller enforcement.
   - Provide APIs for rentals linked to bookings and stand-alone rentals, deposit handling, and return inspections.
5. **Communications Layer**
   - Integrate chat service with AI plug-ins (per-provider API keys, moderation hooks, logging) and message persistence.
   - Build Agora session management, PSTN fallback, and session tokens for web + mobile.
6. **Compliance & Governance**
   - Implement document submission pipeline with status transitions, automated expiry alerts, and reviewer queues.
   - Extend RBAC, audit logging, anomaly detection, and GDPR tooling (consent capture, export/delete endpoints).
7. **Ads & Monetisation**
   - Create Fixnado/Finova campaign manager service: campaign CRUD, targeting rules, budgets/pacing, billing.
   - Hook into analytics pipeline for attribution and billing reconciliation.
8. **Analytics & Reporting**
   - Expand event stream to capture bookings, bids, rentals, disputes, ad interactions.
   - Implement aggregation jobs for dashboards (zone heatmaps, serviceman productivity, inventory turnover, ad ROI).
9. **Testing & Code Quality**
   - Enforce unit/integration tests per module, contract tests for external APIs, and linting/security scans.

## 4. Frontend Web (React) Execution
1. **Infrastructure**
   - Upgrade routing/state management as required, ensure map libraries and Agora SDK are configured, set up localisation framework.
2. **Explorer & Zone Visualisation**
   - Build global explorer with search filters (zones, categories, packages, rentals, compliance status) and map overlays for polygons.
3. **Booking Experience**
   - Deliver multi-step booking wizard with on-demand/scheduled toggle, serviceman selection, custom job creation, bid review, acceptance, and dispute initiation.
4. **Marketplace & Inventory UI**
   - Create listings pages for rentals/sales, provider storefront management tools, inventory dashboards, insured badges, rental lifecycle screens.
5. **Profiles & Business Fronts**
   - Implement dynamic profile layouts: banners, videos, galleries, reviews, social links, past projects, service packages.
6. **Panels & Governance Interfaces**
   - Expand admin, servicemen, provider/SME, and enterprise panels with modules: compliance queue, commission management, analytics, ad campaign manager, security controls.
7. **Communications Components**
   - Embed chat with AI toggle, show token usage warnings, integrate Agora video/phone launcher, notifications centre, dispute threads.
8. **Internationalisation & Compliance UX**
   - Provide multi-language toggle, currency display, tax breakdowns, consent modals, MFA prompts, secure document uploads.
9. **Testing**
   - Implement component tests, Cypress/Playwright E2E flows, accessibility audits, performance budget checks.

## 5. Flutter Apps Delivery (Servicemen, User, Provider, Enterprise)
1. **Framework Alignment**
   - Upgrade Flutter dependencies, ensure Agora SDK integration, configure localisation (ARB files) and theming updates.
2. **Geo & Explorer Modules**
   - Implement zone-based discovery and explorer search with maps, filters, and zone-based recommendations.
3. **Booking & Job Management**
   - Provide booking wizard, job timeline, bid submission, comment threads, acceptance/rejection flows, availability scheduling, multi-serviceman coordination.
4. **Marketplace & Inventory**
   - Enable browsing and managing rentals/sales, inventory adjustments, rental check-in/out, deposit handling, tool availability alerts.
5. **Profile & Business Fronts**
   - Support media uploads (banners, avatars, videos), business front editing, showcase of past projects and reviews.
6. **Communication & Collaboration**
   - Integrate chat with AI assist toggle, Agora video/voice calling, phone call fallback, push notifications, dispute messaging.
7. **Panels & Dashboards**
   - Provide role-specific dashboards (compliance alerts, commission summaries, ad campaign stats, analytics widgets).
8. **Security & Compliance UX**
   - Add MFA flows, document upload & verification states, consent prompts, GDPR data request entry point.
9. **Testing**
   - Unit/widget tests, integration tests, device farm E2E (Android/iOS), performance profiling, localisation verification.

## 6. Data, Analytics & Reporting
1. **Data Warehouse Enhancements**
   - Extend schemas for zones, bookings, custom jobs, inventory, ads, disputes, compliance documents, communication metrics.
2. **ETL/ELT Pipelines**
   - Update ingestion jobs, ensure near-real-time feeds for dashboards, handle GDPR-compliant data retention.
3. **Analytics Products**
   - Build dashboards per persona (Admin, Provider, Serviceman, Enterprise) featuring KPIs, alerts, and drill-downs.
4. **Alerting & Monitoring**
   - Configure threshold-based alerts (low stock, expiring documents, high dispute rate, ad overspend, zone gaps).
5. **Data Governance**
   - Maintain metric catalogue, data dictionary, consent tracking, audit logs, anonymisation scripts.

## 7. Infrastructure, Security & DevOps
1. **Environment Provisioning**
   - Set up dev/stage/pre-prod environments with feature toggles, seeded data, and integration keys (Agora sandbox, AI test keys, payment sandbox, verification sandbox).
2. **CI/CD Enhancements**
   - Add pipelines for backend microservices, React app, Flutter apps, infrastructure-as-code updates, automated testing gates, security scans, and compliance checks.
3. **Secrets & Key Management**
   - Implement vault rotation for AI provider keys, Agora secrets, payment tokens, encryption keys.
4. **Observability**
   - Expand logging, metrics, tracing for new services; create Grafana/Datadog dashboards; configure on-call alerts.
5. **Security Hardening**
   - Apply MFA enforcement, session management, anomaly detection, penetration testing, vulnerability scanning.
6. **Scalability Planning**
   - Configure auto-scaling policies, caching layers, queue backpressure handling for chat/video/analytics workloads.

## 8. Quality Assurance Strategy
1. **Test Planning**
   - Create master test plan covering functional, integration, E2E, performance, security, accessibility, localisation, compliance validation.
2. **Automation Coverage**
   - Backend API tests (Postman/Newman), contract tests, queue/event validation.
   - Frontend E2E (Cypress/Playwright), visual regression for UI components.
   - Flutter integration tests executed on CI device farms.
3. **Performance & Resilience Testing**
   - Load test chat, Agora sessions, explorer search, ad campaign dashboards.
   - Conduct chaos engineering drills on core services (booking, payments, chat).
4. **Compliance Verification**
   - Execute GDPR DPIA validation, UK compliance walkthrough, document verification audit, HMRC reporting simulation.
5. **User Acceptance Testing (UAT)**
   - Run scenario-based UAT with pilot providers, servicemen, enterprise partners; capture feedback loops.
6. **Bug Triage & Release Gates**
   - Daily defect triage meetings, severity prioritisation, exit criteria per milestone (Alpha, Beta, GA).

## 9. Training, Documentation & Change Management
1. **Documentation Pack**
   - Update API references, architecture docs, SOPs for compliance/ops, user guides for panels and apps.
2. **Training Sessions**
   - Deliver workshops for support agents, compliance officers, provider onboarding specialists, ad ops teams, and internal QA.
3. **Go-Live Playbooks**
   - Prepare incident response guides, escalation matrix, communication templates for customers and partners.
4. **Marketing & Communication**
   - Coordinate launch messaging, release notes, knowledge base articles, in-app announcements, and Finova Ads promotional campaigns.

## 10. Launch Readiness & Deployment
1. **Beta Release**
   - Deploy to closed beta (selected zones/providers). Monitor KPIs, gather telemetry, conduct feedback sessions.
2. **Operational Readiness Review**
   - Verify support coverage, on-call rotations, compliance staffing, ad operations readiness.
3. **Go/No-Go Checklist**
   - Confirm testing sign-off, security approvals, data migration success, training completion, documentation readiness.
4. **Staged Rollout**
   - Gradually enable zones/regions, monitor system health, adjust feature flags.
5. **Hypercare**
   - Two-week hypercare with daily standups, rapid bug fix pipeline, dedicated analytics tracking.

## 11. Post-Launch Optimisation
1. **Performance Monitoring**
   - Track KPIs, error budgets, adoption metrics, SLA compliance, ad spend efficiency.
2. **Feedback Backlog**
   - Collect feedback from support tickets, NPS/CSAT, analytics insights, and create prioritised backlog for 1.01+.
3. **Continuous Compliance**
   - Schedule periodic audits, document retention reviews, penetration testing, GDPR data subject request drills.
4. **Revenue & Growth Experiments**
   - Iterate on Finova targeting strategies, run A/B tests on explorer layout, evaluate subscription or premium placement models.
5. **Retrospective**
   - Conduct cross-squad retrospective, document lessons learned, refine processes for future releases.

## 12. Exit Criteria for Version 1.00
- All critical/high defects closed; medium defects with mitigation plans.
- KPIs trending towards targets during beta and hypercare.
- Compliance sign-off (legal, GDPR, UK insurance/DBS).
- Documentation, training, and support playbooks published.
- Observability dashboards active, alerts tuned, on-call roster confirmed.
