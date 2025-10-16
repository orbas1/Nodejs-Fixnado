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

## 2025-03-28 – Compliance & Data Governance Portal Launch
- Executed the compliance migration introducing the `regions` catalogue, GDPR request ledger, finance/message/storefront history tables, and automated retention scheduler alongside updated Sequelize models and associations.
- Delivered guarded `/api/compliance/data-requests` endpoints, orchestration service, and export/delete automation with RBAC coverage, sanitised audit payloads, and retention-aware storage paths.
- Shipped the React compliance portal experience with submission, filter, export, and status workflows plus Riverpod-powered Flutter Data Requests screen and profile navigation card built on shared compliance tokens and copy.

## 2025-03-30 – Warehouse CDC Exports & Credential Rotation
- Added a production-grade `WarehouseExportRun` schema, Sequelize model, and scheduler-backed service that stream data subject, finance, and communications datasets to compressed NDJSON bundles under role-scoped directories.
- Introduced `/api/compliance/data-warehouse/runs` endpoints, RBAC policies, and React/Flutter operator consoles that allow dataset/region filtering, manual triggers, and audit visibility for warehouse jobs.
- Enabled automated database credential rotation via AWS Secrets Manager with TLS enforcement, post-rotation pool refresh, and Secrets Manager metadata updates, increasing compliance task readiness and security posture.

## 2025-04-01 – Finance Orchestration Foundations
- Delivered Payments Task 3 foundations by introducing `payments`, `payout_requests`, `finance_invoices`, and `finance_webhook_events` schemas with Sequelize models, migrations, and RBAC-protected `/api/finance` controllers for checkout, overview, and timeline access.
- Implemented queue-backed webhook processing with configurable retry budgets, payout scheduling, finance history logging, and new route policies while wiring a background job to stream Stripe and escrow lifecycle events into the orchestration service.
- Shipped a React finance control centre featuring revenue cards, payout readiness, invoice health, disputes, and timeline drill-downs powered by a typed finance API client and shared number formatter utilities.
- Added a Flutter finance dashboard surface, Riverpod providers, and repository integration so provider, enterprise, operations, and admin roles can review finance metrics, payout queues, and dispute telemetry from the mobile shell.

## 2025-04-02 – Finance Evidence & Tracker Alignment
- Raised Task 3 readiness metrics and milestone checkpoints after staging replay fixtures, webhook monitors, and finance dashboard walkthroughs demonstrated stable checkout→payout orchestration across backend, React, and Flutter clients.
- Documented finance platform progress inside the Update Plan, Features Update Plan, and milestone/task trackers so downstream squads have accurate references for export/report automation, negative-path testing, and regulatory alert work.
- Captured outstanding deliverables—finance exports, SLA alert fan-out, failure-mode regression suites—in tracker notes to guide the remaining Payments Tiger Team scope.

## 2025-04-04 – Finance Reporting & Alert Automation
- Added finance reporting APIs delivering JSON and CSV exports with currency breakdowns, payout backlog telemetry, top service analytics, and dispute ratios while extending policy enforcement, audit trail coverage, and Vitest suites for the `/api/finance/reports/daily` and `/api/finance/alerts` endpoints.
- Upgraded the React finance control centre with regulatory alert cards, currency performance tiles, CSV export tooling, and payout backlog insights plus refactored the finance client to support streaming CSV downloads and alert retrieval.
- Extended the Flutter finance dashboard with Riverpod providers for reports and alerts, new mobile cards visualising currency exposure, timeline trends, backlog metrics, and regulatory warnings so operations roles maintain parity on mobile.
- Updated change, task, and progress trackers to capture the new reporting deliverables and raised Task 3 readiness scores to reflect end-to-end finance observability now exercised through automated backend tests and frontend/mobile integrations.

## 2025-04-05 – Finance Reporting Hardening & UI Performance
- Enforced dashboard export ceilings inside `generateFinanceReport` and expanded Vitest coverage to include invalid date-range handling plus zero-data alert responses, ensuring CSV/JSON outputs gracefully respect configuration limits.
- Added jsdom tests for the React finance timeline and regulatory alert cards while memoising heavy render paths and constraining list sizes to keep the reporting hub responsive for large datasets.
- Refactored the Flutter finance dashboard currency grid with responsive cards, pending-balance insights, and denser timeline previews so handset screens render without chip overflow while preserving parity with web reporting widgets.

## 2025-04-06 – Experience & Navigation Overhaul Kickoff
- Shipped the production-ready global navigation overhaul featuring a mega menu backed by role-aware dashboard links, refreshed footer IA, and responsive notification trays for desktop and mobile layouts.
- Refactored the React header to consume a centralised navigation config, added accessible mobile drawer navigation, and aligned translation catalogues with the new solutions/resources hierarchy.
- Delivered a Flutter workspaces hub screen and updated bottom navigation to surface dashboard switching, ensuring parity with the new web experience and reinforcing RBAC-driven role transitions across platforms.

## 2025-04-07 – API Versioning & Operational Readiness
- Wrapped the Express router in a `/api/v1` namespace while maintaining backwards-compatible `/api` fallbacks, unlocking contract versioning without breaking existing clients and aligning with the security milestone’s gateway roadmap.
- Added a production `/readyz` endpoint backed by component-level readiness telemetry (database, background jobs, HTTP server) so load balancers, deployment tooling, and observability stacks can distinguish startup vs. steady-state health.
- Implemented graceful shutdown orchestration that drains background jobs, closes HTTP listeners, and terminates Sequelize pools on `SIGINT`/`SIGTERM`/failure signals, enabling zero-downtime deploys and eliminating leaked timers called out in the pre-update evaluation.

## 2025-04-08 – GDPR Metrics & SLA Visibility Rollout
- Enhanced the data governance service with percentile completion telemetry, backlog segmentation, SLA due-date calculations, and a `/api/compliance/data-requests/metrics` controller so operations teams can track GDPR response health in real time.
- Surfaced the new metrics across the React compliance portal via dashboard tiles, advanced filters, due-date columns, and Vitest coverage that exercises refresh/filters behaviour alongside the metrics client.
- Updated the Flutter data governance repository, Riverpod controller, and screen to ingest the metrics payload, render KPI banners, and expose due-at indicators with widget/unit coverage validating overdue detection and repository error handling.
- Captured the service, API, UI, and mobile upgrades across backend/frontend/mobile/design change logs, trackers, and milestone artefacts to close the Compliance & Data Governance milestone at production readiness.

## Historical Reference
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.

## 2025-04-12 – Shell Resilience & Crash Diagnostics
- Wrapped the React application shell in production-grade error boundaries with telemetry-backed fallbacks, full-screen 404 page, and locale-aware messaging so routing failures surface recovery guidance while streaming correlation IDs to observability.
- Delivered Flutter fatal error boundary and diagnostics reporter wiring restart loops, HTTP client disposal, and structured crash payloads into the telemetry endpoint to stabilise mobile parity while equipping SRE with actionable data.
- Updated cross-functional trackers, design artefacts, and UX documentation to capture new resilience flows, restart copy, and telemetry requirements for both web and mobile shells.