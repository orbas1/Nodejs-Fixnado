# Fixnado Version 1.00 Update Plan

## 1. Programme Overview
Version 1.00 transforms Fixnado into a fully production-ready marketplace platform spanning services, rentals, and materials. The update focuses on automating release operations, maturing customer-facing experiences, and codifying governance so the product can be deployed without placeholders. The plan orchestrates backend, frontend, mobile, infrastructure, data, and compliance workstreams under a six-week execution window with rolling readiness checkpoints.

### Objectives
1. Deliver turnkey deployment, database, and observability automation that operations teams can execute repeatedly without engineering intervention.
2. Launch the multi-tab Timeline Hub with ads, recommendations, moderation workflows, and Chatwoot-powered support.
3. Complete marketplace commerce flows with escrow, finance, analytics, and persona dashboards ready for enterprise launch.
4. Publish legally binding policies, governance artefacts, and enablement kits aligned to UK/EU compliance requirements.
5. Provide cross-surface parity (web, mobile) with deterministic intelligence, analytics instrumentation, and accessibility adherence.

### Scope Constraints
- All work must remove residual learner/instructor terminology and align taxonomy to marketplace constructs.
- Automation must operate in containerised CI/CD and on managed infrastructure (AWS/GCP/Azure) with environment parity checks.
- Deliverables ship with tests, documentation, and rollback artefacts captured in the release vault.

## 2. Workstreams & Deliverables

### 2.1 Release Automation & Ops Hardening
- **CI/CD**: GitHub Actions pipelines for build, test, security scanning, and blue/green deployment to staging and production clusters.
- **Database Automation**: Versioned migrations, seeder scripts for services/tools/material catalogues, verification checks, and rollback playbooks.
- **Infrastructure**: Terraform modules for VPC, Kubernetes (or ECS) clusters, RDS/PostgreSQL, Redis, and object storage, plus health probes and auto-scaling policies.
- **Observability**: Centralised logging (OpenTelemetry + Loki/ELK), metrics dashboards (Prometheus/Grafana), synthetic uptime checks, and alert routing.
- **Runbooks**: Deployment rehearsal checklist, incident escalation ladder, chaos drill calendar, and readiness score formula.

#### Progress update – 16 May 2024
- `Terraform Deployments` workflow now executes environment-scoped plans on every pull request, publishes JSON diffs, and supports controlled applies via manual dispatch with AWS IAM role assumption.
- ECS infrastructure upgraded to AWS CodeDeploy blue/green deployments with dedicated validation listener (port 9443), twin target groups, and SNS-backed failure alarms to guarantee rollback automation.
- `scripts/rotate-secrets.mjs` introduced to rotate JWT/encryption/database credentials with SHA-256 audit trails; rotation is now a standard pre-deployment gate alongside the new blue/green runbook.
- Release evidence (plan artefacts, smoke reports, Grafana annotations) must be uploaded to the release vault referenced in `infrastructure/runbooks/blue-green-deployment.md` after every cutover.

#### Progress update – 20 May 2024
- Marketplace taxonomy domain/node/facet schema delivered through migration `20250601000000`, including service/rental/material assignment tables with referential integrity.
- Deterministic taxonomy seeder (`20250601010000`) populated production-grade datasets with UUIDv5 identifiers, SHA-256 checksums, and default facet values for SLAs, sustainability, and logistics filters.
- `backend-nodejs/scripts/taxonomy-integrity.mjs` published to validate seed checksums against the blueprint and output rollback SQL for rehearsal evidence; tracker updated to monitor nightly checksum pass rates.

### 2.2 Timeline Hub & Support Experience
- **Feed Orchestration Service**: Backend services consolidating Timeline, Custom Job Feed, and Marketplace Feed with ranking/urgency scoring.
- **Ad & Recommendation Placement**: Configurable inventory (stream, sidebar, dashboards) with pacing, targeting, and moderation policies.
- **Moderation Workbench**: Queues, triage statuses, audit logs, and export capabilities for compliance.
- **Chatwoot Integration**: OAuth/token setup, webhook ingestion, floating widget on web, inbox parity on mobile, and SLA analytics dashboards.
- **User Experience**: Responsive cards, saved filters, follow/unfollow, urgency badges, spam detection feedback, and accessibility compliance.

