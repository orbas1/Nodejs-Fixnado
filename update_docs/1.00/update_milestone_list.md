# Update Milestone List — Version 1.00

## Development & QA Milestone Roadmap

### Milestone M1 — Mobilise & Governance Baseline
- **Target Window:** Weeks 0–2
- **Objective:** Stand up delivery governance, compliance guardrails, and defect intake before engineering ramps.
- **Tasks:**
  - **Task 1A — Programme Mobilisation (100% complete)**
    1. Draft master RACI, roadmap, and dependency matrix across squads.
    2. Configure shared infrastructure upgrades (PostGIS, secrets vault, feature toggles).
    3. Extend CI/CD with linting, security scans, contract test gates, and rollback playbooks.
    4. Automate issue intake pipeline linking issue docs to tracker with severity SLAs.
    5. Refresh DPIA, RBAC audit notes, and baseline security posture documentation.
    - *2025-10-11 update:* Issue intake automation landed — `scripts/issue-intake.mjs` now enforces SLA policies, regenerates tracker artefacts, and seeds critical/high issues with remediation checklists, ready for webhook/Slack integration.
    - *2025-10-12 update:* Mobilisation governance pack published (`task1_mobilisation_raci_roadmap.md`) linking RACI ownership, phased roadmap, and dependency/compliance matrix with design drawings and telemetry artefacts; dependency risk scoring and webhook automation now track toward Milestone M1 exit.
    - *2025-10-13 update:* Shared infrastructure upgrades provisioned PostGIS/PostgreSQL, Secrets Manager toggle manifests, admin APIs, and parity checks; Subtask 1.2 marked complete with Terraform/Sequelize updates and Vitest coverage.
    - *2025-10-14 update:* CI/CD Subtask 1.3 finished — Build/Test/Scan workflow enforces multi-surface lint/tests with security scanning, Release Packaging workflow generates rollback artefacts + manifest, and rollback playbook published for ops rehearsals.
    - *2025-10-15 update:* Compliance evidence closed — refreshed DPIA, RBAC minutes, and security baseline stored under `docs/compliance/` with action trackers feeding `update_progress_tracker.md`. Secrets Manager TTL governance, hashed-IP telemetry controls, and JIT RBAC workflows now documented for regulator readiness, completing Task 1A and unlocking Milestone M1 exit.
  - **Task 1B — Core Service Blueprint Kick-off (8% complete)**
    1. Finalise geo-zonal architecture diagrams and ERDs for bookings, rentals, and campaigns.
    2. Define API contracts (OpenAPI/AsyncAPI) for zone, booking, inventory, and communication services.
    3. Build backlog grooming sessions to slice epics into sprintable stories with acceptance criteria.
    4. Align design system artefacts with engineering scopes for explorer, booking, and panels.

  - *2025-10-15 milestone note:* M1 exit approved — compliance evidence pack filed, RACI/dependency matrices linked, and rollout governance artefacts archived in repository. Subsequent reviews focus on Task 1B deliverables for architecture packs.

### Milestone M2 — Core Services Alpha
- **Target Window:** Weeks 2–6
- **Objective:** Deliver functional alpha of geo-zonal, booking, and bidding services with regression coverage.
- **Tasks:**
  - **Task 2A — Geo-Zonal & Booking Implementation (100% complete)**
    1. Implement zone CRUD, polygon validation, and analytics snapshot jobs with automated tests.
    2. Extend booking orchestrator for on-demand/scheduled flows and multi-serviceman assignments.
    3. Ship custom job + bidding workflow with dispute hooks and audit logging.
    4. Integrate commission, tax, and multi-currency calculations within booking lifecycle.
    5. Execute regression suite validating geo-matching accuracy and booking SLA timers.
    *2025-02-10 update:* Zone + booking services, finance engine, analytics job, and Vitest suites landed; explorer/booking drawings referenced to align payloads with admin/provider experience.
  - **Task 2B — Early QA & Observability (45% complete)**
    1. Instrument telemetry for zone/booking events with structured logging and tracing.
    2. Stand up Postman/Newman API suites for zone and booking endpoints.
    3. Configure chaos drills targeting booking orchestrator failure scenarios.
    4. Document operational runbooks for geo services, disputes, and commission adjustments.
    *2025-02-10 update:* Zone analytics snapshot job and Vitest suites provide baseline observability + regression data; remaining work focuses on cross-service tracing and chaos rehearsals.*

