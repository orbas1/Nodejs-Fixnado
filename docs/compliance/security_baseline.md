# Security Baseline — Fixnado Version 1.00

## 1. Purpose & Scope
This baseline defines minimum technical and procedural controls required to operate Fixnado Version 1.00 in production. It aligns with ISO 27001 Annex A, NCSC Cyber Essentials, and UK GDPR expectations. The scope covers:
- Backend Node.js services (zone, booking, finance, telemetry, admin feature toggles)
- React web application (admin explorer, telemetry dashboard, theme studio)
- Flutter mobile applications (user, servicemen, provider, enterprise)
- Infrastructure (PostgreSQL/PostGIS, Redis, AWS Secrets Manager, S3 document storage, CI/CD pipelines)
- Supporting tooling (issue intake automation, telemetry alerting, rollback playbooks)

## 2. Control Summary
| Control Area | Requirement | Implementation | Evidence |
| --- | --- | --- | --- |
| Identity & Access Management | Enforce MFA + hardware key for privileged accounts; RBAC separation for admin functions. | Okta policies (MFA mandatory for Global Admin/Compliance); RBAC decisions recorded in `docs/compliance/rbac_review_minutes.md`; API middleware verifying role scopes in `backend-nodejs/src/routes/adminRoutes.js`. | Quarterly RBAC review pack; Vitest coverage in `backend-nodejs/tests/featureToggleService.test.js` verifying role-scoped updates (extend to admin routes by 2025-10-31). |
| Secrets Management | All credentials stored in AWS Secrets Manager with automatic rotation and TTL for temp creds. | Terraform modules under `infrastructure/terraform/runtime-config`; `scripts/environment-parity.mjs` validates stage vs prod parity and TTL; release checklist references Secrets Manager IDs. | CI job `Build, Test & Scan` logs; parity report archived with deployment artefacts. |
| Data Encryption | Encrypt data in transit (TLS 1.2+) and at rest (KMS). | AWS RDS encryption, S3 SSE-KMS, CloudFront TLS for web, gRPC/TLS for Agora; Node services enforce HTTPS via ALB. | Terraform state + AWS Config snapshots. |
| Logging & Monitoring | Capture audit logs for admin changes, feature toggles, RBAC, document access, telemetry anomalies. | Winston logger writing to CloudWatch; feature toggle controller emits audit events; telemetry alert job posts to Slack + stores snapshots; transcripts downloads logged with compliance cosign. | Slack #fixnado-security-alerts transcripts; `UiPreferenceTelemetrySnapshot` table entries. |
| Vulnerability Management | Automated dependency scanning, gitleaks, Snyk pipeline; monthly penetration test schedule. | GitHub Actions `Build, Test & Scan` runs `npm audit --production`, `pnpm audit` for Flutter, `security-audit.mjs`; quarterly external pen-test contract. | GitHub Actions artefacts; penetration test report stored in SharePoint. |
| Secure Development | Definition of Done requires unit/integration tests, threat modelling, and code review by security champion for sensitive modules. | `update_docs/1.00/test_plan.md` codifies security gates; PR template updated with threat model checkbox; `scripts/issue-intake.mjs` ensures security issues triaged within SLA. | PR templates, issue tracker SLA exports. |
| Incident Response | Maintained rollback playbook, on-call rota, and telemetry alerts for anomalies. | `docs/operations/rollback-playbook.md`, telemetry Slack alerts, environment parity script; Hypercare rota to be finalised in Task 6.5. | Playbook version control; Slack incident channels logs. |
| Data Retention & Minimisation | Enforce TTLs and manual review for sensitive datasets (chat transcripts, rental documents, telemetry IP hashes). | TTL policies documented in this baseline; scheduled Lambda for telemetry hashed IP purge; Document retention job (backlog). | AWS Lifecycle policies; runbook referencing TTL actions. |
| Supplier Management | DPAs and SCCs on file for Agora, AI moderation, payment gateway; vendor risk review annually. | Vendor artefacts stored in Legal SharePoint; vendor review tasks tracked in Confluence; telemetry identifies upstream outages. | Vendor review meeting minutes; DPIA references. |

## 3. Environment Hardening Checklist
| Environment | Baseline State | Owner | Status |
| --- | --- | --- | --- |
| **Production** | - RDS/PostGIS encryption + automated backups<br>- WAF shielding admin endpoints<br>- Secrets Manager rotation (90 days standard, 1 day temp)<br>- CloudFront TLS 1.2+, HSTS 12 months<br>- CI/CD promoted artefacts only with manifest signature | DevOps Lead | ✅ Baseline locked 2025-10-12 |
| **Staging** | - Mirrors production configuration via Terraform workspace<br>- Synthetic data (no live PII)<br>- Feature toggles default to staging safe values<br>- Observability parity (CloudWatch metrics, Slack alerts) | DevOps Lead | ✅ Verified 2025-10-13 (environment parity report archived) |
| **Development** | - Developer accounts via SSO; no persistent prod data<br>- Local `.env` files banned; use `fixnado-cli secrets pull` (internal tool) <br>- Logging limited to debug with redaction filters | Engineering Managers | ⚠️ CLI rollout scheduled 2025-10-30 |

