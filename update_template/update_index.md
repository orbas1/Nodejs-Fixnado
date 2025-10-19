# Version 1.00 Update Index

| Document | Purpose | Latest Update |
| --- | --- | --- |
| update_plan.md | Programme charter outlining objectives, workstreams, risks, and governance for Version 1.00. | 2024-05-16 |
| update_milestone_list.md | Ordered milestones with entry/exit criteria anchoring the schedule. | 2024-05-09 |
| update_task_list.md | Authoritative backlog of milestone-aligned tasks with ownership and progress. | 2024-05-16 |
| update_progress_tracker.md | Live status tracker with activity log, risks, decisions, and cadence summary. | 2024-05-16 |
| change_log.md | Summary of documentation changes applied during Version 1.00 planning. | 2024-05-16 |
| test_plan.md | Gating strategy for automation, functional, security, performance, and regression testing. | Pending next task |
| infrastructure/runbooks/blue-green-deployment.md | Operational playbook for AWS CodeDeploy blue/green releases including validation and rollback drills. | 2024-05-16 |
| scripts/rotate-secrets.mjs | Secrets Manager automation script for rotating JWT, encryption, and database credentials per environment. | 2024-05-16 |

## Navigation Notes
- For backend-specific updates, refer to `/update_template/backend_updates/` (to be populated as features land).
- UI/UX artefacts live in `/update_template/ui-ux_updates/` and will be updated alongside implementation tasks.
- Legal and governance documents are stored under `/legal` and `/governance`; update summaries will be mirrored in change logs here once drafted.

## Contact Points
- Programme Manager: Coordinates milestones, risks, and reporting cadence.
- DevOps Lead: Owns automation deliverables and observability posture.
- Compliance Lead: Oversees legal artefacts, GDPR tooling, and launch readiness.
