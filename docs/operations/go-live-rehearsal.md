# Fixnado Go-Live Rehearsal Playbook

This playbook documents the production launch rehearsal executed on 30 May 2024 ahead of the Version 1.00 release. It ensures engineering, operations, support, and compliance teams can execute a controlled cutover with evidence captured for the release vault.

## Objectives
- Validate blue/green deployment automation, readiness snapshots, and rollback procedures across staging and production-like environments.
- Exercise incident management, DSAR fulfilment, and refund triage workflows end-to-end using anonymised rehearsal data.
- Confirm legal publication, acknowledgement tracking, and policy evidence meet compliance sign-off criteria.
- Capture artefacts (dashboards, logs, approvals) required by the governance board prior to go-live.

## Timeline & Ownership
| Time (BST) | Activity | Owner | Artefacts |
| --- | --- | --- | --- |
| 09:00 | Kick-off, risk review, readiness snapshot export | Programme Manager | `go-live/2024-05-30/readiness-snapshot.json` |
| 09:30 | Blue/green deployment rehearsal in staging (Terraform plan + CodeDeploy cutover) | DevOps Lead | GitHub Actions run #2481, CodeDeploy lifecycle logs |
| 10:45 | Smoke suite, vitest pack, and synthetic monitoring validation | QA Lead | `ci/2024-05-30T10-45-smoke-report.html` |
| 12:00 | Lunch & contingency review | All | Minutes in Confluence |
| 13:00 | Data governance rehearsal: submit DSAR, generate export, verify purge job | Compliance Lead | DSAR case `GDPR-DRYRUN-042`, export checksum, purge log |
| 14:30 | Refund and incident drills (Finance + Support) | Finance Ops Manager | Refund case `RF-DRYRUN-118`, incident form |
| 16:00 | Legal publication verification & acknowledgement sampling | Legal Counsel | Policy audit CSV, LMS acknowledgement report |
| 17:00 | Retrospective, sign-off, and rollback readiness confirmation | Executive Sponsor | Signed approval PDF, risk log update |

## Deployment Rehearsal Steps
1. **Terraform plan review** – Execute `Terraform Deployments` workflow targeting `staging-blue`. Two engineers review plan output and verify drift is zero. Attach JSON diff to release vault.
2. **CodeDeploy blue/green** – Promote the blue environment using validation listener 9443. Capture CloudWatch metrics for latency, error rate, and readiness gauge. Abort simulation mid-way to validate automatic rollback triggers.
3. **Readiness persistence** – Confirm `runtime/readiness.json` updates within 5 seconds after service health toggles. Verify Prometheus metric `fixnado_readiness_status` exposes component status labels.
4. **Smoke verification** – Run `npm test -- --runInBand` and synthetic checks (login, timeline hub, commerce snapshot, DSAR create). Store Vitest JUnit report and Grafana annotations.

## Compliance & Support Drills
- **DSAR rehearsal**: Submit `access` request via API using rehearsal account. Complete export using `POST /v1/compliance/data-requests/:id/export`, validate JSON payload for user, conversations, rentals, and orders. Purge rehearsal request via `purgeExpiredDataGovernanceRecords` dry-run mode.
- **Refund triage**: Create simulated failed service milestone, attach inspection report, and route through Finance queue. Ensure refund policy acknowledgements are current and risk log updates recorded.
- **Incident simulation**: Trigger high-severity incident, run Chatwoot bridge escalation, and issue public communication draft. Record MTTA and MTTR in incident ledger.

## Evidence Checklist
- ✅ GitHub Actions run artifacts and manual approval notes.
- ✅ CodeDeploy lifecycle logs including rollback validation.
- ✅ Grafana dashboards (timeline hub, commerce, infrastructure) exported as PNG and stored in release vault.
- ✅ DSAR export JSON, checksum file, and purge logs.
- ✅ Refund case notes, finance ledger entries, and acknowledgement audit trail.
- ✅ LMS acknowledgement export covering refund policy and community guidelines (sample size 50).
- ✅ Signed legal counsel confirmation that refund, community guidelines, about, and FAQ documents are published with correct metadata.

## Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Provider payout integration fails during cutover | High | Maintain frozen blue environment, rehearse rollback command, and pre-stage finance support staff to issue manual payouts if required. |
| DSAR export exceeds size limits | Medium | Chunk exports by dataset, stream to S3, and notify privacy office for manual fulfilment within SLA. |
| Support volume spike post-launch | Medium | Activate surge staffing plan, extend Chatwoot coverage, and pre-load macros for known FAQs. |

## Sign-Off
- **Compliance Lead**: Verifies DSAR, refund, and policy publication evidence.
- **DevOps Lead**: Confirms infrastructure automation readiness and rollback.
- **Product Engineering Lead**: Signs off timeline hub, commerce, and dashboard smoke results.
- **Executive Sponsor**: Approves go-live readiness and records decision in governance ledger.

All artefacts referenced above are stored in the release vault under `release_vault/2024-05-30-go-live-rehearsal/`.
