# Data Protection Impact Assessment — Fixnado Version 1.00

## 1. Assessment Summary
- **Assessment window:** 2025-10-10 → 2025-10-15.
- **Scope:** New geo-zonal intelligence, booking orchestration, rentals marketplace, communications stack (chat + Agora), telemetry dashboards, and monetisation services introduced in Version 1.00 across web (React), backend Node.js services, and Flutter applications.
- **Trigger:** Expansion of personal data processing (location polygons, communications transcripts, payment preferences, telemetry adoption metrics) and introduction of new processors (Agora, AI moderation, currency/tax feeds).
- **Artefact links:**
  - Drawings & blueprints: `update_docs/1.00/ui-ux_updates/Design_Task_Plan_Upgrade/Application_Design_Update_Plan/Screens_Update.md`, `update_docs/1.00/ui-ux_updates/Design_Task_Plan_Upgrade/Application_Design_Update_Plan/Screens_Update_Logic_Flow.md`, `update_docs/1.00/ui-ux_updates/Design_Task_Plan_Upgrade/Web_Application_Design_Update/Dashboard Designs.md`, and `update_docs/1.00/ui-ux_updates/Design_Task_Plan_Upgrade/Web_Application_Design_Update/Menus.md`.
  - Architecture & governance: `update_docs/1.00/task1_mobilisation_raci_roadmap.md`, `update_docs/1.00/features_update_plan.md`.
  - Engineering implementation: `backend-nodejs/src/controllers`, `services`, `models`, `jobs`; `frontend-reactjs/src/pages/AdminDashboard.jsx`, `TelemetryDashboard.jsx`; Flutter widgets under `flutter-phoneapp/lib`.

## 2. Stakeholders & Roles
| Role | Name | Responsibilities |
| --- | --- | --- |
| Data Protection Officer | Amelia Shaw | Owns DPIA, regulator liaison, approves residual risk. |
| Engineering Programme Manager | Victor Ross | Ensures mitigations are built into delivery plans and tracked in `update_progress_tracker.md`. |
| Security Architect | Maya Chen | Validates RBAC hardening, secrets rotation, and baseline controls (`docs/compliance/security_baseline.md`). |
| Compliance Analyst | Jordan Blake | Maintains audit evidence (RBAC minutes, consent logs) and coordinates legal sign-off. |
| Product & Design | Priya Kapoor (Design Ops), Alan Miles (Product) | Align copy, consent patterns, and UI disclosures with this DPIA and design drawings. |
| Vendor Managers | Sofia Idris (Agora), Daniel Webb (AI moderation) | Maintain processor contracts, ensure DPA/SCC coverage, escalate incidents. |

## 3. Processing Activities & Data Inventory
| Processing Activity | Systems | Data Subjects | Data Categories | Lawful Basis | Storage/Retention |
| --- | --- | --- | --- | --- | --- |
| Zone curation & demand analytics | `backend-nodejs/src/services/zoneService.js`, PostGIS schemas | Providers, servicemen | Business address, service coverage polygons, demand KPIs | Legitimate Interest (service delivery optimisation) | PostGIS (UK West) — 24 months rolling, anonymised aggregates retained for forecasting |
| Booking orchestration & SLA management | `backend-nodejs/src/services/bookingService.js`, `bookingController.js`, React booking wizard, Flutter booking flows | Consumers, providers, servicemen | Names, contact info, job details, SLA timestamps, dispute flags | Contract performance | PostgreSQL (UK West) — 6 years for contractual records, disputes archived in cold storage after closure |
| Rentals & inventory ledger | `backend-nodejs/src/services/inventoryService.js` (planned), admin/provider dashboards | Providers, enterprise renters | Asset metadata, rental agreements, deposit references, compliance documents (insurance, DBS) | Contract performance + Legal Obligation | PostgreSQL + encrypted object store — 7 years for compliance evidence |
| Communications (chat, AI assist, Agora) | Chat microservice (planned), `frontend-reactjs/src/components/chat`, Agora session tokens, moderation webhooks | Consumers, providers, servicemen, support agents | Chat transcripts, media attachments, AI moderation verdicts, session metadata | Legitimate Interest + Consent (for recordings) | Encrypted storage (90 days standard, disputes 2 years), moderated samples pseudonymised after 30 days |
| Telemetry & experimentation analytics | `backend-nodejs/src/controllers/telemetryController.js`, `services/telemetryService.js`, React telemetry dashboard | Web/admin users (role-based) | Theme choice, density preference, marketing variant, hashed IP, tenant ID, device metadata | Legitimate Interest (product improvement) with opt-out control | PostgreSQL telemetry schema — 12 months, hashed IP rotated quarterly |
| Monetisation & ads | Campaign service (planned), admin dashboards | Providers, marketing admins | Campaign budgets, targeting rules, billing account references, spend analytics | Legitimate Interest + Contract | PostgreSQL — 7 years for financial compliance |
| Issue intake automation | `scripts/issue-intake.mjs`, `pre-update_evaluations/issue_*` docs | Internal stakeholders | Reporter name, squad, issue metadata, SLA countdowns | Legitimate Interest (quality management) | Git repository (versioned) — lifetime of programme |

## 4. Data Flow & Control Highlights
1. **Ingestion Controls**
   - Telemetry ingestion scrubs IP addresses at controller layer (`backend-nodejs/src/controllers/telemetryController.js`) using SHA-256 before persistence.
   - Booking and rental uploads enforce MIME/type allow-listing; raw documents stored in encrypted S3 bucket with per-object KMS keys (Terraform `infrastructure/terraform/runtime-config`).
   - Feature toggle manifests in AWS Secrets Manager restrict rollout metadata to RBAC-guarded admin roles; secrets never stored in repo.

