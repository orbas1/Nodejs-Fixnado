# RBAC Review Minutes — Version 1.00 Mobilisation

- **Session Date:** 2025-10-14
- **Chair:** Maya Chen (Security Architect)
- **Recorder:** Jordan Blake (Compliance Analyst)
- **Participants:**
  - Victor Ross (Engineering Programme Manager)
  - Priya Kapoor (Design Ops Lead)
  - Luis Ortega (Backend Tech Lead)
  - Hannah Reid (Frontend Tech Lead)
  - Alina Novak (Support Operations Manager)
  - Malik Fraser (Data Engineering Lead)

## 1. Agenda
1. Confirm role definitions required for geo-zonal, booking, marketplace, communications, and analytics rollouts.
2. Review access assignments against updated `task1_mobilisation_raci_roadmap.md` and telemetry tooling.
3. Approve control enhancements feeding into `docs/compliance/security_baseline.md` and CI guardrails.

## 2. Role Catalogue Decisions
| Role | Description | Systems Access | Decisions |
| --- | --- | --- | --- |
| **Global Admin** | Programme directors & senior ops with full control. | All admin APIs (`/api/admin/*`), feature toggle secrets, PostGIS management, telemetry dashboards. | No change. MFA + hardware key enforcement validated in Okta policy. Access limited to 6 individuals with quarterly review. |
| **Compliance Officer** | Handles verification queues, DPIA evidence, dispute escalation. | Compliance dashboards, document storage (read), dispute transcripts, retention overrides. | Elevated to allow dispute transcript export; requires dual approval recorded in admin UI modal referencing `Web_Application_Design_Update/Settings Dashboard.md`. |
| **Finance Manager** | Commission, tax, monetisation oversight. | Finance engine endpoints, reconciliation dashboards, ledger exports. | Added constraint: cannot change feature toggles. Finance requests must route through Global Admin with recorded change request ID. |
| **Support Supervisor** | Responds to booking issues and chat escalations. | Booking dashboard (read/write limited), chat viewer, notification triggers. | Introduced time-bound access (8 hours) via JIT workflow; automation to remove stale sessions using Secrets Manager TTL. |
| **Provider Success** | Onboards providers, manages inventory approvals. | Provider onboarding queue, inventory review panel, insured seller badge toggles. | Access limited to masked PII (no full address) unless compliance co-approves; React UI updated with redacted view state. |
| **Design QA** | Validates UI toggles, telemetry instrumentation, accessibility. | Feature toggle panel (read-only), telemetry dashboard, issue intake console. | Granted read-only token to `/api/admin/feature-toggles`; telemetry export limited to aggregated CSV. |
| **Data Engineering** | Maintains telemetry & analytics pipelines. | Telemetry snapshots table, Looker ingestion API, data warehouse staging bucket. | Write access gated behind Terraform plan review; service account rotates quarterly with drift detection in CI. |

## 3. Control Enhancements Agreed
1. **Feature Toggle Governance** — `backend-nodejs/src/routes/adminRoutes.js` + `featureToggleController.js` to enforce role scopes: only Global Admin can mutate; Compliance and Design QA obtain read-only tokens. Frontend panel to surface audit trail referencing change request IDs.
2. **Secrets Manager JIT Access** — `scripts/environment-parity.mjs` job extended to audit Secrets Manager TTLs nightly and expire Support Supervisor credentials after 8 hours. Ops to run manual override via runbook when incidents require longer exposure.
3. **Document Redaction** — Provider Success views mask street-level address fields unless compliance toggles "Reveal once"; logging added to note viewer, timestamp, and justification string.
4. **Telemetry Snapshot Export** — Data Engineering role receives API key stored in HashiCorp Vault; CLI export requires justification appended to Slack audit channel (#fixnado-security-reviews).
5. **Chat Transcript Handling** — Support Supervisor transcripts accessible only through dispute context; downloads require compliance cosign and generate audit event forwarded to SIEM (SumoLogic integration scheduled Q1).
6. **Role Review Cadence** — Quarterly RBAC review booked (first follow-up: 2026-01-08) with automated diff generated from IAM inventory script to catch privilege creep.

## 4. Outstanding Actions
| ID | Action | Owner | Due | Notes |
| --- | --- | --- | --- | --- |
| RBAC-01 | Update feature toggle API middleware to enforce scoped roles & produce audit log entry (`featureToggleController.js`). | Luis Ortega | 2025-10-18 | Logging schema to include `change_request_id`, `actor_role`, `toggle_name`, `previous_state`, `new_state`. |
| RBAC-02 | Design admin UI banner warning when redacted addresses are expanded, referencing DPIA obligations. | Priya Kapoor | 2025-10-20 | Copy anchored in `Web_Application_Design_Update/text.md.md` security section. |
| RBAC-03 | Publish JIT access runbook in `docs/operations/` with Slack command syntax. | Alina Novak | 2025-10-22 | Runbook to reference Secrets Manager TTL values and escalation chain. |
| RBAC-04 | Wire SIEM forwarding for transcript download audit events. | Malik Fraser | 2025-11-05 | Build on telemetry alert job infrastructure; deliver to security baseline tracker. |
| RBAC-05 | Record RBAC matrix snapshot in Confluence and link from `update_progress_tracker.md` commentary. | Jordan Blake | 2025-10-16 | Provide PDF export for regulator pack. |

## 5. Approvals & Next Review
- **Approvals captured via DocuSign:** Maya Chen, Victor Ross, Priya Kapoor — 2025-10-14.
- **Next review:** 2026-01-08 (Quarterly). Agenda will focus on marketplace monetisation roles and automation of JIT workflows.

## 6. Distribution
Minutes distributed to Security, Compliance, Programme Management, Design Ops, and Operations Slack channels with link to `docs/compliance/security_baseline.md` and DPIA action tracker.
