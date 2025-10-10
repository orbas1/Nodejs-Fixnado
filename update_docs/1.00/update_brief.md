# Version 1.00 Update Brief

## 1. Executive Summary
Version 1.00 establishes Fixnado as a connected services marketplace that unites geo-aware service discovery, multi-channel bookings, tooling rentals, monetisation, and compliance automation across web and Flutter experiences. The update modernises the customer and provider journey from first discovery to job completion while unlocking new revenue streams and providing governance-grade oversight for administrators. Delivery requires coordinated execution across backend services, React web, Flutter mobile apps, infrastructure, and quality assurance teams.

## 2. Scope Overview
The scope consolidates the feature families captured in the feature portfolio and detailed update plan into the following pillars:

1. **Geo-Zonal Intelligence** – Polygon-based zone designer, zonal service catalogues, zone analytics, and service-to-zone mapping ensuring accurate provider routing.
2. **Booking & Job Lifecycle** – On-demand and scheduled bookings, multi-serviceman assignments, custom job workflows, bidding and negotiation tooling, and enriched booking statuses.
3. **Marketplace & Inventory** – Unified rentals and sales marketplace with insured seller validation, inventory ledger, rental logistics, and booking upsell hooks.
4. **Provider & Client Experience** – Explorer search, business front pages, rich serviceman profiles, promotional banners, and package configuration.
5. **Communications Suite** – Real-time chat with AI assist, Agora video/voice, notification routing, and dispute-specific messaging channels.
6. **Governance & Compliance** – Role-specific admin/provider panels, commission management, document verification workflows, dispute resolution, GDPR tooling, and security hardening (MFA, session controls, anomaly detection).
7. **Monetisation & Ads** – Fixnado and Finova ad platforms with targeting, budgeting, creative approval, and campaign analytics.
8. **Analytics & Reporting** – Zone, booking, inventory, and ads dashboards powering operational excellence.
9. **Internationalisation & Security** – Multi-language, multi-currency, tax compliance, and RBAC expansion across touchpoints.

## 3. Key Deliverables by Workstream
### Backend Services
- Geo-zone service for polygon CRUD, service mappings, and analytics snapshotting.
- Booking orchestrator supporting multi-serviceman lifecycle, bidding threads, and SLA timers.
- Marketplace APIs covering listings, inventory transactions, rental agreements, and insured seller checks.
- Compliance/document service managing submissions, verification workflows, expiry reminders, and dispute artifacts.
- Financial layer for commission rules, currency conversion, tax logic, and revenue-sharing reports.
- Communications microservices integrating AI providers, Agora session orchestration, transcript storage, and notification routing.
- Analytics pipeline extensions for booking funnels, inventory turnover, ad performance, and zone KPIs.

### Frontend Web (React)
- Global explorer with zonal map overlays, advanced filters, and package/rental surfacing.
- Booking funnel redesign with guided steps, custom job builder, bid management UI, and SLA visualisation.
- Marketplace catalogue with insured seller badges, rental logistics status, and upsell widgets.
- Business fronts and serviceman profiles including banners, hero video, galleries, reviews, and social links.
- Expanded admin/provider/enterprise panels hosting compliance queue, commission settings, analytics dashboards, and Finova ad manager.
- Embedded chat with AI assist toggles, Agora call launchers, GDPR consent modals, and MFA prompts.

### Flutter Apps (Servicemen, User, Provider, Enterprise)
- Parity of geo-zonal search, booking, bidding, and availability management.
- Mobile-first inventory visibility and rental request flows.
- In-app chat with AI assist, Agora video/voice integration, and notification routing.
- Role-specific panels exposing compliance alerts, commission summaries, and job queues.
- Internationalisation support for languages, currencies, and tax displays.

### Infrastructure & DevOps
- Staging environments mirroring production integrations (Agora, AI, payments) with secure key vaulting.
- CI/CD updates for new backend, frontend, and mobile test suites plus compliance checks.
- Observability enhancements with logging, tracing, and alerting for new services.
- Data protection hardening: encryption at rest for documents, anonymised analytics datasets, GDPR-compliant retention policies.
- Auto-scaling configurations for chat, calling, and explorer workloads.

### Quality Assurance & Compliance
- Comprehensive unit, integration, E2E, performance, and security testing suites per feature group.
- Automated regression coverage for booking flows, marketplace transactions, compliance submissions, and ad campaign management.
- Load testing for real-time communications and search; chaos drills for critical services.
- GDPR/UK compliance validation including document workflows, consent prompts, and HMRC reporting simulations.
- Pilot UAT with internal teams and selected providers validating custom jobs, AI chat behaviour, and zone accuracy.

## 4. Execution Structure
### Phase 0 – Mobilisation
- Kick-off with product, engineering, compliance, marketing, and customer operations.
- Confirm squad assignments, capacity plans, and contingency buffers.
- Finalise requirements traceability in the tracker with regulatory linkage.

### Phase 1 – Architecture & Foundations
- Update system diagrams, schemas, and integration contracts for external providers (Agora, AI, payments, insurance).
- Extend RBAC model and security controls.
- Provision staging infrastructure and key management.

### Phase 2 – Feature Implementation
- Parallel delivery across backend, frontend, and Flutter squads following the themed epics.
- Incremental merges into develop branch gated by feature toggles for zonal intelligence, booking lifecycle, marketplace, communications, compliance, and monetisation components.

