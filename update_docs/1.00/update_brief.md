# Version 1.00 Update Brief

## 1. Executive Summary
Version 1.00 elevates Fixnado into a geo-aware, compliance-ready services marketplace that unifies consumer discovery, provider monetisation, tooling rentals, and cross-platform collaboration. The release spans backend microservices, the React web experience, and four Flutter applications (Servicemen, User, Provider, Enterprise). Delivery introduces a zonal intelligence layer, an extensible booking & job engine, a rentals-enabled marketplace, AI-assisted communications, monetisation tooling, and analytics dashboards. As developer and quality controller, this brief provides a consolidated view of scope, execution structure, risk posture, and validation strategy required to deliver a dependable launch.

## 2. Objectives & Success Metrics
- **Customer Impact**: Increase successful match rate by 25%, reduce booking abandonment by 30%, and achieve >90% satisfaction in pilot cohorts.
- **Provider Enablement**: Drive 20% uplift in serviceman utilisation, onboard 200 insured sellers, and achieve <5% dispute escalation rate post-launch.
- **Marketplace Growth**: Capture £50k GMV in rentals within the first quarter and deliver measurable ad ROI (≥3x) through Fixnado/Finova campaigns.
- **Operational Excellence**: Achieve 99.5% uptime across new services, pass GDPR/UK compliance audits, and maintain <2% defect escape rate during hypercare.

## 3. Scope Pillars
1. **Geo-Zonal Intelligence**
   - Polygon zone designer with overlap prevention, geo-indexing, and analytics snapshots.
   - Zone-aware catalogue linking services, packages, and rentals to territories.
   - Route optimisation hooks for serviceman dispatch and demand heatmaps.
2. **Booking & Job Lifecycle**
   - Unified on-demand/scheduled booking engine with multi-serviceman orchestration.
   - Custom job workflows with bidding, negotiation threads, SLA timers, and dispute initiation.
   - Integrated commission, tax, and multi-currency support tied to booking states.
3. **Marketplace & Inventory**
   - Rentals and sales marketplace, inventory ledger, deposit handling, and insured seller verification.
   - Rental logistics (check-in/out), upsell hooks from bookings, and availability forecasting.
4. **Provider & Client Experience**
   - Global explorer with zonal overlays, dynamic filters, and package surfacing.
   - Rich business fronts, serviceman profiles, promotional banners, and portfolio galleries.
   - Role-specific dashboards for providers, enterprises, and servicemen.
5. **Communications Suite**
   - Real-time chat with AI assistant toggles, moderation, and transcript retention.
   - Agora-powered video/voice sessions with PSTN fallback and session tokens.
   - Notification routing, consent prompts, and dispute-specific messaging channels.
6. **Governance & Compliance**
   - Document submission & verification pipelines with expiry reminders and reviewer queues.
   - Commission configuration, audit logging, anomaly detection, and GDPR tooling (export/delete).
7. **Monetisation & Ads**
   - Fixnado/Finova campaign manager with targeting, budgeting, pacing, creative approval, and billing reconciliation.
   - Cross-channel ad analytics and attribution wiring into dashboards.
8. **Analytics & Reporting**
   - Booking, zone, inventory, and ad performance dashboards across personas.
   - Near real-time ETL jobs, alerting, and metric catalogues for data governance.
9. **Internationalisation & Security**
   - Multi-language/currency UX, tax displays, MFA enforcement, RBAC expansion, and secure session controls.

## 4. Platform Deliverables Overview
### Backend Services
- Zone service (CRUD, service mapping, analytics API) built atop PostGIS with validation utilities.
- Booking orchestrator handling custom job workflows, SLAs, commission logic, and dispute triggers.
- Marketplace APIs for listings, rentals, deposits, and insured seller compliance checks.
- Communications stack integrating AI chat providers, Agora session orchestration, and notification brokers.
- Compliance/document microservice with workflow states, expiry automation, and reviewer dashboards.
- Monetisation services for campaign management, targeting, budgeting, and revenue reporting.
- Analytics pipeline extensions for bookings, inventory turnover, ad ROI, and zone KPIs.

### Frontend Web (React)
- Explorer with zone overlays, advanced filters, rentals/package surfacing, and zone insights.
- Booking wizard supporting multi-serviceman selection, bidding management, SLA visualisation, and dispute entry.
- Marketplace catalogue with rental logistics, insured badges, upsell modules, and inventory management UI.
- Business fronts & serviceman profiles including hero media, galleries, testimonials, social links, and offer packages.
- Expanded admin/provider/enterprise panels covering compliance queues, commission setup, analytics, and ad manager.
- Embedded communications widgets (chat, Agora calls, notification centre, GDPR consent flows, MFA prompts).

