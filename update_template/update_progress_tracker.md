# Version 1.00 Progress Tracker

## Snapshot (Updated 2024-06-02)
| Task ID | Title | Milestone | Owner | Status | Progress | Last Update | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UT-001 | Programme mobilisation, charter, and governance toolkit | M1 | Programme Manager | Complete | 100% | 2024-05-09 | Update plan, milestones, task list, and tracker published; steering cadence agreed. |
| UT-002 | CI/CD & infrastructure automation rollout | M2 | DevOps Lead | Complete | 100% | 2024-05-16 | Terraform pipeline live, CodeDeploy blue/green configured, and secrets rotation tooling delivered. |
| UT-003 | Database migrations, seeding, and verification suite | M2 | Data Engineering Lead | Complete | 100% | 2024-05-20 | Marketplace taxonomy tables, deterministic seed data, and verification CLI landed in backend repo. |
| UT-004 | Timeline Hub services, moderation, and Chatwoot integration | M3 | Product Engineering Lead | Complete | 100% | 2024-05-23 | Timeline hub snapshot service, moderation queue, ads placements, and Chatwoot session API delivered. |
| UT-005 | Marketplace commerce engine & persona dashboards | M4 | Commerce Squad Lead | Complete | 100% | 2024-05-27 | Commerce engine snapshot APIs, persona dashboards, and commerce policies landed with Vitest coverage. |
| UT-006 | Compliance, legal publication, and launch rehearsals | M5 | Compliance Lead | Complete | 100% | 2024-05-30 | Refund & community policies published, DSAR tooling rehearsed, go-live runbook executed with executive sign-off. |
| UT-007 | Campaign manager model remediation | M3 | Product Engineering Lead | Complete | 100% | 2024-06-02 | Advertising domain models deduplicated, enums/indexes normalised, and bundler import errors cleared for creatives, placements, and audience segments. Legacy Vitest alias collisions tracked separately. |

## Activity Log
- **2024-06-02** – UT-007 created to stabilise campaign manager models. Creative/audience/placement definitions refactored with enums, indexes, metadata hygiene, and association guards so vitest bundler can import advertising domain files without syntax errors.
- **2024-05-30** – UT-006 completed. Legal library expanded (refund, community guidelines, about, FAQ), DSAR metrics and exports verified, go-live rehearsal executed with compliance, finance, and support evidence captured.
- **2024-05-27** – UT-005 completed. Commerce engine service, persona dashboards, wallet/escrow analytics, and policy gating delivered with Vitest coverage.
- **2024-05-23** – UT-004 completed. Timeline hub orchestration service, moderation queue, ad placement surfacing, and Chatwoot support APIs landed with unit coverage.
- **2024-05-20** – UT-003 completed. Marketplace taxonomy schema, deterministic seed set, verification suite, and rollback SQL published with checks wired into backend automation.
- **2024-05-16** – UT-002 completed. Terraform GitHub Actions pipeline, AWS CodeDeploy blue/green foundation, and Secrets Manager rotation utilities merged with validation runbook published.
- **2024-05-09** – UT-001 completed. Programme charter, risk register, and mobilisation cadence published; cross-functional sign-offs captured in governance vault.

## Upcoming Checkpoints
- **Week 6 Tuesday** – Campaign manager QA to verify creative/audience/placement metadata parity and association guards post-refactor (UT-007).
- **Week 5 Monday** – Legal acknowledgement audit sampling refund and community guidelines acknowledgements across personas (UT-006).
- **Week 5 Wednesday** – DSAR backlog review validating metrics dashboard signals and purge jobs (UT-006).
- **Week 5 Friday** – Incident rehearsal retro finalising launch readiness report for executive board (UT-006).

## Issues & Risks (Active)
| ID | Description | Impact | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| R-01 | Need secured credentials for Chatwoot sandbox to unblock integration proof-of-concept. | Medium | Chatwoot sandbox handshake completed; widget + session APIs now tested against credential vault. | Support Engineering Lead | Resolved |
| R-02 | Payment provider contract pending signature, delaying escrow implementation start. | High | Contract countersigned 2024-05-28; finance ops verifying settlement cutover during go-live rehearsal. | Commerce Squad Lead | Resolved |
| R-03 | Validation listener restricted to fixed NAT ranges may block deployments if corporate egress IPs rotate. | Medium | Automate weekly CIDR audit via Terraform pipeline and keep emergency VPN profile documented in runbook. | DevOps Lead | Open |
| R-04 | Marketplace taxonomy drift between environments could break feed and catalogue parity. | Medium | Run nightly taxonomy-integrity CLI checks with checksum alerts and gate deployments on mismatches. | Data Engineering Lead | Open |

| R-05 | Legacy Vitest suites still fail due to historical duplicate declarations and association alias conflicts outside refreshed campaign models. | High | Create incremental hardening plan covering constants library and ServicemanProfile associations before gating release readiness. | Product Engineering Lead | Open |

## Decision Log
| Date | Decision | Rationale | Owner |
| --- | --- | --- | --- |
| 2024-05-09 | Adopt GitHub Actions + Terraform Cloud for automation baseline. | Aligns with team expertise, supports policy-as-code, integrates with existing secrets management. | Programme Manager |
| 2024-05-16 | Standardise on AWS CodeDeploy blue/green deployments with validation listener gating. | Provides zero-downtime cutovers, native rollback, and aligns with Terraform-managed infrastructure. | DevOps Lead |
| 2024-05-30 | Publish legal documents via managed service with acknowledgement metadata surfaced in APIs. | Enables compliance dashboards, acknowledgement sampling, and go-live sign-off requirements. | Compliance Lead |

## Communication Cadence Summary
- **Daily** cross-functional stand-up (DevOps, Backend, Frontend, Mobile, Compliance).
- **Weekly** steering committee (Programme, Product, Compliance, Operations).
- **Bi-weekly** demo/review showcasing automation progress and feed prototypes.

## Metrics to Monitor
- Pipeline success rate & mean duration per stage.
- Taxonomy checksum verification pass rate and nightly migration/seed playback success.
- Moderation queue SLA once timeline hub enters QA.
- Checkout funnel conversion during commerce testing.
- Compliance artefact approval cycle time.
- DSAR SLA completion rate and overdue backlog.
- Policy acknowledgement coverage across refund and community guidelines.
