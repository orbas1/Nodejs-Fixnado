# Version 1.00 Task List

## 1. Secure Identity, Routing, and Telemetry Foundations — 20%
**Goal:** Close authentication/routing exploits, enforce least-privilege access, and restore telemetry ingestion so other workstreams can validate safely.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L4-L85】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L4-L52】

### Subtasks (0% each)
1. ✅ Replaced the permissive JWT fallback with strict issuer/audience validation, enforced bounded clock tolerance, and delivered structured remediation messaging in the auth middleware.【F:backend-nodejs/src/services/sessionService.js†L8-L168】【F:backend-nodejs/src/middleware/auth.js†L1-L305】【F:docs/updates/1.00/update_progress_tracker.md†L8-L9】
2. ✅ Rebuilt router composition to remove duplicate mounts, keep `/v1` isolated, and wrap finance/serviceman surfaces behind feature flags with launch toggles.【F:backend-nodejs/src/routes/index.js†L1-L174】【F:backend-nodejs/src/middleware/featureToggleMiddleware.js†L1-L147】【F:backend-nodejs/src/config/index.js†L120-L166】
3. Harden CORS, Helmet (CSP/COEP), rate limiter headers, and storefront override controls while eliminating secrets stack-trace logging.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L8-L33】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L8-L28】
4. Implement `/telemetry/client-errors` and `/telemetry/mobile-crashes` handlers with retention, alerting, and correlation IDs; align client reporters to the contracts.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L13-L80】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L66-L109】
5. Publish RBAC/feature flag governance doc covering persona unlock rules, demo flag usage, and telemetry CI guards.【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L10-L74】【F:update_template/features_to_add.md†L210-L266】

### Integration Coverage
- **Backend:** Subtasks 1–4 refactor auth services, routers, middleware, telemetry ingestion, and logging pipelines.
- **Front-end:** Subtasks 3–5 coordinate session client changes, persona gating, and telemetry SDK updates for the web app.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L68-L90】
- **User phone app:** Subtask 4 aligns Flutter diagnostics endpoints and correlation IDs.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L87-L134】
- **Provider phone app:** Covered via governance doc and API contracts to future-proof provider builds even if not present in repo (Subtask 5).【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L104-L114】
- **Database:** Subtask 2’s feature flags guard migrations/table exposure; Subtask 4 stores telemetry payloads with retention policies.
- **API:** Subtasks 1–4 redefine REST contracts, headers, and telemetry endpoints consumed across clients.
- **Logic:** RBAC/feature flag decision matrix (Subtask 5) governs persona routing, timeline rename, and chat enablement.【F:update_template/new_feature_brief.md†L25-L120】
- **Design:** Updated governance doc and telemetry UX messaging supply copy for session remediation and error surfaces (Subtasks 3 & 5).

## 2. Stabilise Platform Lifecycle & Database Safety — 0%
**Goal:** Ensure services boot predictably, migrations are reversible, and financial/communications data meets compliance obligations.【F:docs/updates/1.00/pre-update_evaluations/issue_report.md†L5-L71】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L22-L58】

### Subtasks (0% each)
1. Refactor boot sequence to delay secrets loading/jobs until logging initialises; expose `createServer().start()` for controlled lifecycle and retry-friendly readiness state exports.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L14-L33】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L22-L38】
2. Rewrite readiness/rate limiting to detect PostGIS availability safely, emit structured metrics, and provide `Retry-After` headers plus correlation IDs.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L9-L33】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L24-L40】
3. Break finance/communications migrations into transactional units with soft-delete strategies, audit metadata, uniqueness constraints, deterministic seeds, and retention policies.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L22-L115】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L30-L54】
4. Document and implement data retention/encryption guidelines for JSONB metadata, webhook payloads, and notification targets with structured retry history tables.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L28-L125】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L34-L54】
5. Build deterministic QA seed scripts for communications quick replies, finance references, and zone-aware starter data supporting downstream UX tasks.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L31-L125】【F:update_template/features_to_add.md†L150-L210】

### Integration Coverage
- **Backend:** Subtasks 1–2 reshape lifecycle, logging, rate limiter, and readiness flows relied on by orchestrators.【F:docs/updates/1.00/pre-update_evaluations/issue_report.md†L9-L52】
- **Front-end:** Subtask 5 ensures seeded data populates dashboards/timeline views for UX acceptance testing.【F:update_template/new_feature_brief.md†L45-L150】
- **User phone app:** Seeds/retention policies (Subtasks 3–5) provide deterministic data for mobile parity and offline testing.
- **Provider phone app:** Governance artifacts (Subtask 4) describe webhook retention/notifications needed for provider tooling.
- **Database:** Subtasks 3–5 overhaul migrations, seeds, constraints, and retention enforcement directly.
- **API:** Lifecycle changes (Subtasks 1–2) alter health endpoints; migrations ensure API schemas reliable across deployments.
- **Logic:** Audit metadata and soft-delete strategies (Subtask 3) update business rules for finance/communications flows.
- **Design:** Seeded content and retention messaging (Subtask 5) inform UI copy for dashboards and compliance disclosures.

