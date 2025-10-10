# Version 1.50 – Testing Plan

## Overview
The Version 1.50 testing plan validates the AI-augmented Fixnado marketplace across backend services, React web app, and Flutter mobile clients. It addresses gaps identified in the pre-update evaluations while safeguarding new capabilities such as zone intelligence, advanced bookings, rentals and inventory, custom jobs with AI collaboration, compliance governance, and monetisation tooling. Testing spans functional correctness, non-functional quality, and regulatory compliance so the release can meet enterprise-grade reliability and UK/GDPR obligations.

## Objectives
- Prove that each Version 1.50 feature pillar fulfils the behaviours described in the feature brief and feature plan without regressing baseline flows.
- Ensure remediation items from the issue report and fix suggestions are verified through targeted regression, security, and resiliency scenarios.
- Validate end-to-end experiences across Admin, Consumer, Serviceman, SME, and Enterprise personas on web and mobile, including localisation, accessibility, and offline handling.
- Provide actionable telemetry, defect triage, and go/no-go evidence to support milestone exit criteria and the end-of-update report.

## Test Scope
### In Scope
1. **Platform & Security Foundations**
   - Authentication, MFA, JWT rotation, token refresh, and session expiry flows.
   - Rate limiting, CORS, API health probes, and error contract conformance.
   - Dependency upgrades, infrastructure baselines, and OpenAPI schema governance.
2. **Zone Intelligence & Matching**
   - Zone CRUD, hierarchy rules, import/export, heatmaps, overlap alerts.
   - Explorer search, banner targeting, mobile discovery, analytics dashboards.
3. **Booking & Workforce Management**
   - On-demand, scheduled, recurring, and mixed (service + rental) bookings.
   - Team coordination, reassignment, escalation, SLA timers, notification orchestration.
4. **Marketplace, Rentals & Inventory**
   - Inventory dashboards, stock adjustments, reorder automation, deposit rules.
   - Rental lifecycle (availability, pickup/delivery, returns, damage assessment) and compliance badges.
5. **Custom Jobs, Messaging & AI Collaboration**
   - Custom job creation, bid lifecycle, threaded Q&A, dispute escalation.
   - AI-assisted drafting, moderation, consent capture, Agora voice/video sessions.
6. **Compliance, Trust & Monetisation**
   - ID/DBS/insurance verification, expiry reminders, badge propagation.
   - Dispute workflows, commission engines, Fixnado/Finova Ads configuration, billing reconciliation, revenue dashboards.
7. **Experience Parity & Mobile Completion**
   - API integrations, offline caching, localisation, accessibility, analytics instrumentation across React and Flutter apps.
   - Mobile security (secure storage, jailbreak/root detection, certificate pinning) and app store readiness.
8. **Quality, Observability & Release Operations**
   - Automated test coverage, telemetry dashboards, alert thresholds, release documentation, and support playbooks.

### Out of Scope
- Third-party partner compliance audits outside UK/EU jurisdictions (document findings only).
- Native mobile biometric enhancements targeted for post-1.50 release.
- Experimental AI models beyond provider-supplied OpenAI/Claude integrations.

## Test Phases & Activities
| Phase | Timeline Alignment | Key Activities | Deliverables |
| --- | --- | --- | --- |
| **Phase A – Foundation Verification** | Milestone 1 | Static analysis, security scans, unit tests for auth/infra modules, schema validation, API contract linting. | Security hardening test report, OpenAPI validation logs. |
| **Phase B – Zone & Booking Functional QA** | Milestone 2 | API integration tests for zones/bookings, map UI regression, geospatial accuracy checks, booking SLA simulations, notification verification. | Zone/booking feature acceptance checklist, SLA adherence metrics. |
| **Phase C – Marketplace & Collaboration QA** | Milestone 3 | Inventory/rental E2E tests, bid lifecycle automation, AI moderation checks, Agora call reliability tests, concurrency/performance baselines. | Marketplace/custom job E2E logs, AI usage compliance report. |
| **Phase D – Compliance & Monetisation QA** | Milestone 4 | Verification workflow regression, ads/commission scenario testing, trust badge propagation, accessibility audits, localisation reviews. | Compliance verification sign-off, WCAG/localisation audit results. |
| **Phase E – Mobile Readiness QA** | Milestone 5 | Flutter device matrix runs, offline scenarios, secure storage penetration tests, app store checklist validation, crash analytics monitoring. | Device matrix execution report, store readiness checklist. |
| **Phase F – Release & Regression Hardening** | Milestone 6 | Full regression suite, load/stress testing, chaos drills, disaster recovery validation, go-live rehearsal, documentation verification. | Go/no-go recommendation, load test results, DR drill report. |

