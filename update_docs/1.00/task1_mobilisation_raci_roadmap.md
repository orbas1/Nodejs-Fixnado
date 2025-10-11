# Task 1.1 Mobilisation Governance Pack — RACI, Roadmap & Dependency Matrix

## Overview
Task 1.1 requires a production-ready governance pack that aligns engineering, design, QA, compliance, and operations squads before feature delivery accelerates. This artefact consolidates:
- A master **RACI** linking every Version 1.00 pillar to accountable and responsible leads with explicit compliance checkpoints.
- A **roadmap** sequencing mobilisation, architecture, implementation, and launch preparation with week-by-week deliverables.
- A **dependency matrix** covering upstream integrations, downstream consumers, and regulatory gates so risks are tracked from the outset.

Inputs include the Version 1.00 update brief, feature update plan, pre-update issue intelligence, drawings (`dashboard_drawings.md`, `admin_panel_drawings.md`, `website_drawings.md`, `menu_drawings.md`, `app_screens_drawings.md`), and the consolidated design specifications across `Application_Design_Update_Plan` and `Web_Application_Design_Update`.

## 1. Master RACI Matrix
| Pillar / Activity | Accountable (A) | Responsible (R) | Consulted (C) | Informed (I) | Compliance Gate |
| --- | --- | --- | --- | --- | --- |
| Programme mobilisation & risk register | Programme Director | Engineering Programme Manager | Legal Counsel, Finance Ops | Squad Leads | Kick-off approvals + DPIA addendum submitted |
| Architecture baseline (system, data, infra) | Chief Architect | Backend Lead, DevOps Lead | Security Architect, Data Engineering Lead | Flutter/Web Tech Leads | Architecture review board sign-off |
| Geo-zonal services & explorer overlays | Geo-Zone Product Lead | Backend Lead, Frontend Lead | GIS SME, Design Ops Lead | QA Lead, Mobile Leads | GDPR geo-consent & territorial coverage audit |
| Booking engine, SLA timers & dispute flows | Booking Product Lead | Backend Lead, Mobile Leads | Finance Ops, Compliance Lead | Support Ops, Legal Counsel | SLA policy validation & dispute escalation SOP approval |
| Marketplace inventory, rentals & insured sellers | Marketplace Product Lead | Backend Lead, Provider App Lead | Compliance Lead, Finance Ops | Marketing, Support Ops | Insurance/DBS verification checklist |
| Communications suite (chat, Agora, notifications) | Communications Product Lead | Backend Lead, Frontend Lead, Mobile Leads | Security Architect, Legal Counsel | Support Ops, Marketing | Data retention & consent policy review |
| Monetisation & campaign manager | Monetisation Product Lead | Backend Lead, Frontend Lead | Finance Ops, Marketing Lead | Analytics Lead, Compliance Lead | FCA/HMRC reporting validation |
| Analytics, telemetry & dashboards | Data Engineering Lead | Analytics Engineering Lead, Frontend Lead | Design Ops Lead, QA Lead | Programme Director, Product Leads | Data governance council approval |
| QA automation & performance drills | QA Lead | QA Automation Engineers, DevOps Lead | Security Architect, Product Leads | All squads | Test plan approval & load rehearsal checklist |
| Flutter app parity & localisation | Mobile Programme Lead | Flutter Chapter Leads | Design Ops Lead, QA Lead | Support Ops, Product Leads | Accessibility & localisation audit completion |
| Design system governance & handoff | Design Ops Lead | Design Systems Engineer, UX Architect | Product Leads, Engineering Leads | QA Lead, Marketing | Accessibility sign-off & localisation copy review |
| Release governance & hypercare | Programme Director | Release Manager, Support Ops Lead | Compliance Lead, Security Architect | Finance Ops, Marketing | Go/No-Go approvals, support rota sign-off |

### Role Legend
- **Programme Director:** Executive owner accountable for delivery outcomes and governance adherence.
- **Engineering Programme Manager:** Coordinates squads, maintains dependency board, and drives weekly status cadences.
- **Product Leads:** Own scope definition and acceptance criteria per pillar, partnering with compliance on regulatory checkpoints.
- **Technical Leads:** Backend, Frontend, Mobile, DevOps, Analytics leads execute technical delivery, ensure Definition of Done compliance, and drive automation.
- **Design Ops Lead:** Ensures drawings, blueprints, and token libraries inform build, linking defect intake to design artefacts.
- **QA & Compliance Leads:** Govern readiness criteria, orchestrate testing, and maintain audit trails.
- **Legal/Finance/Support Ops:** Provide regulatory oversight, budget alignment, and hypercare readiness.