## 3. Govern Dependencies & Environment Baselines — 0%
**Goal:** Restore deterministic builds, document prerequisites, and embed security/license automation across repos.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L47-L134】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L60-L94】

### Subtasks (0% each)
1. Correct malformed `package.json`/lockfiles, align CommonJS loaders for `dotenv`, and stabilise ORM/runtime selections with documented ADRs.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L47-L78】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L60-L72】
2. Define `engines`/SDK ranges (Node, npm, Flutter, Android/iOS) and enforce lockfile verification plus dependency audits in CI workflows.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L47-L132】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L60-L88】
3. Rationalise geospatial/web dependency stack (MapLibre/Mapbox Draw/Turf) with bundle analysis automation and tree-shaking policies.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L49-L90】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L72-L82】
4. Regenerate Flutter lockfiles, document biometric/native prerequisites, and add CI smoke jobs for mobile builds/tests.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L52-L134】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L80-L94】
5. Integrate license scanning, load-test scripts, and dependency governance docs into release gates and changelog workflow.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L53-L134】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L82-L109】

### Integration Coverage
- **Backend:** Subtasks 1–2 stabilise Node dependencies, runtime baselines, and CI checks for API services.
- **Front-end:** Subtask 3 shrinks bundle risk and ensures compatibility for React 18 upgrades.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L68-L90】
- **User phone app:** Subtask 4 ensures Flutter builds/test gating and documented prerequisites.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L87-L133】
- **Provider phone app:** Governance docs and license scans (Subtask 5) define expectations for future provider builds.
- **Database:** Dependency ADRs (Subtask 1) cover Sequelize/Postgres alignment and migration toolchain compatibility.
- **API:** CI automation (Subtasks 1–2 & 5) verifies telemetry endpoints and contract compatibility before publishing.
- **Logic:** Bundle rationalisation and license policy (Subtasks 3 & 5) ensure feature logic remains maintainable and compliant.
- **Design:** Documented prerequisites inform design/dev workflows and highlight tooling for accessibility audits (Subtask 5).

## 4. Deliver Enterprise Web Experience & Commerce Flows — 0%
**Goal:** Implement the production-grade web UI/UX, timeline/community enhancements, commerce journeys, and legal/documentation deliverables outlined in the feature brief.【F:update_template/new_feature_brief.md†L25-L210】【F:update_template/features_to_add.md†L32-L265】

### Subtasks (0% each)
1. Rebuild session management (`useSession`, persona access, offline fallbacks) to fetch `/api/auth/me`, throttle storage writes, and enforce server-driven persona unlocks with analytics.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L68-L86】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L96-L106】
2. Restructure routing/layout into persona-scoped shells with granular Suspense/error boundaries, contextual loading states, and telemetry instrumentation for route transitions.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L69-L90】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L98-L110】
3. Implement timeline/community modules across feed, post detail, events, messaging, moderation, and ads screens with recommendations, chat integrations, and analytics instrumentation.【F:update_template/new_feature_brief.md†L31-L153】【F:update_template/features_to_add.md†L86-L190】
4. Build the learner performance dashboard suite (progress overview, timeline calendar, achievements, recommendations) plus supporting profile/settings pages with zone-aware widgets and telemetry.【F:update_template/new_feature_brief.md†L137-L170】【F:update_template/features_to_add.md†L128-L182】
5. Build the instructor/merchant dashboards (course management, service/rental/material catalogues, order lifecycle, payout reporting) including storefront, checkout, and support inbox pages.【F:update_template/new_feature_brief.md†L165-L200】【F:update_template/features_to_add.md†L150-L230】
6. Build the admin/compliance dashboards (user governance, finance controls, dispute center, audit logs) alongside policy/legal/knowledge base pages, language selector polish, and changelog/guide refreshes feeding QA documentation.【F:update_template/new_feature_brief.md†L170-L209】【F:update_template/features_to_add.md†L200-L390】

### Integration Coverage
- **Backend:** Subtasks 1–6 require coordinated API contracts (session validation, chat, commerce, analytics, finance, audit logs) and telemetry endpoints that back every dashboard and page rebuild.
- **Front-end:** Subtasks 1–6 rebuild the full React surface, covering timeline/community screens, learner/instructor/admin dashboards, storefront and checkout pages, legal/knowledge base content, and documentation touchpoints.
- **User phone app:** UX/content decisions (Subtasks 3–6) inform parity stories executed in Task 5 to ensure consistent copy, analytics hooks, and commerce flows.【F:update_template/features_to_add.md†L150-L265】
- **Provider phone app:** Instructor/admin dashboard specifications (Subtasks 5–6) define requirements for provider-focused experiences and support future mobile builds.
- **Database:** Commerce/timeline/dashboard features (Subtasks 3–6) rely on deterministic seeds, finance tables, and audit constraints from Task 2; policies require storage/backups.
- **API:** Ads, chat, moderation, dashboard metrics, storefront orders, and support inbox services (Subtasks 3–6) demand new endpoints, sockets, and analytics contracts.
- **Logic:** Persona gating, moderation workflows, recommendation heuristics, zone logic, finance controls, and dispute handling (Subtasks 1–6) encode business rules described in the brief.
- **Design:** All subtasks deliver production polish, component library updates, accessibility, localisation, and documentation assets covering every dashboard, page, and screen.