### Flutter Applications
- Feature parity for geo-zonal explorer, booking lifecycle, bidding, availability management, and dispute handling.
- Mobile-first rental visibility, check-in/out flows, deposit tracking, and notifications.
- In-app chat with AI assist, Agora integration, push notifications, and role-based dashboards.
- Internationalisation with ARB localisation, currency formats, tax breakdowns, and secure document uploads.

### Infrastructure & DevOps
- Staging environments mirroring production integrations with secrets vaulting and feature toggle controls.
- CI/CD pipelines for backend services, web, Flutter apps, and IaC with linting, tests, and compliance gates.
- Observability stack (logging, metrics, tracing, dashboards) and scaling policies for chat, explorer, and analytics workloads.
- Security enhancements: MFA, anomaly detection, penetration testing schedule, encryption for documents/data lakes.

## 5. Execution Phasing
| Phase | Duration | Goals | Outputs |
| --- | --- | --- | --- |
| **Phase 0 – Mobilisation** | Week 0-1 | Align stakeholders, confirm squads, baseline tracker and risk register. | Kick-off artefacts, RACI, capacity plan, dependency matrix. |
| **Phase 1 – Architecture & Foundations** | Weeks 1-3 | Update system architecture, schemas, RBAC, integration contracts, staging setup. | Signed-off architecture pack, PostGIS provisioning, CI/CD enhancements, security review. |
| **Phase 2 – Feature Implementation** | Weeks 3-10 | Deliver epics across pillars with feature toggles and incremental releases into staging. | Deployed zone service alpha, booking orchestrator beta, marketplace MVP, communications stack integration, UI builds. |
| **Phase 3 – Integrated Testing & Hardening** | Weeks 9-12 | Execute automation suite, performance/security tests, compliance audits, fix defects. | Regression reports, penetration test outcomes, updated documentation, training material. |
| **Phase 4 – Launch & Hypercare** | Weeks 12-14 | Staged rollout, monitoring, KPI tracking, incident readiness, support enablement. | Go-live checklist, hypercare rota, beta feedback log, post-launch backlog seeds. |

## 6. Milestones & Target Windows
| Milestone | Target Window | Entry Criteria | Exit Criteria |
| --- | --- | --- | --- |
| **M1 – Mobilisation Complete** | Week 1 | Kick-off, squads staffed, requirements traceability mapped. | Risk register live, dependency owners assigned, progress tracker baselined. |
| **M2 – Architecture Sign-off** | Week 3 | Foundational diagrams drafted, integration contracts proposed. | Architecture review approval, security sign-off, staging infra ready. |
| **M3 – Core Services Alpha** | Week 8 | Backend services in development, CI/CD active. | Zone/booking/marketplace/comms services in staging with smoke tests passing. |
| **M4 – Client Feature Freeze** | Week 11 | Web & Flutter features integrated behind toggles. | UI/UX assets merged, localisation baseline, defect trend downward. |
| **M5 – QA & Compliance Exit** | Week 13 | Automated tests green, performance targets hit. | GDPR/UK audits passed, defect leakage <2%, release notes approved. |
| **M6 – Launch & Hypercare Start** | Week 14 | Go-live approvals obtained, support training delivered. | Production rollout initiated, monitoring dashboards active, hypercare rota engaged. |

## 7. Task Breakdown & Ownership Snapshot
| Pillar | Key Tasks | Owner Squads | Status | Notes |
| --- | --- | --- | --- | --- |
| Geo-Zonal Intelligence | Polygon editor, zone-service mapping API, analytics snapshot jobs | Backend, Frontend | In Discovery | GIS library selection and PostGIS performance benchmarking underway. |
| Booking Lifecycle | Booking orchestrator, SLA timers, bidding UI, dispute hooks | Backend, Frontend, Flutter | Planned | Requirements baselined, workflow diagrams prepared. |
| Marketplace & Inventory | Inventory ledger, rental contracts, insured seller verification, upsell hooks | Backend, Frontend | Not Started | Blocked on compliance document service interfaces. |
| Communications Suite | AI chat integration, Agora orchestration, notification routing | Backend, Frontend, Flutter | In Discovery | API contract review with vendors scheduled Week 2. |
| Governance & Compliance | Admin panels, commission rules engine, document workflows | Backend, Frontend | Planned | Legal review and DPIA updates targeted for Week 2. |
| Monetisation & Ads | Campaign manager, targeting UI, spend analytics, billing reconciliation | Backend, Frontend | Not Started | Depends on analytics event schema finalisation. |
| Analytics & Reporting | Dashboards, export tools, alerting, metric catalogue | Data, Frontend | Not Started | Awaiting event schema sign-off from architecture board. |
| QA & Compliance | Automated suites, performance testing, GDPR validation | QA & Compliance | Planned | Test architecture defined, tooling procurement in progress. |