## 4. Dataset Retention & Handling Policies
| Dataset | Classification | Retention | Disposal Mechanism | Notes |
| --- | --- | --- | --- | --- |
| Booking records | Confidential | 6 years | Automated RDS snapshot purge + archive to encrypted cold storage | Aligns with UK consumer contract requirement. |
| Chat transcripts | Confidential | 90 days (default) / 2 years (disputes) | Scheduled deletion job in chat service; manual override logged | Compliance officer notified 7 days before deletion for disputes. |
| Telemetry hashed IP salt | Restricted | 30 days | Lambda rotates salt & truncates historical hashes nightly | Supports DPIA risk DPIA-03. |
| Zone polygons | Confidential | 24 months rolling | PostGIS job removes stale polygons & caches aggregated analytics | Historical heatmaps anonymised before archive. |
| Rental compliance documents | Restricted | 7 years | S3 lifecycle policy + audit log of purge actions | Purge backlog item tracked in DPIA action plan. |
| Issue intake artefacts | Internal | Programme lifetime | Git history (auditable) | Access restricted to programme staff. |

## 5. Monitoring & Alerting
- **Slack Channels:**
  - `#fixnado-security-alerts` — telemetry anomalies, failed login spikes, feature toggle changes, RBAC modifications.
  - `#fixnado-ops` — environment parity diffs, PostGIS health check results (`scripts/environment-parity.mjs`, `scripts/create-rollback-manifest.mjs`).
- **Alert Thresholds:**
  - Telemetry staleness ≥120 minutes triggers Slack & PagerDuty (Ops primary, Security secondary).
  - Failed login attempts >20 per minute triggers CloudWatch alarm piped to Security.
  - Secrets Manager TTL <12 hours for Support Supervisor role generates immediate Slack DM and rotates credentials.
- **Dashboards:**
  - Admin Telemetry dashboard (`frontend-reactjs/src/pages/TelemetryDashboard.jsx`) includes security KPI widget (opt-out rate, hashed IP churn) for DPO monitoring.
  - Grafana board (infra) tracks CPU/memory, WAF blocks, PostGIS query latency.

## 6. Secure Deployment & Change Management
1. **CI/CD Pipelines** — `Build, Test & Scan` workflow enforces linting, unit/integration tests, Vitest coverage thresholds, gitleaks, dependency audits. `Release Packaging` attaches manifest with checksums and toggle states.
2. **Change Approvals** — Production deploys require:
   - Code review (2 approvers, 1 security champion for sensitive changes)
   - Passing automated test suites (backend, React, Flutter) with coverage attestation stored in `update_tests/`.
   - Deployment checklist referencing DPIA & RBAC updates; manual hold if compliance docs outdated >30 days.
3. **Rollback Readiness** — `docs/operations/rollback-playbook.md` outlines triggers, communication tree, validation steps (Stark/Chromatic re-run). Release manifest includes environment parity snapshot + toggle states.
4. **Infrastructure as Code** — Terraform PRs require plan review by DevOps & Security; apply step executed via GitHub Actions with drift detection; state stored in encrypted S3 with DynamoDB locking.

## 7. Security Testing Cadence
| Test Type | Frequency | Owner | Tooling | Coverage |
| --- | --- | --- | --- | --- |
| Static dependency & secret scanning | Every PR | DevSecOps | GitHub Actions, `security-audit.mjs`, `gitleaks` | Node, React, Flutter, Terraform modules |
| Dynamic API testing | Nightly | QA Automation | Postman/Newman, Vitest contract tests | Booking, zone, telemetry, feature toggles |
| Penetration testing | Quarterly | Security Architect | External vendor | OWASP API/Top 10, infrastructure footprint |
| Load & resilience drills | Bi-monthly | SRE Lead | k6, Gremlin | Booking orchestrator, chat service, telemetry pipeline |
| Access review | Quarterly | Compliance Analyst | IAM diff tooling | RBAC, Secrets Manager TTL, audit log sampling |

## 8. Compliance Mapping
| Requirement | Control Reference | Status |
| --- | --- | --- |
| GDPR Art. 25 (Data Protection by Design & Default) | DPIA mitigations, telemetry anonymisation, redacted UI states | ✅ Implemented |
| GDPR Art. 30 (Records of processing) | `docs/compliance/dpia.md`, issue intake automation, telemetry snapshots | ✅ Maintained |
| UK GDPR Schedule 1 (Insurance / DBS) | Rentals retention policy, RBAC restrictions | ✅ In progress (purge automation pending) |
| PCI DSS (payment references only) | Tokenised payment IDs, no PAN storage | ✅ Confirmed (gateway handles card data) |
| ISO 27001 A.12 (Operations security) | CI/CD guardrails, logging, monitoring | ✅ Implemented |
| ISO 27001 A.16 (Incident management) | Rollback playbook, telemetry alerting, SLA tracker | ✅ Implemented |

## 9. Change Log
| Date | Change | Owner |
| --- | --- | --- |
| 2025-10-15 | Baseline refreshed for Version 1.00: added RBAC JIT access control, telemetry salt rotation, rentals document retention policy, and Secrets Manager TTL alerting. | Maya Chen |
| 2025-10-15 | Added compliance mapping and deployment gating requirement tied to DPIA freshness. | Maya Chen |

## 10. Next Steps
- Complete outstanding RBAC actions (RBAC-01…05) and update this baseline with implementation notes by 2025-11-10.
- Expand security baselines to provider analytics microservices once Task 3 (Marketplace) enters development.
- Integrate Grafana + Loki log pipelines with anomaly detection for chat transcript downloads.
