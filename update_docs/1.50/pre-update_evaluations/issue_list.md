# Consolidated Issue List

1. Backend lacks APIs and feature flags for compliance workflows, dispute escalation, and regional marketplace configuration.
2. Backend routing aggregates every domain under `/api` without versioning and `src/server.js` launches background jobs without graceful shutdown, risking downtime during deploys.
3. Analytics ingestion job cannot parse the upcoming telemetry schema, still depends on global `fetch`, and drops enriched events silently.
4. Stripe and escrow webhooks execute synchronously without queues, breaching provider SLAs under load.
5. Secrets management relies on ad-hoc `.env` files with default credentials lingering in `src/config/index.js` and no vault-backed rotation policy.
6. Node services, frontend clients, and Flutter app depend on outdated core packages and inconsistent runtime versions.
7. Monorepo build tooling mixes npm/pnpm/yarn usage with no unified workspace strategy or dependency caching, leaving multiple drifting lockfiles.
8. Database schema is single-region only, lacking `region_id` fields, partitioning, and compliance-ready audit trails.
9. ORM models in `backend-nodejs/src/models/index.js` omit regional associations and cascade policies, complicating future migrations.
10. Down migrations are not reversible, causing rollback failures and inconsistent QA databases.
11. Sensitive PII remains unencrypted in the database and in application logs, violating enterprise security expectations.
12. React frontend ships placeholders for regional catalogues and compliance dashboards with no backend integration or analytics instrumentation.
13. `src/App.jsx` duplicates key routes, lacks a catch-all fallback, and leads to inconsistent access control and blank pages for stale URLs.
14. Feature toggles evaluated in `src/providers/FeatureToggleProvider.jsx` rely on `Math.random()` cohorts, so users flip between treatments during the same session.
15. Frontend accessibility, responsiveness, and error handling fall short of WCAG and usability standards for enterprise rollouts.
16. Mobile app misses 1.50 feature parity (regional filters, compliance badges), and push notifications are not wired to the backend.
17. Flutter app crashes on Android 14 due to outdated analytics/notification dependencies and lacks crash reporting.
18. `lib/app/bootstrap.dart` seeds demo access tokens and enables verbose provider logging in release builds, leaking credentials into logs.
19. Mobile and web clients store authentication tokens insecurely (`localStorage` and shared preferences) with no revocation strategy.
20. Cross-platform analytics schemas, design tokens, and localisation assets are inconsistent, threatening roadmap alignment and reporting accuracy.
21. Infrastructure automation (Terraform/Ansible) lacks pinned provider versions, IaC for cron/queues, and multi-region bootstrap support.
22. Observability is fragmented—no structured logging, no Core Web Vitals reporting, no Crashlytics/Sentry—impeding rapid incident response.
23. Compliance and security documentation, runbooks, and SLAs remain aligned to version 1.00 and do not cover upcoming regional expansion.
24. Backend entrypoint in `backend-nodejs/src/app.js` exposes all routes with unlimited payload sizes and permissive `cors()` defaults, leaving the platform open to brute-force and cross-origin abuse.
25. `backend-nodejs/sql/install.sql` still provisions a MySQL database and `change_me` credentials, creating dialect drift and normalising predictable secrets in local environments.
26. React shell in `frontend-reactjs/src/main.jsx` lacks a global error boundary/hydration guard and caches raw feature toggle payloads in sessionStorage, so a single lazy failure blanks the app and leaked scripts can enumerate unreleased features.