## 8. Quality Assurance & Compliance Strategy
- **Automation Coverage**: Unit/integration tests per backend service, contract tests for external APIs, Cypress/Playwright E2E for React, Flutter widget/integration tests, infrastructure tests via IaC validation.
- **Performance & Resilience**: Load tests for chat, Agora sessions, explorer, booking orchestrator; chaos drills targeting booking, payments, and communications services.
- **Security & Privacy**: MFA enforcement, penetration testing, vulnerability scanning, anomaly detection, DPIA updates, consent logging, encryption of documents & analytics datasets.
- **Compliance Validation**: GDPR consent flow reviews, UK insurance/DBS verification workflows, HMRC reporting simulations, document retention policy verification.
- **UAT & Sign-off**: Pilot UAT with internal teams and selected providers/enterprises; severity-based triage; go-live contingent on meeting Definition of Done (code review, test coverage, accessibility, documentation, deployment checklist).

## 9. Risk Register Highlights
| Risk | Severity | Probability | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| GIS library accuracy & performance | High | Medium | Benchmark PostGIS vs. alternatives, add automated geo-validation tests, maintain fallback drawing tools. | Geo-Zone Squad Lead |
| AI chat moderation & safety | High | Medium | Implement AI message moderation, escalation workflows, manual review backlog, update privacy policy. | Communications Squad Lead |
| Inventory reconciliation errors | Medium | Medium | Double-entry accounting in ledger, nightly reconciliation jobs, automated alerts on discrepancies. | Marketplace Squad Lead |
| Regulatory compliance drift | High | Low | Embedded compliance lead, weekly audits of document workflows, maintain DPIA updates. | Compliance Lead |
| Integration readiness (Agora, payments, identity) | Medium | Medium | Secure sandbox credentials, schedule integration testing early, maintain vendor escalation channels. | DevOps Lead |
| Mobile performance regressions | Medium | Medium | Run device farm tests, profile Flutter builds, enforce performance budgets in CI. | Mobile QA Lead |

## 10. Dependencies & Integrations
- **External**: Agora voice/video, AI providers (OpenAI/Claude), payment gateways (multi-currency), insurance/ID verification partners, push notification services, FX/tax feeds.
- **Internal**: Billing infrastructure alignment, document storage enhancements, analytics schema standardisation, RBAC expansion, deployment pipeline upgrades, localisation assets.
- **Contractual/Operational**: Vendor SLAs, legal review timelines, support training availability, marketing launch sequencing.

## 11. Communication & Reporting Cadence
- Weekly programme status reports summarising milestone burn-down, risk updates, and blocker escalations.
- Daily squad stand-ups with cross-squad sync twice weekly; QA/compliance triage three times per week during testing phase.
- Bi-weekly stakeholder demos showcasing incremental functionality (zone editor, booking flow, marketplace, communications, analytics).
- Shared documentation space (Confluence/Notion) hosting architecture packs, API contracts, test matrices, release notes, and runbooks linked to the tracker.

## 12. Launch Readiness Checklist
- ✅ Feature toggles reviewed; default states agreed with product & compliance.
- ✅ Monitoring dashboards live in staging (zones, bookings, communications, ads) with alert thresholds configured.
- ✅ Runbooks for incident response (chat outage, payment failure, compliance escalation) drafted and reviewed.
- ✅ Support & operations training scheduled with updated SOPs and knowledge base articles.
- ✅ Legal sign-off for GDPR, insurance, DBS, tax, and advertising compliance captured in tracker.

## 13. Post-Launch Priorities
- Instrument product analytics for booking conversion, AI chat adoption, rental attachment rate, and ad ROI; funnel insights into optimisation backlog.
- Iterate on provider recommendation models and inventory forecasting; evaluate automation for compliance renewals and dispute adjudication.
- Plan partner integrations (insurance upsell, financing) informed by marketplace demand; scope roadmap for predictive maintenance modules.
- Conduct post-mortem and lessons-learned workshops to inform Version 1.1 planning.