## Test Types & Coverage Matrix
| Feature Area | Unit | API/Integration | UI/E2E | Performance | Security/Compliance | Accessibility/Usability | Observability |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Platform Foundations | ✅ | ✅ | ⚪ | ✅ | ✅ | ⚪ | ✅ |
| Zone Intelligence | ✅ | ✅ | ✅ | ✅ | ⚪ | ✅ | ✅ |
| Booking & Workforce | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marketplace & Inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Custom Jobs & AI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Compliance & Monetisation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Experience Parity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QA & Release Ops | ✅ | ✅ | ⚪ | ✅ | ✅ | ✅ | ✅ |
> ✅ = mandatory coverage, ⚪ = leveraged only where applicable.

## Environments & Data
- **Development:** Feature branches with local PostGIS, mocked third-party services; unit and component tests run here.
- **Integration/Staging:** Shared environment with seeded personas (Admin, Consumer, Serviceman, SME, Enterprise) and synthetic bookings, rentals, and ads campaigns. Used for integration, E2E, accessibility, and performance tests.
- **Pre-Production:** Mirrored infrastructure for load, chaos, DR, and go-live rehearsals using production-like data anonymised to meet GDPR.
- **Data Management:** Automated migration/rollback scripts, anonymised fixtures, and reset pipelines to guarantee reproducible states.

## Tooling & Automation
- **Backend:** Jest, Supertest, Newman/Postman collections, k6 for load, OWASP ZAP for dynamic security scanning.
- **Frontend:** Jest/RTL, Cypress component/E2E, Playwright for cross-browser, Lighthouse and Axe for accessibility.
- **Flutter:** Flutter test, integration_test, Patrol or Appium for device automation, Firebase Test Lab/device farms.
- **Observability:** OpenTelemetry exporters, Grafana dashboards, Sentry/Crashlytics, synthetic monitors (Checkly/New Relic).
- **CI/CD:** GitHub Actions pipelines running linting, unit, integration, E2E suites with required status checks; nightly performance and security scans.

## Roles & Responsibilities
| Role | Responsibilities |
| --- | --- |
| QA Lead | Owns testing_plan.md, schedules test cycles, collates metrics, delivers sign-off reports. |
| Backend Engineers | Maintain unit/integration tests, ensure API contract adherence, resolve defects. |
| Frontend Engineers | Implement component/E2E tests, accessibility fixes, cross-browser validation. |
| Mobile Engineers | Execute device matrix runs, secure storage validation, crash monitoring. |
| DevOps/SRE | Manage environments, observability tooling, load/chaos exercises, DR validation. |
| Product & Compliance | Review test cases for regulatory coverage, approve localisation and consent artefacts. |
| Beta Program Managers | Coordinate pilot participants, capture feedback, drive UAT sign-offs. |

## Entry & Exit Criteria
### Entry Criteria
- Feature requirements baselined with linked user stories and acceptance criteria.
- Test data fixtures, environments, and automation suites ready with successful dry-runs.
- Defect triage workflow established in issue tracker with severity SLAs.

### Exit Criteria
- All planned test cases executed with ≥ 95% pass rate; remaining defects severity ≤ Medium with mitigation plans.
- Performance benchmarks meet or exceed service-level objectives (SLOs) for response time, throughput, and error rates.
- Security, compliance, accessibility, and localisation audits signed off by respective leads.
- Go-live checklist completed with observability dashboards, runbooks, and rollback strategies validated.

## Reporting & Metrics
- Daily test execution dashboard covering pass/fail counts, defect burndown, and blocker escalation.
- Weekly quality readouts mapped to milestones, highlighting readiness of each feature pillar.
- Coverage metrics: unit (>80%), integration (>70%), E2E (>60% of critical paths), accessibility (WCAG 2.1 AA), localisation (all supported locales), security (no Critical/High open findings).
- Post-release monitoring KPIs: booking SLA compliance, AI usage moderation incidents, crash-free sessions ≥ 99%.

## Risk Management
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Delayed backend feature availability | Testing schedule slips, reduced coverage | Align sprint demos with QA smoke tests, employ feature flags and contract mocks. |
| Insufficient geospatial test data | False negatives/positives in zone matching | Generate synthetic polygons, import council boundary datasets, validate via exploratory sessions. |
| Agora/AI third-party instability | Collaboration features fail under load | Implement sandbox monitoring, fallback messaging channels, contract retries, and vendor escalation paths. |
| Device farm capacity constraints | Mobile readiness blocked | Reserve slots early, prioritise critical devices, parallelise with manual exploratory sessions. |
| Compliance audit findings late in cycle | Release delays | Run mid-cycle compliance reviews, maintain checklist tied to acceptance criteria, escalate blockers in steering meetings. |

## Communication & Governance
- Testing updates shared in twice-weekly QA stand-ups and milestone readiness reviews.
- Defects tracked in shared backlog with tags for feature pillar, severity, and regression status.
- testing_plan.md remains the living source of truth; updates require QA Lead approval and notification in release notes.
- Final sign-off captured during Milestone 6 go/no-go review alongside the end-of-update report.
