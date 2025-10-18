# RBAC & Feature Flag Governance — Version 1.00

This document defines how Fixnado governs personas, feature flag lifecycles, and telemetry enforcement during the Version 1.00 rollout. It is written for engineering, product, and operations stakeholders who approve persona unlocks and manage launch toggles across backend, web, and mobile surfaces.

## 1. Persona Catalogue & Access Rules

| Persona | Primary Surfaces | Core Capabilities | Unlock Prerequisites |
| --- | --- | --- | --- |
| Learner | Web app, user mobile app | Timeline, course catalogue, storefront checkout, support inbox | Automatic upon email verification. Must pass fraud screening; suspended accounts lose access immediately. |
| Instructor | Web dashboards, finance tooling | Course authoring, order fulfillment, payouts, dispute management | Requires signed instructor contract and finance KYC approval. Provisioned via `instructor.enable` flag scoped to tenant. |
| Serviceman | Operational consoles, logistics APIs | Job dispatch, materials allocation, incident response | Enabled by `serviceman.core` flag and field-ops approval; requires background check recorded in compliance CRM. |
| Admin | Compliance dashboard, governance tooling | Persona management, audits, global toggles, data exports | Granted via security team request tickets; requires hardware security key registration and successful war room exercise participation. |
| Demo | Sandbox storefront, limited analytics | Read-only demo experiences for partners and sales | Issued via signed demo agreement. Access expires automatically after 30 days unless renewed by product leadership. |

### Persona Escalation Workflow
1. **Request** — Persona change submitted through the governance portal with business justification and expiry date.
2. **Validation** — Security automation validates employment status, outstanding investigations, and compliance checks.
3. **Approval** — Designated approvers (product lead + security duty officer) sign off in Slack using `/governance approve <requestId>`.
4. **Provisioning** — RBAC service toggles the appropriate persona flag and writes an audit record linking the requester, approvers, and change window.
5. **Review** — Automated review runs every 14 days to expire unused elevated personas and regenerate the approval report for compliance archives.

## 2. Feature Flag Lifecycle

| Stage | Description | Required Artefacts |
| --- | --- | --- |
| Proposal | Engineer or PM documents the flag intent, blast radius, and rollback plan in the feature brief. | Ticket tagged `feature-flag`, rollout checklist, telemetry dashboard link. |
| Development | Feature is implemented behind the flag in all services and clients. | Contract tests proving both flag states, updated integration docs, QA test plan. |
| Verification | Feature runs in lower environments with controlled cohorts. | Synthetic monitoring dashboards, error budget impact report, stakeholder sign-off. |
| Launch | Flag enabled for production cohorts following the rollout playbook. | Change management ticket, comms plan, rollback checklist, on-call schedule. |
| Sunsetting | Codebase is cleaned up once the flag is permanently on or off. | Pull request removing dead paths, updated documentation, audit trail closure. |

### Mandatory Controls
- **Namespace convention** — `<domain>.<feature>`, e.g. `telemetry.mobileCrashAlerts`. Avoid per-developer namespaces.
- **Cohort hashing** — All percentage rollouts must rely on the deterministic hashing helper shipped in `featureToggleMiddleware.js` to avoid divergent experiences across services.
- **Audit logging** — Every change is recorded through the LaunchDarkly webhook bridge, piping events into the compliance warehouse with correlation IDs.
- **Expiry dates** — Feature flags must include a documented retirement date. Flags older than 90 days trigger a weekly reminder in `#governance-alerts` until resolved.

## 3. Telemetry Guardrails

The telemetry pipeline introduced in Version 1.00 collects sensitive diagnostic data. The following guardrails keep the system compliant and actionable:

1. **Ingestion Contracts** — All reporters must POST to `/v1/telemetry/client-errors` or `/v1/telemetry/mobile-crashes` using the schemas defined in `telemetryRoutes.js`. Payloads exceeding metadata or breadcrumb limits are rejected to protect storage budgets.
2. **Retention Enforcement** — Sequelize retention jobs purge client errors after the configured `retentionDays`. Operations must not override these values below the documented minimums without a compliance sign-off.
3. **Alert Dispatch** — Slack webhooks are optional in lower environments. Production must set `TELEMETRY_SLACK_WEBHOOK_URL`; failing to do so blocks the readiness checklist.
4. **Correlation IDs** — Reporters must include `correlationId` headers when available. Backend middleware ensures each stored event includes a deterministic identifier for triage.
5. **CI Enforcement** — The telemetry contract tests added to the CI workflow validate JSON schemas and metadata bounds. Builds cannot merge without passing telemetry checks, ensuring reporters stay aligned with backend expectations.

## 4. Demo & Override Policies

- **Storefront Overrides** — Only admins may generate storefront override tokens via the governance CLI. Tokens expire within 15 minutes and are logged with the requestor, persona scope, and justification.
- **Demo Feature Flags** — Demo environments use dedicated flags prefixed with `demo.`. They inherit production defaults nightly to prevent divergence; manual overrides require product leadership approval.
- **Third-Party Access** — Partners receive time-bound demo persona accounts with telemetry limited to synthetic data. Real user traffic must never be exposed through demo flags.

## 5. Incident Response & Rollback

1. **Detection** — Telemetry alerts route to `#war-room` with runbooks linking to Grafana crash dashboards. Severity `fatal` alerts page the on-call engineer.
2. **Mitigation** — On-call may disable the offending feature flag or revoke personas via the governance portal. Actions must include an incident ticket reference.
3. **Communication** — Product marketing informs stakeholders if demos or partner sandboxes are impacted. Compliance prepares regulatory notifications when personal data exposure is suspected.
4. **Postmortem** — Incidents require a postmortem within 5 business days documenting root cause, corrective actions, and updates to this governance policy.

## 6. Audit & Reporting

- Quarterly audits export persona assignments, flag histories, and telemetry retention metrics to the governance data warehouse.
- The security team maintains a looker dashboard that highlights aged flags, expired approvals, and missing webhook secrets.
- Any deviations discovered during audits must be resolved within 10 business days; unresolved items block the next release milestone.

Maintain this document alongside the change log—update it whenever persona policies or flag tooling evolves.
