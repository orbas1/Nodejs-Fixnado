# Fixnado Version 1.00 – Feature Update Plan

## 1. Planning Overview
Version 1.00 repositions Fixnado as an enterprise marketplace. The plan below sequences delivery across five pillars: release readiness, timeline hub & support, marketplace commerce, persona dashboards, and compliance/documentation. Each pillar lists coordinated actions for Backend, Frontend, Mobile (user/provider apps), Database, API, Logic, Design, QA, and Operations so squads can execute in parallel while keeping governance intact.

### Guiding Principles
- Remove all learner/instructor/course constructs from copy, schemas, and navigation before building new functionality.
- Every feature ships with CRUD completeness, deterministic intelligence, and analytics instrumentation.
- Automation-first mindset: migrations, seeders, deployments, and tests run via scripts/UI with evidence stored in the release vault.
- Persona dashboards (user, serviceman, crew, provider, enterprise, admin) must embed finance/escrow/tax and hub modules—no separate finance console.
- Timeline hub (Timeline, Custom Job Feed, Marketplace Feed) and Chatwoot support are treated as critical path deliverables.

## 2. Pillar-by-Pillar Execution
### Pillar A – Release Readiness & Automation
| Track | Actions |
| --- | --- |
| **Backend** | Modularise controllers/services; remove learner logic; add deployment orchestration service; create telemetry + audit logging middleware. |
| **Frontend** | Build deployment UI (if selected) exposing environment toggles, integration status, rollback actions; surface readiness dashboards for operators. |
| **User Mobile App** | Integrate remote config to respond to feature toggles; add telemetry/health reporting. |
| **Provider Mobile App** | Mirror toggle handling; implement deployment status messaging for providers. |
| **Database** | Write migrations/seeders for services, rentals, materials, zones, tags, policies; add verification scripts and rollback procedures. |
| **API** | Document new endpoints for deployment automation, readiness evidence, and taxonomy maintenance. |
| **Logic** | Define readiness score computation, rollback guards, and automation flows for seeding + migrations. |
| **Design** | Create operator console layouts, readiness scorecards, and deployment UI flows. |
| **QA** | Build CI pipelines for unit, integration, load, stress, usage, security, CRUD, timeline hub, AI, login/registration, dashboard, mobile, zone, commerce tests with gating. |
| **Operations** | Draft release runbooks, rollback drills, chaos playbooks, and escalation ladders; schedule rehearsal windows. |

> **Status 2024-05-16:** CI/CD infrastructure delivered (GitHub Actions Terraform pipeline, CodeDeploy blue/green topology, secrets rotation CLI). Focus shifts to database migration automation and readiness dashboards in UT-003.

### Pillar B – Timeline Hub & Support
| Track | Actions |
| --- | --- |
| **Backend** | Rename live feed to timeline hub across services; implement feed orchestration for Timeline, Custom Job Feed, Marketplace Feed; add ad/recommendation placement APIs; build moderation queue services; integrate Chatwoot webhooks. |
| **Frontend** | Update timeline hub UI with responsive cards, tabs, ads/recommendations widgets, follow/unfollow, reporting, saved filters, urgency badges; add moderation console; integrate Chatwoot bubble. |
| **User Mobile App** | Implement timeline hub parity with offline caching, push notifications for urgent jobs, media handling, moderation actions, and saved filters per feed. |
| **Provider Mobile App** | Provide feed analytics, sponsorship controls, and push notifications for mentions/escalations tied to custom jobs or marketplace shortages. |
| **Database** | Add tables for feed routing, prioritisation metadata, moderation cases, ad placements, timeline analytics, and Chatwoot linkage. |
| **API** | Expose feed-specific endpoints, ad placement APIs, recommendation endpoints, moderation actions, notification triggers, and Chatwoot sync routes. |
| **Logic** | Implement ranking algorithms, urgency scoring, moderation rules, escalation workflows, and analytics aggregation per feed. |
| **Design** | Produce wireframes for timeline hub tabs, moderation panels, ads/recommendation placements, urgency alerts, and support bubble interactions. |
| **QA** | Author test matrices for timeline hub validation, ad/recommendation accuracy, urgency workflows, Chatwoot integration, spam detection, report flows, and analytics instrumentation. |
| **Operations** | Train moderators/support agents; configure Chatwoot, incident triage, and reporting dashboards; plan monitoring for feed performance and uptime. |

