# Version 1.50 Update Change Log

## 2025-02-20 – API Gateway Hardening Baseline
- Introduced environment-driven request limiting, trusted proxy support, and consented origin enforcement for the Fixnado API gateway to close subtask 4 of the Security & Secrets Hardening epic.
- Added `/healthz` diagnostics returning uptime, timestamp, and database latency to support load balancers and observability monitors.
- Documented the operational parameters across backend, environment, and release artefacts to keep the milestone trackers aligned with the implemented gateway protections.

## 2025-02-21 – PII Encryption & Secrets Governance
- Completed subtask 5 by migrating user and company PII to encrypted columns with hashed lookup indices and fail-fast startup validation when keys are absent.
- Delivered supporting migration, shared crypto utility, and regression tests confirming deterministic lookups and decrypted reads remain intact.
- Updated security, database, documentation, and design trackers to reflect the new privacy posture and consent surface specifications.

## 2025-03-12 – Provider Panel Service Restoration
- Rebuilt `panelService` with production-ready company resolution, RBAC-aware access checks, and trust/review scoring pipelines to recover from the conflicted file and unblock Security & Secrets Hardening Task 1.
- Normalised provider dashboards to surface real inventory, booking, rental, and marketplace analytics; integrates cached platform commission rates to keep savings messaging aligned with monetisation strategy.
- Restored lint cleanliness for the backend workspace (69 errors cleared) and recorded new automation baselines in the task tracker for continued security milestone delivery.

## 2025-03-17 – Session Integrity & Mobile Vaulting
- Completed Security & Secrets Hardening subtask 6 by issuing JWT access tokens alongside httpOnly/secure cookies for browser clients while persisting refresh sessions through the audited `user_sessions` table.
- Delivered a hardened Flutter secure-storage vault with biometric unlock orchestration, refreshed Riverpod session controller, and end-to-end auth API client capable of login/refresh/logout flows.
- Added Vitest coverage for the session service to assert refresh rotation, cookie hygiene, and token extraction, raising the security readiness and test evidence tracked for Task 1.

## 2025-03-18 – Consent Ledger & Scam Detection Rollout
- Landed Security & Secrets Hardening subtasks 7–8 by introducing the consent ledger migration/model, policy catalogue, and REST API powering both the React consent banner and Flutter legal overlay.
- Refreshed legal copy (terms/privacy) and front-end providers/hooks to persist consent subjects, enforce required agreements, and expose verification utilities for downstream routes.
- Implemented scam detection heuristics with AI enrichment hooks, Opsgenie escalations, and booking metadata annotations; `bookingService` now persists risk telemetry without blocking fulfilment.
- Authored Vitest coverage for consent and scam detection services plus documented lint/test runs across backend, frontend, and Flutter deliverables to evidence the rollout.

## 2025-03-21 – RBAC Matrix Finalisation & Policy Telemetry
- Finalised the RBAC policy matrix for guest, customer, serviceman, provider, enterprise, operations, and admin cohorts with inheritance-aware permissions covering finance, compliance, integrations, and storefront scopes.
- Refactored `accessControlService` to compose permissions from the matrix definition, expose role descriptors for audit/reporting, and extend policy coverage to new finance/compliance permissions.
- Added dedicated Vitest coverage to validate hierarchical permission grants, canonical role resolution, and exported metadata, supplying evidence for Security & Secrets Hardening subtask 1 and downstream IA work.
- Updated change trackers, design artefacts, and milestone progress indicators to reflect the completed RBAC deliverable and unblock dependent compliance, payments, and navigation initiatives.

## 2025-03-24 – Policy Middleware & Security Audit Pipeline
- Delivered the per-route policy registry and `enforcePolicy` middleware, replacing ad-hoc guards with RBAC-driven enforcement across feed, admin, inventory, panel, zone, materials, and service controllers.
- Extended the security audit trail service with webhook dispatch, sampling, metadata sanitisation, and configurable redact lists, introducing new environment variables for production tuning.
- Added Vitest coverage for policy allow/deny paths, refreshed `.env.example`, and updated change logs, trackers, and design artefacts to capture the hardened access workflow and audit surfaces supporting Task 1 subtask 2.

## 2025-03-25 – Vault-Backed Secrets & Postgres Provisioning
- Completed Security & Secrets Hardening subtask 3 by introducing an AWS Secrets Manager loader that hydrates configuration at startup, records sync metadata, and blocks boot when critical vault values are missing.
- Updated runtime configuration to depend on vault-sourced credentials (JWT secret, database password) while surfacing sync telemetry during server initialisation and exposing metadata to downstream diagnostics.
- Replaced the legacy MySQL bootstrap file with a Postgres provisioning script that prompts for strong credentials, revokes default privileges, grants least-privilege access to the application role, and installs required extensions (pgcrypto, uuid-ossp, PostGIS).

## Historical Reference
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
