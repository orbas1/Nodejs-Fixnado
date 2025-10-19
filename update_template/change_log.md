# Version 1.10 Update Change Log

- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.

## Version 1.00 Planning Updates (2024-05-09)
- Published programme charter, milestone list, task backlog, and progress tracker to initiate Version 1.00 mobilisation.
- Registered new risks (Chatwoot credentials, payment provider contract) and decision log entry for automation stack selection.

## Version 1.00 Automation Updates (2024-05-16)
- Delivered Terraform-based GitHub Actions workflow with environment-aware backend configuration and artefact publishing.
- Extended infrastructure modules with AWS CodeDeploy blue/green topology, validation listener, and CodeDeploy failure alarms.
- Added Secrets Manager rotation CLI (`scripts/rotate-secrets.mjs`) and blue/green deployment runbook for operational readiness.