### Pillar C – Marketplace Commerce & Catalogues
| Track | Actions |
| --- | --- |
| **Backend** | Build services/rentals/materials modules with CRUD, availability, pricing, escrow, wallet, tax, refund logic; integrate payments; expose analytics events. |
| **Frontend** | Create explorer/search with zone, skill, qualification, pricing filters; design storefront and business front pages; implement service/rental/material detail, comparison, and checkout flows; embed recommendations/ads. |
| **User Mobile App** | Deliver explorer/search, detail pages, checkout, wallet, order tracking, and support access with offline order summaries. |
| **Provider Mobile App** | Provide listing management, availability calendars, pricing controls, fulfillment dashboards, and notifications for orders/rentals/materials. |
| **Database** | Create schemas for listings, inventory, pricing, discounts, escrow, payments, logistics, reviews, analytics, and taxonomy references. |
| **API** | Publish endpoints for search, checkout, wallet, escrow, finance exports, analytics, and inventory updates with RBAC guards. |
| **Logic** | Define pricing engines, availability checks, escrow lifecycles, refund rules, logistics updates, recommendation scoring, and compliance checks. |
| **Design** | Produce UI kits for marketplace pages, checkout steps, receipts, finance cards, rating widgets, and analytics overlays. |
| **QA** | Cover E2E flows for service purchase, rental booking, material purchase, refunds, escrow release, wallet funding, tax calculations, analytics instrumentation, and zone coverage. |
| **Operations** | Document finance/escrow/tax procedures, reconciliation steps, fraud monitoring, and dispute escalation; coordinate with payment providers. |

### Pillar D – Persona Dashboards & Navigation
| Track | Actions |
| --- | --- |
| **Backend** | Provide persona-specific APIs aggregating metrics, pipeline data, finance snapshots, notifications, and hub content. |
| **Frontend** | Build dashboards for user, serviceman, crew, provider, enterprise, admin per required sections; implement mega menus, tabbed navigation, footer transitions, language dropdown update, and quick actions. |
| **User Mobile App** | Mirror dashboard modules with responsive widgets, charts, and actionable lists; enable persona switching via role changer. |
| **Provider Mobile App** | Deliver business dashboards (pipeline, crew roster, rentals, inventory, payments) with offline caching for key data. |
| **Database** | Optimise materialised views or caching layers for dashboard metrics; store preferences, layout configs, and widget ordering. |
| **API** | Provide aggregated endpoints for each dashboard section with RBAC, pagination, and analytics events. |
| **Logic** | Implement timeline widgets, recommendation feeds, finance calculators, KPI roll-ups, and alert rules per persona. |
| **Design** | Create dashboard wireframes, widget templates, chart styles, and responsive breakpoints; finalise mega menu + footer designs. |
| **QA** | Validate each dashboard module for functionality, permissions, data accuracy, analytics instrumentation, and responsive behaviour. |
| **Operations** | Develop training material for each persona, including quick start guides, metrics interpretation, and escalation contacts. |

