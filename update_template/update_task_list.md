# Version 1.00 Task List

| Task ID | Title | Milestone | Summary | Owner | Dependencies | Status | Progress |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UT-001 | Programme mobilisation, charter, and governance toolkit | M1 | Publish update plan, risk register, communications cadences, and backlog triage artefacts so squads can execute in parallel. | Programme Manager | Pre-update evaluations | Complete | 100% |
| UT-002 | CI/CD & infrastructure automation rollout | M2 | Implement GitHub Actions pipelines, Terraform modules, secret management, and blue/green deployment playbooks. | DevOps Lead | UT-001 | Complete | 100% |
| UT-003 | Database migrations, seeding, and verification suite | M2 | Author migrations, deterministic seeders, integrity checks, and rollback rehearsal scripts for services/rentals/materials taxonomy. | Data Engineering Lead | UT-001 | Complete | 100% |
| UT-004 | Timeline Hub services, moderation, and Chatwoot integration | M3 | Build feed orchestration, ad placement controls, moderation workbench, urgency analytics, and Chatwoot client integrations. | Product Engineering Lead | UT-002, UT-003 | Complete | 100% |
| UT-005 | Marketplace commerce engine & persona dashboards | M4 | Deliver checkout, escrow, wallet, finance/tax widgets, analytics dashboards, and RBAC navigation parity across personas. | Commerce Squad Lead | UT-002, UT-003 | Not Started | 0% |
| UT-006 | Compliance, legal publication, and launch rehearsals | M5 | Finalise legal policies, GDPR tooling, incident/runbook library, enablement kits, and go-live rehearsal sign-off. | Compliance Lead | UT-004, UT-005 | Not Started | 0% |

## Task Notes & Acceptance Criteria
- **UT-001**: Includes publishing the update plan, milestone list, task list, and progress tracker with stakeholder approvals and risk log initialised.
- **UT-002**: Requires successful pipeline runs across unit, integration, security, and performance suites with automated artefact promotion.
- **UT-003**: Must produce repeatable seeding with checksum verification and rollback proofs stored in release vault.
- **UT-004**: Needs feed performance budgets, moderation SLAs, Chatwoot webhook processing, and accessibility audits completed.
- **UT-005**: Demands PCI-compliant payment processing, tax jurisdiction coverage, persona dashboard analytics, and audit logging.
- **UT-006**: Concludes with legal counsel sign-off, GDPR DSAR portal usability test, incident drill evidence, and executive go-live approval.
