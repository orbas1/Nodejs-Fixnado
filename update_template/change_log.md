# Version 1.10 Update Change Log

- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.

## Version 1.00 Planning Updates (2024-05-09)
- Published programme charter, milestone list, task backlog, and progress tracker to initiate Version 1.00 mobilisation.
- Registered new risks (Chatwoot credentials, payment provider contract) and decision log entry for automation stack selection.

## Version 1.00 Automation Updates (2024-05-16)
- Delivered Terraform-based GitHub Actions workflow with environment-aware backend configuration and artefact publishing.
- Extended infrastructure modules with AWS CodeDeploy blue/green topology, validation listener, and CodeDeploy failure alarms.
- Added Secrets Manager rotation CLI (`scripts/rotate-secrets.mjs`) and blue/green deployment runbook for operational readiness.

## Version 1.00 Data Foundation Updates (2024-05-20)
- Introduced marketplace taxonomy domain/node/facet schema with referential assignments for services, rentals, and materials.
- Seeded production-grade taxonomy datasets and default facet values with deterministic UUIDv5 identifiers and SHA-256 checksums.
- Shipped `backend-nodejs/scripts/taxonomy-integrity.mjs` to verify deployed data and emit rollback SQL for rehearsals.
- Updated trackers and risk logs to monitor nightly taxonomy checksum verification ahead of timeline hub delivery.

## Version 1.00 Timeline Hub & Support Updates (2024-05-23)
- Delivered `timelineHubService` aggregating moderation audits, custom job feed, marketplace inventory, ad placements, and Chatwoot readiness into a single API snapshot.
- Added moderation queue API with SLA breach detection, status transitions, and note capture surfaced under new timeline hub routes.
- Integrated Chatwoot session bootstrap service with audit logging and hardened timeout handling to unblock support workflows.
- Registered new route policies for timeline hub access, moderation, and support sessions; progress tracker updated to reflect UT-004 completion.

## Version 1.00 Commerce Engine & Persona Dashboards (2024-05-27)
- Implemented `commerceEngineService` plus `/v1/commerce` endpoints to surface consolidated payments, escrow, invoice, wallet, and order analytics tailored to persona dashboards.
- Added commerce dashboard controller, route policies, and Vitest suite validating alerts, settlement insights, and currency conversion logic.
- Updated backend documentation, changelog, and trackers to record UT-005 completion and unlock downstream compliance milestone.
