# Update Plan — Version 1.00

## Development & QA Master Scope
- **Source review**: Consolidated requirements from `new_feature_brief.md`, `features_update_plan.md`, `features_to_add.md`, and supporting engineering artefacts. Issue intelligence drew on `pre-update_evaluations/issue_report.md`, `issue_list.md`, and `fix_suggestions.md` (currently empty, triggering Task 1.4 below to formalise capture).
- **Programme objective**: Deliver a geo-aware, compliance-first marketplace release that unifies backend services, React web, and four Flutter apps while remediating outstanding defects and strengthening production readiness.
- **Delivery stance**: Operate as development + QA co-owners – each feature stream pairs build execution with explicit quality controls, regression gates, and documentation sign-off.

### Feature Evaluation Summary
| Feature Pillar | Key Build Requirements | Quality & Compliance Focus |
| --- | --- | --- |
| Geo-Zonal Intelligence | PostGIS-backed zone services, polygon tooling, analytics snapshots, explorer overlays. | Coordinate geo-validation automation, run UK territory acceptance tests, confirm GDPR-compliant location consent. |
| Booking & Custom Job Lifecycle | On-demand vs scheduled orchestration, multi-serviceman assignments, bidding/dispute workflows, commission engines. | SLA timers, concurrency handling, dispute audit trails, financial reconciliation accuracy. |
| Marketplace, Rentals & Inventory | Inventory ledger, rental contracts, insured seller gating, upsell hooks. | Ledger double-entry, rental inspection evidence, insurance validation, fraud monitoring. |
| Communications & Collaboration | AI-assisted chat, Agora video/voice, notification routing, consent prompts. | Content moderation, AI safety controls, call recording retention, quiet hours enforcement. |
| Governance, Compliance & Security | Document verification pipelines, RBAC expansion, audit logging, commission governance. | DPIA updates, RBAC penetration testing, document retention policies, anomaly detection tuning. |
| Monetisation & Ads | Fixnado + Finova campaign manager, targeting, budgeting, billing reconciliation. | Spend pacing accuracy, fraud prevention, reporting transparency, consented messaging. |
| Analytics & Reporting | Event schemas, dashboards, alerts, export tooling, metric catalogue. | Data freshness SLAs, privacy-safe aggregation, access controls, data dictionary governance. |
| Internationalisation & Financial Controls | Multi-language/currency/tax UX, payment localisation, FX feeds. | Rounding validation, localisation QA, HMRC reporting readiness, fallback currency behaviour. |

### Issue & Fix Review Summary
- Current `issue_report.md`, `issue_list.md`, and `fix_suggestions.md` files are placeholders with no logged entries.
- **Action**: Task 1.4 establishes the formal defect triage loop, linking QA findings, regression tests, and stakeholder submissions into a unified backlog (JIRA/Linear).
- **Preventive focus**: Even without recorded defects, we will execute regression sweeps across booking, payments, chat, and analytics to seed the backlog ahead of Feature Freeze.

## Integrated Development & QA Blueprint
1. **Mobilise & Baseline (Weeks 0-2)**
   - Stand up architecture, compliance, and risk governance.
   - Finalise issue intake workflow and align on traceability between requirements, code, and tests.
   - Prepare sandbox environments and CI/CD enhancements for backend, React, Flutter, and infrastructure assets.
2. **Core Services Implementation (Weeks 2-6)**
   - Deliver geo-zonal, booking, marketplace, and compliance services with contract-first APIs.
   - Build shared libraries for multi-currency calculations, notification routing, and dispute management.
   - Maintain incremental QA through contract, integration, and load testing per module.
3. **Experience & Collaboration Enablement (Weeks 4-9)**
   - Ship web + Flutter UI, communications stack, and business front tooling behind feature toggles.
   - Integrate AI chat safeguards, Agora orchestration, and UX localisation patterns.
4. **Monetisation, Analytics & Reporting (Weeks 6-10)**
   - Launch campaign manager, analytics dashboards, and data governance tooling.
   - Wire telemetry into observability stack, verifying data freshness and alerting cadences.
5. **Integrated Testing & Launch Readiness (Weeks 9-14)**
   - Execute cross-app end-to-end suites, performance, security, and compliance audits.
   - Drive defect remediation, documentation sign-off, training, and go-live rehearsals culminating in hypercare.

### Governance & Alignment Enhancements
- Weekly programme control board merges build, QA, and compliance updates with milestone burn-down.
- Traceability matrix links features to tests, defects, and deployment checklists.
- All squads adopt Definition of Done: code review, automated test coverage, localisation & accessibility validation, documentation update, security scan pass.

## Existing Workstreams
- Refer to baseline product, backend, database, and infrastructure plans for non-UI/UX deliverables.
- All previously approved objectives remain in effect; this document adds UI/UX-focused planning context without superseding earlier artefacts.

## Addendum: UI/UX Design Update Overview
1. **Purpose:** Align application, provider, and web experiences through a unified design system that supports theme flexibility (including emo-style variants) and improved usability.
2. **Scope:** Includes design system foundations, page recomposition, component catalogue updates, theme enablement, and validation/QA alignment across Application and Web design artefacts.
3. **Outcomes:** Deliver consistent visuals, accessible interactions, compliance-ready content, and clear handoff packages for engineering execution.

## Execution Roadmap
- **Phase 1 — Foundations (Weeks 1-2):** Complete token consolidation, typography scale updates, and layout grid definitions.
- **Phase 2 — Experience Blueprints (Weeks 3-4):** Recompose home, dashboard, provider, and marketing pages; integrate security/compliance checkpoints.
- **Phase 3 — Theme Enablement (Week 5):** Release theme management tooling with emo preview support and marketing module variants.
- **Phase 4 — Validation & Handoff (Week 6):** Conduct accessibility, compliance, and QA reviews; deliver implementation packages and regression checklists.

## Coordination & Governance
- Weekly design council sync to manage dependencies and escalate risks.
- Shared documentation index linking to detailed artefacts (`Design_Change_log.md`, `Design_Plan.md`, `Design_update_task_list.md`, `Design_update_milestone_list.md`, `Design_update_progress_tracker.md`).
- Cross-functional checkpoints aligned with engineering sprint demos and product milestones.

## Risk Management Summary
- **Theme Conflicts:** Mitigated via linting and staged rollout of new tokens.
- **Accessibility Regression:** Addressed with dedicated low-vision testing and compliance reviews.
- **QA Coverage:** Managed by integrating design tokens with automated visual regression tooling and manual checklists.