### Pillar E – Compliance, Documentation & Enablement
| Track | Actions |
| --- | --- |
| **Backend** | Implement GDPR tooling (DSAR API, consent records, retention jobs), legal acknowledgement tracking, audit exports, and security scanning automation. |
| **Frontend** | Build legal/policy pages with CMS workflow, knowledge base, onboarding tours, release notes viewer, upgrade guides, and acknowledgement modals. |
| **User Mobile App** | Provide access to policies, guides, onboarding tours, and consent management with offline readability. |
| **Provider Mobile App** | Mirror policy access and onboarding modules; add compliance reminders for crews/providers. |
| **Database** | Store legal documents, version history, consent logs, training completions, release readiness evidence, and DSAR records. |
| **API** | Expose endpoints for policy retrieval, acknowledgements, DSAR submission/status, release readiness evidence, and training completion. |
| **Logic** | Automate compliance reminders, training expiry notifications, evidence aggregation, and policy publication workflows. |
| **Design** | Layouts for legal pages, onboarding tours, release notes, evidence dashboards, and enablement hubs. |
| **QA** | Verify policy publication, acknowledgement logging, DSAR lifecycle, evidence attachments, README/full guide accuracy, and documentation links. |
| **Operations** | Coordinate legal review, GDPR audits, training sessions, partner enablement, and release communications; maintain evidence vault and scorecards. |

## 3. Sequencing & Dependencies
1. **Preparation (Week 0–1)**
   - Audit repository for learner/instructor remnants; remove or rename assets.
   - Finalise taxonomy definitions, zone coverage, and persona requirements.
   - Lock integration credentials and environment provisioning strategy.
2. **Foundation Sprint (Week 1–3)**
   - Implement deployment automation, migrations/seeders, telemetry stack, RBAC refactor, `.env` templates, and readiness dashboards.
   - Build basic explorer/search scaffolding and navigation updates to reflect new personas.
3. **Timeline Hub & Support Sprint (Week 3–5)**
   - Timeline hub orchestration, ads/recommendations framework, Chatwoot integration, moderation tools, urgency signalling, and support analytics.
4. **Marketplace Sprint (Week 4–7)**
   - Services/rentals/materials CRUD, checkout, wallet/escrow/tax logic, storefront + business front UI, analytics instrumentation, and operations runbooks.
5. **Dashboard Sprint (Week 6–8)**
   - Persona dashboards across web and mobile, including finance widgets, metrics, hub modules, quick actions, and training content.
6. **Compliance & Enablement Sprint (Week 7–9)**
   - Legal pages, README/full guide, onboarding tours, DSAR tooling, evidence vault, enablement kits, and release communications.
7. **Hardening & Launch (Week 9–10)**
   - Execute full testing matrix, fix defects, run performance/chaos tests, rehearse blue/green rollout, finalise release readiness sign-off, and publish changelog.

## 4. Risk Mitigation & Fallbacks
- **Scope Creep**: Gate any new features via change control board; prioritise marketplace essentials before enhancements.
- **Integration Failure**: Provide stub adapters with graceful degradation if third-party services (Hubspot, Salesforce, Chatwoot, storage providers) are unavailable; document manual fallback processes.
- **Performance Regression**: Establish thresholds early, monitor via synthetic tests, and add caching/pagination/backpressure tactics during development.
- **Data Integrity**: Run seeded data validation nightly; maintain rollback snapshots for migrations/seeders.
- **Security & Compliance**: Conduct threat modelling per pillar; schedule penetration testing and GDPR review before launch freeze.

## 5. Acceptance Criteria Summary
- No learner/instructor/course terminology remains.
- Timeline hub reflected everywhere with analytics + ads/recommendations active across all feeds.
- Timeline hub delivers prioritised feeds, moderation, analytics, and escalation workflows.
- Services, rentals, materials all support full lifecycle from listing → checkout → fulfilment → support.
- Persona dashboards operational with finance/escrow/tax modules embedded.
- Deployment automation, migrations/seeders, and rollback drills complete with documentation.
- Legal + knowledge artefacts published and acknowledged; DSAR tooling functional.
- Testing evidence (unit through mobile + zone) stored in release vault with pass status.

Maintain this plan as the execution blueprint; update sequencing and risk responses as discovery occurs while preserving marketplace alignment.
