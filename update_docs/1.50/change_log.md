# Version 1.50 Update Change Log

## 2025-02-20 – API Gateway Hardening Baseline
- Introduced environment-driven request limiting, trusted proxy support, and consented origin enforcement for the Fixnado API gateway to close subtask 4 of the Security & Secrets Hardening epic.
- Added `/healthz` diagnostics returning uptime, timestamp, and database latency to support load balancers and observability monitors.
- Documented the operational parameters across backend, environment, and release artefacts to keep the milestone trackers aligned with the implemented gateway protections.

## 2025-02-21 – PII Encryption & Secrets Governance
- Completed subtask 5 by migrating user and company PII to encrypted columns with hashed lookup indices and fail-fast startup validation when keys are absent.
- Delivered supporting migration, shared crypto utility, and regression tests confirming deterministic lookups and decrypted reads remain intact.
- Updated security, database, documentation, and design trackers to reflect the new privacy posture and consent surface specifications.

## 2025-02-27 – RBAC Enforcement, Secure Sessions & Consent Logging
- Finalised the RBAC matrix for consumers, servicemen, providers, enterprise operators, and platform administrators, introducing permission sets, middleware guards, and auditable access events across the API.
- Rebuilt session handling with signed httpOnly cookies, refresh token rotation, and AWS Secrets Manager integration for JWT, database, and admin tokens while replacing the legacy MySQL bootstrap with a secure PostgreSQL script.
- Delivered audit, consent, and scam detection pipelines including database migrations, models, and service hooks so live feed posts, bids, and messages receive risk scores and consent banners persist compliance evidence.
- Added consent APIs and middleware instrumentation enabling the frontend to record banner decisions, retrieve history, and expose privacy UX updates tracked within the design logs.

## 2025-03-01 – Secrets Vault Integration & Compliance Regression Suites
- Introduced a dedicated secrets vault service that hydrates JWT signing keys, admin break-glass tokens, and database credentials from AWS Secrets Manager with rotation-aware caching for the hardened auth stack.
- Updated the authentication controller to source signing material through the vault helper, ensuring cookie rotation and admin login flows inherit vaulted secrets while maintaining compatibility with session token rotation.
- Authored Vitest coverage for session token rotation, consent event persistence, and the security hardening migration rollback path alongside vault access unit tests, providing regression evidence for the new compliance tables.
- Captured backend regression attempts in the tracker: full-suite execution now fails at legacy panel service parsing, while the targeted vault/consent suites pass pending remediation of the pre-existing module debt.

## Historical Reference
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