### Phase 3 – Integrated Testing & Hardening
- Execute automated and manual test suites, regression runs, performance testing, and compliance audits.
- Address defect backlogs through coordinated triage between QA and feature squads.
- Conduct documentation updates, run support and operations training.

### Phase 4 – Launch & Hypercare
- Staged rollout starting with beta cohorts; monitor KPIs (matching accuracy, compliance adherence, rental adoption, AI chat usage, uptime).
- Maintain hypercare rotation for two weeks, collecting feedback and logging iterative improvements for post-launch roadmap.

## 5. Milestones & Target Windows
| Milestone | Description | Target Window | Dependencies |
| --- | --- | --- | --- |
| M1 – Mobilisation Complete | Stakeholder alignment, squad staffing, tracker baselined, risk register initiated | Week 1 | Executive approvals |
| M2 – Architecture Sign-off | Schemas, API contracts, security design, infrastructure plan ratified | Week 3 | M1 |
| M3 – Core Services Alpha | Geo-zone, booking orchestrator, marketplace, compliance, and communications services deployed to staging | Week 8 | M2, staging readiness |
| M4 – Frontend & Flutter Feature Freeze | Web and mobile clients feature-complete with toggles, ready for full regression | Week 11 | M3, design assets |
| M5 – QA & Compliance Exit | Regression suite green, load tests passed, GDPR/UK audits signed | Week 13 | M4, QA resources |
| M6 – Launch & Hypercare Start | Production rollout initiated with monitoring dashboards active | Week 14 | M5, go-live approvals |

## 6. Task & Progress Snapshot
| Workstream | Key Tasks | Owner Squad | Status | Notes |
| --- | --- | --- | --- | --- |
| Geo-Zonal Intelligence | Polygon editor, zone-service mapping API, analytics snapshots | Backend & Frontend | In Discovery | Awaiting GIS library selection |
| Booking Lifecycle | Booking orchestrator, multi-serviceman UI, bidding threads | Backend, Frontend, Flutter | Planned | Requirements baselined, stories drafted |
| Marketplace & Inventory | Inventory ledger, rental workflow, insured seller validation | Backend, Frontend | Not Started | Depends on compliance document service |
| Communications Suite | AI chat integration, Agora orchestration, notification routing | Backend, Frontend, Flutter | In Discovery | API contract drafts under review |
| Governance & Compliance | Admin panels, commission rules, document workflows | Backend, Frontend | Planned | Legal review scheduled week 2 |
| Monetisation & Ads | Campaign manager, targeting UI, spend analytics | Backend, Frontend | Not Started | Requires analytics pipeline extensions |
| Analytics & Reporting | Dashboards, export tools, monitoring hooks | Data & Frontend | Not Started | Waiting on event schema finalisation |
| QA & Compliance | Automated suites, performance testing, GDPR validation | QA & Compliance | Planned | Test architecture defined during Phase 1 |

## 7. Quality & Risk Management
- **Risk Register**: Maintained with severity, probability, mitigation owner, and review cadence (weekly). Initial risks include GIS accuracy, AI moderation, inventory reconciliation, and regulatory compliance.
- **Definition of Done**: Includes code review, automated test coverage, accessibility checks, security scan, documentation updates, and deployment checklist completion.
- **Issue Escalation**: Cross-functional triage sessions twice weekly; critical blockers escalated to steering committee within 24 hours.
- **Compliance Oversight**: Dedicated compliance lead embedded with governance squad to approve document workflows, consent flows, and data handling.

## 8. Dependencies & Integrations
- External services: Agora (video/voice), OpenAI/Claude (AI chat), payment gateways (multi-currency), insurance/ID verification providers, push notification services.
- Internal prerequisites: Existing billing infrastructure alignment, document storage enhancements, analytics event schema standardisation, RBAC expansion, and deployment pipeline updates.

## 9. Communication & Reporting
- Weekly programme status reports covering milestone burn-down, risk register updates, and progress metrics.
- Daily stand-ups per squad with cross-squad sync twice a week.
- Stakeholder demos at the end of each sprint (bi-weekly) showcasing incremental functionality.
- Confluence/Notion space hosting artefacts (designs, API contracts, test plans) linked to the update tracker.

## 10. Launch Readiness Checklist (High-Level)
- ✅ Feature toggles audited and default states reviewed.
- ✅ Monitoring dashboards (zones, bookings, communications, ads) live in staging and production.
- ✅ Runbooks prepared for incident response covering chat outages, payment failures, and compliance escalations.
- ✅ Support & operations training delivered with updated SOPs and knowledge base articles.
- ✅ Legal sign-off obtained for GDPR, insurance, DBS, and advertising compliance.

## 11. Post-Launch Focus
- Gather product analytics on booking conversion, AI chat adoption, and rental attachment rate; feed insights into optimisation backlog.
- Refine predictive models for provider recommendations and inventory forecasting.
- Explore partner integrations (insurers, finance providers) based on marketplace demand.
- Prioritise automation for compliance renewals and dispute adjudication to reduce manual workload.

---
**Document Owners**: Product Management (strategic alignment), Engineering Programme Management (delivery oversight), Quality & Compliance Leads (testing and regulatory assurance).