2. **Storage & Segregation**
   - PostGIS dedicated schema ensures geo data separated from customer PII, with row-level policies restricting cross-tenant reads.
   - Telemetry tables segregate tenant and hashed IP; analytics snapshots stored in `UiPreferenceTelemetrySnapshot` with derived statistics only.
   - Communications transcripts retained in dedicated cluster with encryption-at-rest and TLS 1.2+, transcripts flagged for dispute hold via metadata.

3. **Access & RBAC**
   - RBAC policies reviewed 2025-10-14 (see `rbac_review_minutes.md`). Admin and compliance roles separated; support users receive time-bound just-in-time (JIT) access through secrets rotation playbook.
   - React admin panels display compliance badges and policy disclaimers (`frontend-reactjs/src/pages/AdminDashboard.jsx`, `Dashboard` drawings) ensuring staff acknowledge purpose before viewing sensitive queues.

4. **Data Minimisation & Transparency**
   - Booking UI trimmed optional fields to align with necessary processing; copy updates recorded in `ui-ux_updates/web_application_design_update/text.md.md` emphasise legal basis and consent prompts.
   - Telemetry dashboard surfaces anonymisation notice referencing hashed IP methodology and opt-out link for marketing variants.

5. **Processor Management**
   - Agora, AI moderation, and payment processors covered by DPAs stored in vendor management portal; retention schedules mirrored locally.
   - Nightly reconciliation jobs (see `backend-nodejs/src/jobs/zoneAnalyticsJob.js`, planned inventory jobs) produce hashed IDs for analytics export.

## 5. Risk Assessment
| Risk ID | Description | Impact | Likelihood | Inherent Risk | Mitigations | Residual Risk |
| --- | --- | --- | --- | --- | --- | --- |
| DPIA-01 | Misuse of geo polygons reveals precise provider locations | High | Medium | High | PostGIS row-level access controls; admin UI redacts exact coordinates for non-compliance roles; audit logs on `/api/zones` access. | Medium |
| DPIA-02 | Booking transcripts or chat attachments contain sensitive personal data | High | Medium | High | Chat attachments virus-scanned; transcripts flagged with retention timer; dispute mode extends retention with notification; AI moderation w/ manual escalation; secure storage region-limited. | Medium |
| DPIA-03 | Telemetry dataset re-identification via hashed IP + tenant ID | Medium | Low | Medium | SHA-256 hashing with daily salt rotation stored in AWS Secrets Manager, aggregated dashboards show only counts; opt-out toggle in Admin UI; hashed IP dropped after 30 days. | Low |
| DPIA-04 | Unauthorised admin toggles exposing beta features to consumers | Medium | Medium | Medium | RBAC separation, approval workflow recorded in `rbac_review_minutes.md`; Secrets Manager audit logs integrated into telemetry alerts; release packaging manifest includes toggle state snapshot. | Low |
| DPIA-05 | Rentals documents retained longer than necessary | Medium | Medium | Medium | Document retention policy codified in `security_baseline.md`; scheduled Lambda purges archives >7 years; admin UI displays expiry and manual override reason. | Low |
| DPIA-06 | Agora session recordings stored outside EU/UK | High | Low | Medium | DPA with EU storage clause, encryption at rest, retention 30 days, deletion webhook validated; fallback PSTN provider configured with UK nodes. | Low |
| DPIA-07 | AI moderation false positives affecting dispute resolution fairness | Medium | Medium | Medium | Moderation decisions logged with human review queue; business process in `rbac_review_minutes.md` ensures compliance team sign-off before enforcement; sample reviews weekly. | Low |

## 6. Action Plan & Tracking
| Action | Owner | Due Date | Tracking Reference |
| --- | --- | --- | --- |
| Integrate Secrets Manager salt rotation Lambda with quarterly audit evidence | Security Architect | 2025-11-01 | `update_progress_tracker.md` — Task 1 next review cycle |
| Implement automated purge workflow for expired rental documents | Engineering Programme Manager | 2025-12-15 | `backend_updates/jobs_changes.md` (to be added) |
| Deliver chat retention and consent copy updates across web & Flutter apps | Design Ops Lead | 2025-10-20 | `Design_update_task_list.md` Task 11 |
| Run DPIA walk-through with Legal & Marketing including recordings consent | Compliance Analyst | 2025-10-22 | `Design_Change_log.md` compliance entry |
| Add telemetry opt-out instructions to support knowledge base | Support Lead | 2025-10-25 | `docs/operations/knowledge-base` (planned) |

## 7. Residual Risk Acceptance
- **Assessment outcome:** Residual risks remain Low/Medium after mitigations and are acceptable for launch with monitoring commitments.
- **Conditions:** Completion of action items above; quarterly DPIA review scheduled for Week 1 of each quarter or upon major scope change.
- **Approvals:**
  - Amelia Shaw (DPO) — *Approved 2025-10-15*
  - Maya Chen (Security Architect) — *Approved 2025-10-15*
  - Victor Ross (Engineering Programme Manager) — *Approved 2025-10-15*

## 8. Change Log
| Date | Change | Author |
| --- | --- | --- |
| 2025-10-15 | Initial refresh covering Version 1.00 features, referencing new telemetry anonymisation, RBAC review, and rental document policy. | Jordan Blake |
| 2025-10-15 | Added action tracker referencing Secrets Manager salt rotation and support opt-out documentation. | Jordan Blake |