### Milestone M3 — Marketplace & Monetisation Foundations
- **Target Window:** Weeks 4–8
- **Objective:** Launch marketplace, rentals, and monetisation backbones with compliance enforcement.
- **Tasks:**
  - **Task 3A — Inventory & Rental Enablement (96% complete)**
    1. Develop inventory ledger with transaction history, alerts, and reconciliation tooling.
    2. Implement rental lifecycle (request→return) with document capture and inspection evidence.
    3. Enforce insured seller eligibility and compliance document checks at publish time.
    4. QA rental flows via integration suites across backend, React, and Flutter clients.
    *2025-10-17 update:* `/api/inventory` and `/api/rentals` now operate together to deliver reservation locking, approvals, checkout, partial returns, inspections, settlement, and cancellation. Migration `20250217000000-create-inventory-and-rentals.js` provisions inventory/rental tables with deposit, insurance, and inspection metadata while Vitest suites (`tests/rentalRoutes.test.js`, `tests/inventoryRoutes.test.js`) exercise governance, dispute, and alert flows. Design artefacts (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Dashboard Designs.md`) and trackers refreshed so provider/admin consoles can surface rental agreements, inspection queues, and reconciliation tasks without ambiguity. Remaining scope focuses on insured seller eligibility, marketplace moderation, and cross-channel QA for rental UX parity.
    *2025-10-18 update:* Insured seller enforcement is now live: compliance submissions, approvals, badge toggles, and suspensions persist through new models/migration (`ComplianceDocument`, `InsuredSellerApplication`, `MarketplaceModerationAction`, migration `20250218000000-compliance-and-marketplace-moderation.js`) with `/api/compliance` + `/api/marketplace` services and moderation queue filtering listings to approved, in-date sellers. Feed integration blocks expired/suspended sellers, Vitest suite `tests/complianceMarketplace.test.js` validates review + moderation workflows, and design specs (`Screens_Update.md`, `Dashboard Designs.md`, drawings) document badge manager + moderation UI for provider/admin consoles.
    *2025-10-19 update:* Campaign manager services complete the monetisation backbone for Milestone M3. Migration `20250219000000-create-campaign-manager.js`, models (`AdCampaign`, `CampaignFlight`, `CampaignTargetingRule`, `CampaignInvoice`, `CampaignDailyMetric`), and `/api/campaigns` endpoints enable targeting configuration, pacing telemetry, overspend protection, and invoice generation with Vitest coverage (`tests/campaignRoutes.test.js`). Config adds governed overspend thresholds and targeting caps, while programme artefacts (`Screens_Update.md`, `Screens_Update_Logic_Flow.md`, `Dashboard Designs.md`) now map targeting chips, pacing statuses, and billing drawers so frontend teams can build campaign manager UI and finance can rehearse reconciliation workflows. Remaining milestone scope shifts to Task 3B fraud/analytics instrumentation and warehouse integration.
  - **Task 3B — Monetisation & Fraud Controls (9% complete)**
    1. Build Fixnado/Finova campaign manager services (targeting, budgeting, pacing, billing).
    2. Integrate monetisation telemetry into analytics warehouse with governance tagging.
    3. Configure spend caps, fraud heuristics, and anomaly alerts tied to ads events.
    4. Produce finance + compliance reconciliation procedures for campaigns and rentals.

### Milestone M4 — Experience & Collaboration Beta
- **Target Window:** Weeks 6–10
- **Objective:** Deliver cross-channel UX, communications, and panel experiences ready for integrated testing.
- **Tasks:**
  - **Task 4A — Web & Flutter Experience Delivery (48% complete)**
    1. Build React explorer, booking wizard, and marketplace modules consuming new APIs.
    2. Achieve Flutter parity across user, servicemen, provider, and enterprise apps for explorer, booking, and rentals.
    3. Implement business fronts, provider dashboards, and enterprise panels with RBAC guards.
    4. Conduct accessibility, localisation, and performance audits feeding issue tracker entries.
    *2025-10-21 update:* React explorer now ships with production MapLibre overlays, demand-aware filters, and zone analytics surfacing SLA breaches and inventory matches. Supporting API client/utilities normalise geometry for SQLite/PostGIS parity, while vitest coverage protects filtering logic. Next iteration focuses on booking wizard integration, Flutter parity, and comms modules.
    *2025-10-21 follow-up:* Flutter booking and rental controllers gained parity-focused Riverpod tests validating cached refresh, offline banners, creation, scheduling, and inspection flows against `App_screens_drawings.md`, `dashboard_drawings.md`, and `Screens_Update_Logic_Flow.md`. Rental creation time selection now mirrors inspection scheduling copy, and trackers/changelogs evidence Task 4.2 maturity while chat + enterprise dashboard work remains in flight for Milestone M4.
  - **Task 4B — Communications Stack Integration (12% complete)**
    1. Integrate chat with AI assist toggles, moderation hooks, and consent prompts.
    2. Orchestrate Agora video/phone sessions with PSTN fallback and recording retention.
    3. Centralise notification routing (push/email/SMS) with quiet hours and preference management.
    4. Execute end-to-end tests covering chat, video, dispute threads, and notification fan-out.

### Milestone M5 — Analytics, Governance & Compliance Hardening
- **Target Window:** Weeks 8–12
- **Objective:** Complete data products, governance artefacts, and compliance validation.
- **Tasks:**
  - **Task 5A — Analytics & Alerting Delivery (8% complete)**
    1. Finalise unified event schema across zones, bookings, rentals, disputes, ads, and comms.
    2. Update ETL/ELT pipelines with GDPR-compliant retention and anonymisation.
    3. Build persona dashboards and exports for admin, provider, servicemen, and enterprise personas.
    4. Configure alerting for data freshness, SLA breaches, dispute spikes, and ad overspend.
    5. Publish metric catalogue, data dictionary, and access policies for governance sign-off.
  - **Task 5B — Compliance Validation Sprint (7% complete)**
    1. Execute GDPR, insurance/DBS, HMRC, and advertising compliance walkthroughs.
    2. Validate audit logs, retention schedules, and consent records across services.
    3. Update DPIA artefacts, legal approvals, and regulator evidence packs.
    4. Capture remediation actions into tracker with owners and due dates.

### Milestone M6 — Launch Readiness & Hypercare Entry
- **Target Window:** Weeks 11–14
- **Objective:** Exit with production-ready quality, documentation, training, and support coverage.
- **Tasks:**
  - **Task 6A — Integrated QA & Performance Certification (5% complete)**
    1. Finalise master test plan covering functional, integration, performance, security, and localisation scopes.
    2. Expand automation suites (API, UI, Flutter, chaos) aligned to Definition of Done gates.
    3. Run performance, load, and resilience drills across booking, chat, payments, analytics, and ads workloads.
    4. Track defect burndown and ensure severity-one issues resolved before freeze.

    *2025-02-08 update:* Master test plan expanded with feature toggle governance coverage, RBAC audit checkpoints, and Vitest/Playwright/Flutter automation commitments to feed CI readiness metrics ahead of performance drill scheduling.
    *2025-02-09 update:* Backend Vitest suites validate escrow rollback and contract schema parity, React telemetry automation executes in CI, and Flutter widget coverage confirms live feed banners; chaos injection verifies graceful degradation, elevating Task 6A automation readiness to focus on load/performance drill design.
  - **Task 6B — Launch Operations & Hypercare (6% complete)**
    1. Publish release notes, training curriculum, support playbooks, and hypercare rota.
    2. Conduct go-live rehearsals with rollback drills and communication templates.
    3. Activate monitoring dashboards, alert channels, and on-call rotations for hypercare.
    4. Compile end-of-update report and feed lessons learned into post-launch backlog.

---
The historic UI/UX Design Milestones documented below remain for context and traceability.


## Core Programme Milestones
- Refer to product, backend, infrastructure, and testing documents for non-design milestones.

## UI/UX Design Addendum
| Milestone | Description | Target Window | Dependencies |
| --- | --- | --- | --- |
| **DM1 — Design System Foundations Locked** | Token library, typography, spacing, and iconography guidelines consolidated across app and web artefacts. | Week 2 | Completion of foundation audit and accessibility review scheduling. |
| **DM2 — Experience Blueprints Signed Off** | Home, dashboard, provider workflows, and marketing layouts updated with new IA, grid, and compliance cues. | Week 4 | DM1, stakeholder walkthroughs, data requirements. |
| **DM3 — Theme & Personalisation Toolkit Ready** | Theme management interface, emo previews, and marketing modules finalised post usability testing. | Week 5 | DM1, asset pipeline readiness, marketing inputs. |
| **DM4 — Validation & Compliance Gate Passed** | Accessibility, security, and QA sign-offs complete; handoff packages distributed to engineering. | Week 6 *(✅ Completed 2025-02-01 — validation playbook issued with checklists, aria-live implementation, telemetry schema, and QA cadence locked. Telemetry ingestion + summary endpoints landed 2025-02-02 to unblock analytics dashboards.)* | DM1–DM3, legal/compliance approvals, QA readiness. |

### Notes
- These milestones supplement existing roadmap checkpoints and should be tracked jointly in programme status meetings.
- Progress updates captured in `Design_update_progress_tracker.md` and summarised during sprint demos.
- 2025-01-31: DM3 (Theme & Personalisation Toolkit) completed with Theme Studio launch, telemetry instrumentation, and validation sprint bookings. See `theme_personalisation_toolkit.md` for handoff details.

