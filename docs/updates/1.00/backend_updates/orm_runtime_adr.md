# ADR 004 — ORM & Runtime Baseline for Version 1.00

## Status
Accepted – 2025-11-07

## Context
- Version 1.00 hardens authentication, telemetry, and database lifecycles that rely on Sequelize models and migrations. The pre-update evaluation highlighted malformed dependency manifests that prevented reproducible installs and blocked planned ORM upgrades.【F:docs/updates/1.00/pre-update_evaluations/dependency_evaluation.md†L4-L28】
- Operational tooling (Sequelize CLI tasks, seed scripts, emergency SQL runners) continues to execute with CommonJS semantics. `dotenv@17` dropped CommonJS support, so legacy automation (`node -r dotenv/config ...`) crashed before loading environment variables.【F:docs/updates/1.00/pre-update_evaluations/dependency_evaluation.md†L17-L24】
- Platform roll-out commitments require deterministic behaviour across blue/green deployments and audit rehearsals; drift between lockfiles and runtime assumptions previously forced manual intervention during staging drills.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L47-L78】

## Decision
- Pin Sequelize to 6.37.7 and `pg`/`pg-hstore` to the Postgres 14-compatible releases we validated during telemetry launch, preventing unreviewed ORM changes from landing via caret updates.
- Downgrade `dotenv` to 16.4.5—the latest dual ESM/CommonJS distribution—and introduce a reusable CommonJS loader (`scripts/register-env.cjs`) that CLI tasks can preload to mirror production env handling.【F:backend-nodejs/scripts/register-env.cjs†L1-L63】
- Lock bcrypt to 5.1.1 LTS to avoid ABI churn from the 6.x beta train while we complete performance profiling for Version 1.00.
- Declare the package manager in `package.json` so CI runners and local environments install using npm 11.4.2, matching the matrix validated in our boot lifecycle tests.【F:backend-nodejs/package.json†L1-L58】
- Document this baseline so any future migration to Prisma or Sequelize v7 must supersede this ADR with explicit rollout steps, telemetry expectations, and data backfill plans.

## Consequences
- CommonJS-based tooling regains reliable environment bootstrapping, enabling scheduled migrations, load tests, and data repair scripts to execute without manual patches.
- Dependency diffs now surface intentionally in code review because caret drift is eliminated for the ORM, driver, and security-sensitive dependencies; automated scanners can flag variance immediately.
- Teams receive a canonical runtime baseline (Node 20.x + npm 11.4.2 + Sequelize 6.37.7) to reference in release runbooks and container images, reducing the number of environment-specific bugs we chase during rehearsals.
- Any proposal to adopt a new ORM must include a follow-up ADR and change plan, avoiding surprise rewrites late in the release cycle.