### 2.3 Marketplace Commerce & Persona Dashboards
- **Commerce Engine**: Secure checkout with escrow, wallet funding, tax calculation, refunds, and contract generation for services, rentals, and materials.
- **Inventory Management**: CRUD tooling for listings, availability calendars, logistics integrations, and shortage alerts.
- **Persona Dashboards**: Role-specific navigation with embedded finance, escrow, tax, metrics, and compliance widgets.
- **Analytics**: Conversion, inventory, and sponsorship dashboards surfaced via BI layer with RBAC controls.

### 2.4 Compliance, Governance & Enablement
- **Legal Artefacts**: Terms (4–5k words), Privacy (3–5k), Refund (2.5–5k), Community Guidelines (5k), About, FAQ.
- **Governance**: RBAC audits, GDPR tooling (DSAR portal, consent management, retention scheduler), incident response plans.
- **Enablement Kits**: Onboarding guides, operational playbooks, partner decks, and release readiness evidence templates.
- **Training**: Moderator/support curriculum, sandbox scenarios, and analytics walkthroughs.

## 3. Execution Timeline
| Week | Milestone | Key Outputs |
| --- | --- | --- |
| Week 1 | Programme Mobilisation & Architecture Baseline | Confirm scope, publish update plan, align governance, establish programme tooling, and lock taxonomy decisions. |
| Weeks 1–3 | Release Automation & Data Foundations | CI/CD scaffolding, infrastructure templates, migrations/seeders, readiness dashboards, seed data QA. |
| Weeks 3–5 | Timeline Hub & Support | Feed services, moderation tooling, Chatwoot integration, responsive UI, urgency analytics. |
| Weeks 4–6 | Marketplace Commerce & Dashboards | Checkout, wallet, escrow, analytics, persona dashboards with compliance instrumentation. |
| Weeks 5–6 | Compliance & Launch Readiness | Legal docs, GDPR tooling, incident playbooks, go-live rehearsals, end-of-update audit. |

## 4. Governance & Communication
- **Steering Cadence**: Executive steering committee meets Mondays for risk review and gating decisions.
- **Delivery Cadence**: Cross-functional stand-ups daily, weekly integration demos, and backlog grooming on Wednesdays.
- **Documentation Vault**: Confluence + Git-backed docs; all runbooks and evidence stored in `/governance/release_vault` repository.
- **Change Control**: RFC process with architecture review board; rollback plans must be approved before merge to main.

## 5. Risk Register (Initial)
| Risk | Impact | Likelihood | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| Seed data mismatch across environments | High | Medium | Automated schema diff + seeded snapshot verification nightly. | Data Engineering Lead |
| Chatwoot integration delays | Medium | Medium | Secure sandbox credentials now, parallel integration spikes, fallback to email escalation. | Support Engineering Lead |
| Escrow/tax compliance gaps | High | Low | Engage finance/legal SMEs in schema review, add jurisdictional unit tests, maintain compliance checklist. | Compliance PM |
| Observability noise | Medium | Medium | Define SLOs early, pre-tune alert thresholds, implement on-call dry run. | SRE Lead |
| Mobile parity backlog | Medium | Medium | Feature flags with progressive rollout, weekly parity audit, dedicated mobile QA budget. | Mobile Lead |

## 6. Dependencies
- Payment processor agreements for escrow and wallet operations.
- Chatwoot API credentials and environment provisioning.
- Access to tax calculation services (e.g., Avalara, HMRC) and legal counsel review windows.
- Infrastructure budget approval for staging/prod clusters.
- Dedicated analytics warehouse resources for dashboard enablement.

## 7. Definition of Done
A milestone is considered complete when:
1. All scoped features are code-complete with automated tests (unit, integration, security, performance) passing in CI.
2. Documentation, runbooks, and training materials are reviewed and signed off by the governance board.
3. Observability dashboards and alerts are live with on-call coverage assigned.
4. Release readiness evidence (migrations, seeding, rollback drills) is recorded in the release vault.
5. Legal/compliance artefacts have been approved by counsel and uploaded to the production CMS.

## 8. Handoff & Post-Release
- Conduct go-live rehearsal including rollback drill and incident simulation.
- Capture lessons learned in a retrospective report with actions tracked in the operations backlog.
- Schedule 30-day and 90-day value realisation reviews to confirm adoption of new dashboards, feeds, and automation pipelines.
- Transition runbooks to support teams with sign-off from engineering, ops, and compliance leads.
