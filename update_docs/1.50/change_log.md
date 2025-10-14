# Version 1.50 Update Change Log

## 2025-02-20 – API Gateway Hardening Baseline
- Introduced environment-driven request limiting, trusted proxy support, and consented origin enforcement for the Fixnado API gateway to close subtask 4 of the Security & Secrets Hardening epic.
- Added `/healthz` diagnostics returning uptime, timestamp, and database latency to support load balancers and observability monitors.
- Documented the operational parameters across backend, environment, and release artefacts to keep the milestone trackers aligned with the implemented gateway protections.

## 2025-02-21 – PII Encryption & Secrets Governance
- Completed subtask 5 by migrating user and company PII to encrypted columns with hashed lookup indices and fail-fast startup validation when keys are absent.
- Delivered supporting migration, shared crypto utility, and regression tests confirming deterministic lookups and decrypted reads remain intact.
- Updated security, database, documentation, and design trackers to reflect the new privacy posture and consent surface specifications.

## Historical Reference
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
