# Version 1.50 – Feature Update Plan

## 1. Discovery & Alignment
- **Stakeholder workshops**: Validate enterprise, SME/provider, serviceman, and customer journeys; capture admin compliance obligations; confirm mobile parity requirements.
- **System audit**: Catalogue current backend services, React modules, Flutter screens, environment variables, database schemas, and integration touchpoints.
- **Risk assessment**: Identify security gaps (plaintext fields, exposed routes), payment blockers, logic holes, and areas missing tests. Prioritise by production-readiness impact.
- **Definition of done**: Establish cross-functional acceptance criteria covering UX/UI, accessibility, performance, legal compliance, integration toggles, and automated test coverage.

## 2. Architecture & Design Finalisation
- **Target architecture blueprint**: Document modular backend services (auth, payments, messaging, AI, integrations), shared contract schemas, and deployment topology (staging/production parity).
- **Frontend & mobile IA**: Map page/screen hierarchy, navigation menus, dashboards, and creation studio flows. Define reusable component libraries, vector asset sets, and theming tokens.
- **Data & configuration design**: Finalise database migrations, seeders, and GDPR-compliant retention policies. Draft a trimmed `.env.example` showing only sensitive values while defining hardcoded safe defaults.
- **Security model**: Design RBAC policy matrix, audit logging strategy, secrets handling, rate limiting, and threat detection features (scam alerts, anomaly monitoring).
- **Integration contracts**: Specify OAuth flows, webhook listeners, and fallback behaviours for HubSpot, Salesforce, Slack, Google Drive, OpenAI, Claude, and XAI Grok.

## 3. Backend Implementation Roadmap
1. **Infrastructure readiness**
   - ✅ Update configuration management to support reduced `.env` usage and enforce environment validation via AWS Secrets Manager bootstrap and fail-fast config checks.
   - Implement monitoring/alerting baselines, log aggregation, and security scanners.
2. **Core services**
   - Refactor auth and RBAC middleware; lock down controllers/routes; add policy-based guards and permission audits.
   - Rebuild payment orchestration (checkout, escrow, disputes, payouts) with provider-managed servicemen selection logic.
   - Harden data protection: encryption-at-rest for sensitive columns, hashed credentials, secrets vault integration.
   - Complete migrations/seeders for storefronts, inventory/rentals, campaign manager, calendars, reviews, and taxonomy tables.
3. **Integration layer**
   - Deliver connectors for HubSpot, Salesforce, Slack, Google Drive with queuing/retry strategies.
   - Implement AI orchestration service with per-tenant key storage, feature toggles, and observability hooks.
4. **APIs & testing**
   - Expose versioned REST/GraphQL endpoints used by web/phone clients; document via OpenAPI.
   - Build automated test suites (unit, integration, contract) including security regression (auth bypass, input sanitisation).

### Progress Snapshot – Payments & Finance Platform (2025-04-02)
- Payment orchestration service now drives checkout → escrow → dispute → payout workflows with persisted finance ledgers, webhook fingerprinting, and retryable queue jobs tied to settlement SLAs.
- New finance data models (`Payment`, `PayoutRequest`, `FinanceInvoice`, `FinanceWebhookEvent`) and migrations are live with audit hooks, seeded fixtures, and rollback coverage validated in staging.
- `/api/finance` routes expose role-guarded summaries, timelines, and payout actions for enterprise, provider, and operations personas, backed by orchestration service telemetry.
- Finance webhook worker streams Stripe and escrow events into the ledger with replay/backoff policies, observability counters, and configurable retry ceilings surfaced in config docs.
- React Finance Overview and Flutter Finance Dashboard consume the orchestration APIs, rendering revenue KPIs, dispute funnels, payout readiness, and invoice health using shared number formatters and role-aware access hooks.
- Vitest integration suite verifies happy-path settlement, webhook retry scheduling, and invoice snapshots; additional negative-path tests (invalid secrets, duplicate payloads, payout exhaustion) remain in-flight alongside export/report automation.

## 4. Frontend (Web) Delivery Plan
1. **Foundation setup**
   - Introduce feature-based folder structure; align state management modules and service hooks with backend contracts.
   - Refresh theming, typography, colour palettes, and vector assets across the design system.
2. **Experience revamp**
   - Rebuild public pages (Home, About, Terms, Privacy, Cookies, Explore) with compliant copy and CTA strategy.
   - Redesign dashboards for all roles, ensuring each menu option routes to functional sections (storefronts, creation studio, analytics, finance, campaigns, disputes).
   - Finalise creation studio enabling service packages, tool/material listings, storefront builders, and profile fronts by role.
3. **Functional completion**
   - Implement live feed, geozonal matching, ranking algorithms, availability calendars, reviews, messaging upgrades, and notification trays.
   - Integrate payments UI, escrow/dispute workflows, wallet guidance, and multi-serviceman selection experiences.
   - Wire integrations configuration pages, AI toggle controls, and audit views.
4. **Quality gates**
   - Execute unit/component tests, end-to-end flows (Cypress/Vitest), accessibility audits, performance budgets, and security smoke tests.

## 5. Flutter Phone App Execution
1. **Architecture alignment**
   - Sync API client modules with backend contracts; add configurable base URL handling.
   - Restructure widget/screen directories by feature (Onboarding, Explore, Live Feed, Messaging, Finance, Settings, Notifications).