## 2. Mobilisation Roadmap (Weeks 0–14)
| Week Range | Objectives | Key Deliverables | Primary Owners | Compliance & Evidence |
| --- | --- | --- | --- | --- |
| Weeks 0–1 (Phase 0 Mobilisation) | Establish governance, staffing, and baseline artefacts. | Signed RACI (this document), dependency register, programme risk log, DPIA refresh, RBAC review minutes. | Programme Director, Engineering PM, Compliance Lead | DPIA filed, risk register in tracker, Confluence links added to `update_progress_tracker.md`. |
| Weeks 1–2 (Phase 1 Foundations) | Finalise architecture, infra parity, and CI/CD guardrails. | PostGIS provisioning, secrets vault updates, CI pipelines with security scans, rollback runbooks. | Backend Lead, DevOps Lead, QA Lead | Terraform change approvals, CI evidence stored in `build_updates.md`. |
| Weeks 2–6 (Phase 2 Core Services) | Deliver geo-zonal CRUD, booking engine, finance layer, analytics jobs. | Zone/booking services, finance calculators, SLA timers, Vitest suites, explorer overlay contracts. | Backend Lead, Frontend Lead, Geo-Zone & Booking Product Leads | Postman/Newman contract approvals, analytics QA reports. |
| Weeks 4–8 (Phase 3 Marketplace & Monetisation) | Stand up inventory ledger, rentals, campaign manager, fraud controls. | Inventory ledger service, rental workflows, insured seller enforcement, campaign pacing engine. | Marketplace Product Lead, Backend Lead, Finance Ops | Insurance/DBS approval logs, financial reconciliation sign-off. |
| Weeks 6–10 (Phase 4 Experience & Collaboration) | Align React + Flutter UX, communications stack, business fronts. | Explorer overlays, booking wizard UI, provider dashboards, chat + Agora integration, notification centre. | Frontend Lead, Mobile Lead, Communications Product Lead | Accessibility/localisation audits recorded in `design_validation_and_handoff.md`. |
| Weeks 8–12 (Phase 5 Analytics & Governance) | Operationalise dashboards, alerting, data governance, compliance walkthroughs. | Persona dashboards, Looker ingestion scripts, alerting pipelines, metric catalogue. | Data Engineering Lead, Analytics Lead, Compliance Lead | Data governance council minutes, alert rehearsal reports, GDPR evidence packs. |
| Weeks 11–14 (Phase 6 Launch & Hypercare) | Execute integrated testing, go-live rehearsals, support enablement. | Performance drill reports, pen-test outcomes, hypercare rota, release notes, end-of-update report. | QA Lead, Release Manager, Support Ops Lead | Go/No-Go sign-off recorded, hypercare SOP stored in `end_of_update_report.md`. |

## 3. Dependency & Compliance Matrix
| Squad / Workstream | Upstream Dependencies | Downstream Consumers | Compliance Checkpoint & Owner | Risk Mitigation |
| --- | --- | --- | --- | --- |
| Geo-Zone Service & Explorer | PostGIS cluster, GIS libraries (`@turf/turf`), map SDK licensing. | React explorer overlays, provider dashboards, analytics heatmaps. | GDPR consent capture (Compliance Lead). | Staging geo-consent rehearsal, fallback polygon snapping documented. |
| Booking & Custom Jobs | Payment gateway sandbox, SLA policy definitions, notification broker. | Provider & user apps, finance reconciliation, dispute dashboard. | SLA legal review (Legal Counsel). | Load-tested queues, dispute SOP review every sprint. |
| Marketplace & Inventory | Document verification API, finance ledger, storage for rental documents. | Provider portal inventory, rental logistics, analytics alerts. | Insurance/DBS verification (Compliance Lead). | Double-entry ledger tests, nightly reconciliation jobs. |
| Communications Suite | Agora credentials, AI moderation provider, push notification service. | Web chat, mobile chat, notification centre, dispute workflows. | Data retention policy (Legal Counsel). | Multi-region failover runbook, content moderation escalation board. |
| Monetisation & Ads | FX/tax feeds, billing platform APIs, marketing creative approvals. | Campaign manager UI, analytics dashboards, finance reporting. | HMRC/FCA compliance (Finance Ops Lead). | Spend anomaly detection thresholds, legal review of creatives. |
| Analytics & Reporting | Event schema updates, ETL/ELT pipelines, telemetry snapshots. | Admin/provider dashboards, Looker, compliance exports. | Data governance review (Data Protection Officer). | Schema versioning, snapshot diagnostics rehearsals. |
| Mobile Parity & Localisation | Flutter SDK updates, localisation strings (ARB), Agora mobile SDK. | User, Provider, Servicemen, Enterprise apps. | Accessibility & localisation QA (Mobile QA Lead). | Device farm regression plan, locale fallback testing. |
| Design System & UX Governance | Token library (`fx-tokens.v1.00.json`), drawings across `Application_Design_Update_Plan` & `Web_Application_Design_Update`. | React & Flutter components, documentation, marketing assets. | Accessibility audit (Design Ops Lead). | Stark/VoiceOver audits, Chromatic baseline backlog. |
| QA & Compliance | CI pipelines, test data seeding, chaos tooling. | All squads depend on pass/fail signals, release management. | Test plan approval (QA Lead & Compliance Lead). | Daily triage, severity SLA tracker automation, rollback rehearsals. |
| Release & Hypercare | Monitoring dashboards, on-call rota, support tooling. | Customer support, operations, leadership reporting. | Go/No-Go board (Programme Director). | Hypercare playbook, escalation templates, analytics KPI watchlist. |

## 4. Governance Cadence & Tooling Alignment
- **Weekly Programme Control Board (Monday 09:00 GMT):** Review roadmap adherence, dependency status, and compliance gates; outputs stored in tracker commentary.
- **Bi-weekly Steering Committee (Wednesday Week 1 & 3):** Escalate cross-pillar risks, approve scope adjustments, confirm regulatory artefact progress.
- **Daily Squad Stand-ups & Twice-weekly Cross-Squad Syncs:** Ensure geo/booking/marketplace/communications squads stay aligned on contract changes and shared UI elements.
- **Defect & Risk Integration:** `scripts/issue-intake.mjs` is now linked to this RACI; defects inherit accountable/responsible parties automatically via the metadata schema.
- **Documentation Indexing:** All artefacts referenced above are linked through `update_index.md` to support audit trails and onboarding.

## 5. Next Actions
1. Integrate this governance pack into the CI documentation check so pull requests touching critical artefacts verify an up-to-date RACI reference.
2. Append dependency risk scoring to the tracker (impact, probability) aligning with the risk register for Milestone M1 exit.
3. Publish Confluence overview summarising mobilisation outcomes for leadership and include hyperlinks to drawings and code modules for traceability.