## 5. Achieve Mobile Parity & Reliability — 0%
**Goal:** Transform the Flutter app into a production-ready companion with secure auth, resilient bootstrap, telemetry, and full feature coverage matching the web experience.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L87-L134】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L116-L145】

### Subtasks (0% each)
1. Implement credentialed login/refresh flows separating demo tokens, surfacing biometric opt-outs, and signalling re-authentication needs.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L87-L100】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L118-L126】
2. Parallelise bootstrap tasks, add guarded plugin initialisation, display responsive splash/loading states, and persist navigation context across crashes.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L88-L104】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L126-L134】
3. Overhaul diagnostics reporter with HTTPS endpoints, accurate build metadata, retry/backoff, redaction, and circuit-breaking HTTP clients.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L89-L113】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L128-L140】
4. Enhance API client resilience (retry/backoff, pagination, streaming decoders) plus offline/zone awareness for commerce and community data flows.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L90-L120】【F:update_template/features_to_add.md†L150-L230】
5. Add integration/golden tests, device matrix automation, and environment switching (runtime picker/remote config) documented for QA workflows.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L92-L134】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L132-L145】

### Integration Coverage
- **Backend:** Subtasks 1–4 depend on secure auth, telemetry, and API stability delivered in Tasks 1–2.
- **Front-end:** Shared design tokens/copy (Subtask 4) align with web for consistent experiences.【F:update_template/features_to_add.md†L150-L265】
- **User phone app:** Primary implementation surface for all subtasks.
- **Provider phone app:** Environment switching, telemetry, and auth separation (Subtasks 1, 3, 5) set precedents for provider builds.
- **Database:** Deterministic seeds and retention (Task 2) support mobile data sync and offline caches.
- **API:** Retry/backoff and pagination (Subtask 4) require explicit backend contract updates and telemetry metrics.
- **Logic:** Role switching, biometric flows, recommendation consumption, and zone logic (Subtasks 1–5) mirror business rules from the feature brief.
- **Design:** Splash/loading states, failure UX, and parity of components (Subtasks 2 & 5) must satisfy enterprise polish expectations.【F:update_template/new_feature_brief.md†L95-L210】

## 6. Observability, QA, Documentation & Launch Readiness — 0%
**Goal:** Provide end-to-end visibility, exhaustive testing, documentation, and release governance to certify Version 1.00 for production.【F:update_template/features_to_add.md†L210-L390】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L147-L188】

### Subtasks (0% each)
1. Deploy unified logging/metrics/tracing stack with dashboards for timeline, chat, commerce, finance, mobile, and infrastructure SLOs plus alert routing.【F:update_template/features_to_add.md†L266-L360】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L147-L166】
2. Execute automated test suites (unit, integration, regression, load, stress, security, accessibility) across backend, frontend, API, database, and Flutter apps; document evidence in the update_tests folder.【F:update_template/features_to_add.md†L270-L360】
3. Run manual QA scripts for dashboards, timeline rename, community chat, service purchase, rentals, material purchase, and zone navigation; capture screenshots/logs for the evidence vault.【F:update_template/features_to_add.md†L300-L368】
4. Publish complete legal documents, knowledge base articles, onboarding guides, deployment scripts, and changelog updates with operator runbooks and rollback plans.【F:update_template/new_feature_brief.md†L153-L209】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L160-L188】
5. Conduct release rehearsals (blue/green, rollback drills, telemetry validation, war room exercises) and compile end-of-update report summarising readiness and residual risks.【F:update_template/features_to_add.md†L330-L390】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L166-L188】

### Integration Coverage
- **Backend:** Observability stack, automated tests, and release rehearsals (Subtasks 1–5) validate API health, migrations, and background jobs.
- **Front-end:** Testing scripts and knowledge base assets (Subtasks 2–4) confirm UX polish, accessibility, and telemetry coverage.
- **User phone app:** Device matrix tests, telemetry dashboards, and release rehearsals (Subtasks 1–3 & 5) ensure mobile readiness.
- **Provider phone app:** Documentation/runbooks (Subtask 4) and observability frameworks (Subtask 1) support future provider deployments.
- **Database:** Load/stress tests and rollback drills (Subtasks 2 & 5) validate migrations, retention, and seeding strategies.
- **API:** Synthetic monitoring and regression suites (Subtasks 1–3) enforce contract stability before launch.
- **Logic:** Manual QA and release checklists (Subtask 3) verify business rules across commerce, timeline, and community flows.
- **Design:** Accessibility audits, knowledge base assets, and documentation (Subtasks 2–4) evidence design quality and localisation readiness.