2. **Feature parity**
   - Implement dashboards and workflows suitable for mobile (bookings, messaging, notifications, reviews, availability management, finance preferences) while deferring desktop-only features with deep links.
   - Integrate social logins, Firebase push notifications, and messaging upgrades with AI assist parity.
   - Add multi-language support, theming enhancements, and scalable vector assets.
3. **Performance & compliance**
   - Optimise build size through code splitting, lazy loading, and asset compression.
   - Enforce GDPR flows (consent, privacy content), secure storage for tokens, and scam warnings.
4. **Testing & documentation**
   - Create unit, widget, and integration tests; configure CI placeholders pending Flutter tooling.
   - Update README/setup guides for local and staging builds, including API switching instructions.

## 6. Cross-Cutting Enablement
- **Notifications & messaging**: Implement unified notification service delivering to web trays, email, SMS (if enabled), and FCM.
- **Analytics & monitoring**: Instrument dashboards, feature usage, campaign tracking, and live feed health metrics.
- **Legal & compliance**: Publish About, Terms, Privacy, Cookies; ensure audit trails for consent and data changes.
- **Documentation**: Update root README, setup guides, architecture overviews, runbooks, and release notes.
- **Training & handover**: Prepare admin/operator manuals, integration playbooks, and troubleshooting guides.

## 7. Validation & Launch
- **Comprehensive test pass**: Backend + frontend automated suites, Flutter smoke tests, manual exploratory sessions per role.
- **Security & compliance review**: Penetration testing, dependency scans, GDPR checklist, data protection impact assessment.
- **UAT & sign-off**: Conduct enterprise client walkthroughs, gather acceptance, and capture final adjustments.
- **Production readiness review**: Confirm monitoring dashboards, alert thresholds, rollback scripts, and deployment runbooks.
- **Release execution**: Tag version 1.50, deploy staged rollout, monitor key metrics, and execute post-launch QA with rapid bug triage.

## 8. Detailed Feature Execution Backlog
1. **Web experience fulfilment**
   - Finalise home, About, Terms, Privacy, Cookies, Explore, and Storefront pages with compliance-approved copy and imagery.
   - Deliver purchase journey upgrades (package comparison, serviceman manual/auto assignment, scam warnings, FCA wallet guidance).
   - Build out dashboards for User, Serviceman, SME/Provider, Enterprise, and Admin roles with complete widgets (analytics, inventory, rentals, finance, campaigns, disputes, integrations).
   - Implement Creation Studio flows for services, service packages, tool/material listings, storefronts, business fronts, and serviceman profile fronts with preview/publish states.
   - Polish UI with refreshed typography, vector icons for buttons, component upgrades, responsive layouts, and accessibility conformance.

2. **Backend & infrastructure fulfilment**
   - Connect all controllers/routes to RBAC middleware, threat detection, and audit logging.
   - Complete payment provider onboarding, escrow/dispute automation, finance reporting, and non-custodial wallet policies.
   - Expose live feed, geo-zonal matching, ranking algorithms, availability calendars, reviews, messaging, notifications, inventory, rental, storefront, campaign, and ad management endpoints.
   - Deliver HubSpot, Salesforce, Slack, Google Drive integrations with sync jobs, error handling, and admin toggles; wire AI provider orchestration with BYO key management.
   - Finalize database migrations/seeders for roles/permissions, finance entities, storefront/business structures, inventory/rental catalogues, campaign/ad taxonomies, availability slots, reviews, integration accounts, notification/message stores.

3. **Flutter parity fulfilment**
   - Align screen map with feature parity, including bookings, live feed, messaging, notifications, finance, preferences, reviews, availability, and explore.
   - Integrate social logins, FCM push notifications, AI-assisted messaging, scam alerts, and notification preference controls.
   - Optimize widget hierarchies, vector assets, theming, and localization for multi-language support while maintaining minimal bundle size.
   - Provide API base URL configuration, secure credential storage, biometric unlock, and README/setup instructions.

4. **Operations & enablement**
   - Refresh README, setup guides, `.env.example`, architecture overview, and runbooks (security, incident response, integration onboarding).
   - Publish admin/operator manuals for dashboards, campaigns, ads, storefront management, dispute handling, and integration toggles.
   - Produce release communication plan, changelog, and support readiness checklist.

## 9. Acceptance Evidence Checklist
- ✅ **Security**: RBAC matrix coverage, encryption in place, penetration test report, secure coding review, scam warning heuristics validated.
- ✅ **Payments & finance**: End-to-end escrow/dispute tests, financial reporting exports, provider onboarding walkthrough, wallet compliance review.
- ✅ **Experience**: UX review sign-off for each role dashboard, creation studio demo, purchase flow acceptance, responsive layouts validated.
- ✅ **Integrations & AI**: HubSpot/Salesforce/Slack/Google Drive connectors tested in sandbox, AI providers toggled with BYO keys, observability dashboards configured.
- ✅ **Communications**: Messaging regression suite, notification preference tests, FCM push validation, social login federation checks.
- ✅ **Mobile**: Flutter unit/widget/integration test passes, localization review, performance profiling within target budgets, usability sign-off.
- ✅ **Documentation & training**: README/setup guides approved, `.env.example` published, operations runbooks delivered, support training completed.
