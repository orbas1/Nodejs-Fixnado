# Data Subject Access Request Operational Playbook

This playbook describes the production-ready DSAR process delivered for Fixnado Version 1.00. It aligns with UK GDPR and provides runbooks for privacy, support, and engineering teams handling data subject rights.

## 1. Intake Channels
- **Privacy Center (web/mobile)** – Settings → Legal & Privacy surfaces a form that captures request type, justification, preferred contact channel, and supporting documents.
- **Email** – privacy@fixnado.com monitored 24/7. Incoming mail is pushed into the compliance inbox with automatic ticket creation.
- **Support escalation** – Chatwoot macro `DSAR escalation` pushes metadata into the compliance queue when customers raise privacy concerns to frontline support.

All channels create a record in `DataSubjectRequests` with hashed email, request type (`access`, `erasure`, `rectification`), region, SLA due date, and audit log entry.

## 2. Verification & Assignment
1. **Identity verification** – Automated email confirmation plus optional SMS or document verification for high-risk requests. Verification metadata is stored in the request audit log.
2. **Region routing** – The service resolves the request region based on supplied code or account data (default GB). Region drives SLA, export scope, and reporting segmentation.
3. **Assignment** – The compliance console assigns a case owner. Assignment triggers notification to privacy leaders and the requesting user. SLA counters start once verification completes.

## 3. Fulfilment Workflow
| Step | Description | Owner | Tooling |
| --- | --- | --- | --- |
| Scope confirmation | Validate personal data categories required for the request. Confirm identity and authority for agent requests. | Privacy Analyst | Compliance console |
| Data export | Invoke `POST /v1/compliance/data-requests/:id/export`. The backend collates user profile, orders, rentals, conversations, disputes, and associated regions into JSON. | Privacy Analyst | `dataGovernanceService.generateDataSubjectExport` |
| Redaction | Inspect export for third-party personal data. Use `privacy-redaction.xlsx` to note redactions and provide rationale. | Privacy Analyst | Finance & support input |
| Response | Provide secure download link via the Privacy Center and send summary email. Include instructions for decrypting the archive and contact details for queries. | Privacy Analyst | Privacy Center |
| Closure | Update status to `completed`, record completion timestamp, and attach redaction notes. | Privacy Lead | Compliance console |

Erasure and rectification requests follow the same workflow with additional tasks:
- **Erasure** – Trigger asynchronous purge job via `purgeExpiredDataGovernanceRecords` with `force` flag. Notify system owners (analytics warehouse, marketing tools) using the integration checklist.
- **Rectification** – Apply updates across user profile, company records, and synced integrations. Document affected systems in audit log.

## 4. SLA Monitoring
- SLA defaults to **30 days** with due date stored on creation. Due-soon window (7 days) drives dashboard alerts.
- Metrics endpoint `/v1/compliance/data-requests/metrics` powers compliance dashboards showing totals, overdue count, completion percentiles, and oldest pending request.
- Nightly job posts summary metrics to the governance Slack channel and writes Prometheus gauges for DSAR backlog health.

## 5. Evidence & Audit
- Every status change appends to `auditLog` with actor ID, timestamp, and note. Audit entries include verification outcome, export path, redaction summary, and closure rationale.
- Export files are written to `storage/data-exports/<region>/<requestId>.json` with SHA-256 checksum. Access is restricted to privacy engineers and security analysts.
- Purged requests older than the retention window are hard-deleted with counts logged via `purgeExpiredDataGovernanceRecords`.
- Weekly audit sample: review 10% of closed cases for accuracy, timeliness, and communication quality. Record findings in the privacy QA board.

## 6. Incident Handling
If a DSAR breach or failure occurs (missed SLA, incorrect disclosure, unauthorised access):
1. Notify the Data Protection Officer within 2 hours.
2. Open incident in the security incident response platform referencing DSAR request ID.
3. Contain by revoking access, rotating secrets, and reissuing corrected exports if needed.
4. Assess reporting obligations to the ICO and impacted individuals within 72 hours.
5. Record root cause and remediation in the incident register.

## 7. Training & Sign-Off
- All privacy analysts, support leads, and finance specialists completed DSAR training module `PRIV-DSAR-2024-Q2` on 28 May 2024 (LMS report stored in release vault).
- DPO sign-off confirms tooling, runbooks, and audit evidence satisfy GDPR accountability requirements.
- This playbook is reviewed quarterly or after any material change to data processing activities.