---
**Document Owners**: Product Management (strategy & roadmap), Engineering Programme Management (delivery orchestration), Quality & Compliance Leads (testing & regulatory assurance).

## 14. Development & QA Workstreams
The integrated plan elevates six cross-functional tasks that blend engineering delivery with QA ownership:
1. **Mobilise Architecture, Compliance & Issue Intake (12% complete)** – Governance, CI/CD uplift, issue-triage automation, and security baselining ensure a controlled start. Responsibilities cover backend provisioning, React/Flutter pipeline extensions, DPIA refresh, and tracker integration for `issue_report.md`, `issue_list.md`, and `fix_suggestions.md`.
2. **Geo-Zonal & Booking Core Services (18% complete)** – Zone CRUD, booking orchestrator, custom job/bidding, commission logic, and regression suites land the transaction backbone with PostGIS schemas, workflow engines, and concurrency safeguards.
3. **Marketplace, Inventory & Monetisation Backbones (10% complete)** – Inventory ledger, rental lifecycle, insured seller enforcement, campaign manager services, and monetisation telemetry unlock rental and ads revenue while enforcing compliance.
4. **Cross-Channel Experience & Collaboration (15% complete)** – React explorer, Flutter parity, communications stack, business fronts, and accessibility/localisation audits deliver cohesive UX across web and mobile personas.
5. **Analytics, Data Governance & Reporting (8% complete)** – Unified event schema, GDPR-compliant pipelines, persona dashboards, alerting, and metric catalogues provide observability and governance.
6. **QA, Compliance & Launch Readiness (5% complete)** – Master test plan, automation suites, performance drills, compliance audits, and launch playbooks guarantee production confidence and hypercare readiness.

## 15. Milestone Alignment
Milestones M1–M6 translate the task portfolio into staged outcomes:
- **M1 (Weeks 0–2)** – Mobilisation and blueprinting; RACI, infrastructure, API contracts, backlog slicing, and compliance documentation complete.
- **M2 (Weeks 2–6)** – Geo-zonal and booking alpha plus observability; regression-ready zone/booking services with telemetry, chaos drills, and runbooks.
- **M3 (Weeks 4–8)** – Marketplace foundations; inventory/rental enablement, monetisation services, fraud controls, and finance reconciliation procedures.
- **M4 (Weeks 6–10)** – Experience & collaboration beta; cross-channel UX, communications integration, RBAC panels, and end-to-end comms validation.
- **M5 (Weeks 8–12)** – Analytics/governance hardening; dashboards, alerting, compliance walkthroughs, and regulator evidence packs.
- **M6 (Weeks 11–14)** – Launch readiness & hypercare; full QA certification, go-live rehearsals, monitoring activation, and end-of-update reporting.

## 16. Progress Snapshot & Risks
The progress tracker averages early-stage progress across tasks with security, completion, integration, functionality, error-free, and production indicators feeding an overall score (Task 1 currently leads at 28%). Key watchpoints:
- Complete defect intake automation to populate currently empty issue artefacts.
- Secure approval on geo-security utilities blocking Task 2 implementation start.
- Finalise marketplace compliance workshop to unlock insured seller enforcement and monetisation telemetry.

## 17. Testing & Quality Strategy Reinforcement
- Automation spans API (Postman/Newman), UI (Cypress/Playwright), Flutter (device farm), contract tests, and chaos drills; all tied to Definition of Done gates.
- Performance and resilience drills stress booking orchestrator, chat/Agora sessions, payments, analytics, and ads workloads with rollback rehearsals scheduled before Milestone M6.
- Compliance audits (GDPR, insurance/DBS, HMRC, advertising) contribute evidence packs to regulator reviews and inform remediation backlog entries.
- Documentation deliverables—release notes, runbooks, training curriculums, and metric catalogues—support hypercare and operational readiness.

## 18. Issue Management & Next Steps
While formal issues/fix suggestions are not yet logged, the plan mandates:
- Immediate activation of the issue pipeline (Task 1.4) to capture defects from regression sweeps and stakeholder feedback.
- Weekly risk reviews cross-linking development, QA, and compliance to surface blockers early.
- Iterative updates to the progress tracker and milestone statuses to reflect burn-down, integration health, and production readiness as build accelerates.
