# Version 1.00 Task List

## Task 1 – Secure Deployment Foundations — 0%
Establish automated deployments, configuration baselines, observability, and rollback rehearsals before feature development.

### Subtask 1.1 – Provisioning & Deployment Automation — 0%
- **Backend:** Build bash scripts/UI to provision Node services, apply schema migrations, seed starter data, and configure sockets.
- **Front-end:** Automate React build/deploy with environment toggles for timeline rename, ads, and Chatwoot widgets.
- **User phone app:** Generate Flutter build pipelines with environment switching for QA/live and integrate config fetch.
- **Provider phone app:** Extend pipelines to provider-specific flavours, enabling service/rental/material modules during deploy.
- **Database:** Script transactional migrations, seeding of services/rentals/materials/zones/tags with validation checkpoints.
- **API:** Expose deployment health endpoints and smoke tests verifying version compatibility.
- **Logic:** Document provisioning flow, environment prerequisites, and rollback scenarios.
- **Design:** Provide deployment UI wireframes/status dashboards for operations visibility.

### Subtask 1.2 – Configuration & Secrets Governance — 0%
- **Backend:** Centralise `.env` templates, secrets storage, and config modules for integrations (payments, storage, Chatwoot).
- **Front-end:** Inject config guards for ad/recommendation toggles and language dropdown updates.
- **User phone app:** Support remote config for API hosts, feature flags, and environment credentials.
- **Provider phone app:** Mirror remote config with provider-only toggles (inventory, crew hubs).
- **Database:** Store encrypted credentials, rotate seeds, and audit connection usage.
- **API:** Implement configuration validation endpoints and error reporting when secrets missing.
- **Logic:** Maintain configuration matrix and onboarding checklist.
- **Design:** Create configuration documentation diagrams illustrating stack dependencies.

### Subtask 1.3 – Observability & Load Preparedness — 0%
- **Backend:** Implement uptime helper agents, load balancer metrics, RAM/CPU profiling, and log aggregation.
- **Front-end:** Emit performance telemetry, resource loading metrics, and timeline/ad impressions.
- **User phone app:** Add diagnostics module reporting crashes, network latency, and timeline/support performance.
- **Provider phone app:** Capture provider-specific telemetry (inventory sync, crew scheduling) with thresholds.
- **Database:** Monitor replication lag, query performance, and migration health.
- **API:** Publish metrics endpoints (Prometheus/OpenTelemetry) for deployment dashboards.
- **Logic:** Define alert thresholds, escalation paths, and stress/load test schedules.
- **Design:** Produce observability dashboard mockups for operations teams.

### Subtask 1.4 – Rollback & Release Rehearsals — 0%
- **Backend:** Script blue/green cutovers and rollback automation with data snapshotting.
- **Front-end:** Enable feature flag rollback for timeline rename, ads, and each timeline hub feed (Timeline, Custom Job Feed, Marketplace Feed).
- **User phone app:** Prepare staged rollout plans with version gating and hotfix process.
- **Provider phone app:** Coordinate provider-specific release notes and staged deploy toggles.
- **Database:** Validate snapshot/restore, point-in-time recovery, and seeder replays.
- **API:** Automate smoke/regression checks post-rollback.
- **Logic:** Document rehearsal checklist, war room schedule, and go/no-go criteria.
- **Design:** Provide communication templates for release status dashboards and stakeholder updates.

## Task 2 – Enforce Security & Compliance — 0%
Deliver consistent RBAC, content safety, GDPR tooling, and legal artefacts.

### Subtask 2.1 – RBAC & Access Hardening — 0%
- **Backend:** Refactor auth middleware, remove learner/instructor remnants, and align permissions to marketplace personas.
- **Front-end:** Guard routes/components for timeline, dashboards, and support modules.
- **User phone app:** Enforce role changer gating and secure navigation states.
- **Provider phone app:** Restrict crew, inventory, and finance screens by role/permission.
- **Database:** Audit role tables, ensure least privilege, and log privileged operations.
- **API:** Implement scope checks on REST/WebSocket endpoints.
- **Logic:** Update RBAC matrix and penetration test plan.
- **Design:** Produce permission diagrams and UI states for forbidden access.

### Subtask 2.2 – Content Safety & Upload Protection — 0%
- **Backend:** Integrate upload checker, antivirus scanning, and spam/bad-word detection pipelines.
- **Front-end:** Add client-side validation, progress states, and error handling for uploads.
- **User phone app:** Implement mobile upload guardrails, size limits, and retry flows.
- **Provider phone app:** Support bulk asset uploads with moderation queues.
- **Database:** Store scan results, quarantine references, and audit metadata.
- **API:** Expose moderation/report endpoints with status transitions.
- **Logic:** Define escalation workflows and SLA policies.
- **Design:** Provide moderation UI mockups (report buttons, review queues).

### Subtask 2.3 – GDPR & Audit Tooling — 0%
- **Backend:** Implement consent tracking, data retention policies, and subject access export/delete endpoints.
- **Front-end:** Surface privacy prompts, consent updates, and data request forms.
- **User phone app:** Mirror consent and request experiences with native notifications.
- **Provider phone app:** Provide GDPR controls for business accounts and crew data.
- **Database:** Configure retention jobs, anonymisation routines, and audit logging tables.
- **API:** Secure GDPR endpoints with multi-factor workflows and logging.
- **Logic:** Draft compliance playbooks and incident response procedures.
- **Design:** Create privacy dashboard mockups and confirmation flows.

### Subtask 2.4 – Legal Documentation & Acknowledgements — 0%
- **Backend:** Store versioned legal docs, acceptance records, and link to onboarding/checkout flows.
- **Front-end:** Publish Terms, Privacy, Refund, Community Guidelines, About, FAQ pages with analytics and breadcrumbs.
- **User phone app:** Display legal pages and acceptance prompts within mobile onboarding/settings.
- **Provider phone app:** Provide legal acknowledgement history and policy updates within business dashboards.
- **Database:** Version legal content, track acknowledgements per user, and maintain retention.
- **API:** Serve legal content endpoints and webhook notifications for updates.
- **Logic:** Coordinate legal reviews and word count targets.
- **Design:** Deliver page layouts ensuring enterprise styling and readability.

## Task 3 – Complete Marketplace & Intelligence Services — 0%
Build backend services for timeline, communications, commerce, and lightweight intelligence.

### Subtask 3.1 – Timeline Rename & Service Layer — 0%
- **Backend:** Rename models/events to timeline, add ads/recommendation slots, follow/unfollow, reporting, moderation APIs.
- **Front-end:** Update terminology, analytics events, and timeline UI hooks.
- **User phone app:** Synchronise timeline screens with rename, interactions, and socket updates.
- **Provider phone app:** Provide provider timeline analytics and ad placement management.
- **Database:** Update schema references, indexes, and analytics tables.
- **API:** Version endpoints, maintain backwards compatibility, and document changes.
- **Logic:** Refresh copy, acceptance criteria, and telemetry mapping.
- **Design:** Provide responsive timeline layouts with ad/recommendation placements.

### Subtask 3.2 – Timeline Hub Orchestration — 0%
- **Backend:** Provide orchestration services that segment content into Timeline, Custom Job Feed, and Marketplace Feed streams with prioritisation rules, moderation hooks, and analytics counters.
- **Front-end:** Build tabbed timeline hub navigation, saved filters, urgency badges, ad/recommendation slots, and moderation tooling aligned to each feed.
- **User phone app:** Deliver mobile timeline hub parity with offline caching, push notifications for urgent custom jobs, and media handling tuned per feed.
- **Provider phone app:** Surface feed analytics, sponsorship placements, and quick actions to respond to high-value custom jobs or marketplace alerts.
- **Database:** Model feed routing tables, scoring metadata, moderation queues, and analytics aggregates for timeline hub usage.
- **API:** Expose feed-specific endpoints, WebSocket channels, and notification triggers with versioned documentation.
- **Logic:** Capture acceptance criteria for prioritisation, analytics, and escalation workflows spanning all feeds.
- **Design:** Produce enterprise-grade wireframes for tabbed timeline hubs, urgency indicators, and feed configuration panels.

### Subtask 3.3 – Commerce, Finance & Inventory Services — 0%
- **Backend:** Implement services/rentals/materials CRUD, checkout, escrow, wallet, payments, refunds, tax, and finance analytics.
- **Front-end:** Integrate explorer, storefront, business front, checkout flows, and metrics widgets.
- **User phone app:** Provide purchases, rentals, inventory browsing, wallet, and order tracking experiences.
- **Provider phone app:** Support catalog management, roster scheduling, finance dashboards, and crew tools.
- **Database:** Model orders, invoices, escrow accounts, tax tables, and inventory states.
- **API:** Secure payment integrations, reconciliation endpoints, and webhook handling.
- **Logic:** Define financial workflows, reconciliation scripts, and audit requirements.
- **Design:** Deliver checkout, storefront, and dashboard component designs.

### Subtask 3.4 – Matching & Recommendation Intelligence — 0%
- **Backend:** Implement deterministic/tag-based recommenders, pricing matchers, spam classifiers, and explainability metadata.
- **Front-end:** Display recommendation cards, explanation badges, and matching filters.
- **User phone app:** Surface personalised suggestions and explainability on mobile modules.
- **Provider phone app:** Provide recommendation insights for campaign tuning.
- **Database:** Store taxonomy weights, scoring results, and evaluation metrics.
- **API:** Offer intelligence endpoints with health checks and circuit breakers.
- **Logic:** Document tuning parameters, evaluation plans, and fallback logic.
- **Design:** Visualise recommendation placements and explanation components.

### Subtask 3.5 – Integration Enablement — 0%
- **Backend:** Configure adapters for Hubspot, Salesforce, Google, SMTP, Firebase, Cloudflare R2/Wasabi/local storage, OAuth providers, Chatwoot, payments.
- **Front-end:** Wire integrations for analytics, support widgets, and storage endpoints.
- **User phone app:** Connect Firebase messaging/analytics and storage uploads.
- **Provider phone app:** Enable CRM sync, analytics exports, and storage usage for providers.
- **Database:** Store integration credentials securely with rotation policies.
- **API:** Implement retry strategies, circuit breakers, and fallback modes when integrations degrade.
- **Logic:** Maintain integration runbooks and failure handling procedures.
- **Design:** Document integration status indicators and admin settings UI.

## Task 4 – Deliver Web Experience Overhaul — 0%
Create enterprise-grade web UX covering the timeline hub, commerce, dashboards, and policies.

### Subtask 4.1 – Design System & Layout Cleanup — 0%
- **Backend:** Support design token distribution and asset versioning.
- **Front-end:** Build responsive component library, eliminate text wrapping, streamline copy to 1–2 word labels.
- **User phone app:** Align design tokens for cross-platform consistency.
- **Provider phone app:** Ensure shared tokens cover provider dashboards.
- **Database:** Host CMS-like references for styling metadata if required.
- **API:** Provide configuration endpoints for design experiments.
- **Logic:** Document design standards, accessibility rules, and experimentation guardrails.
- **Design:** Produce style guides, grid systems, and component specs.

### Subtask 4.2 – Timeline Hub Interfaces — 0%
- **Backend:** Ensure APIs deliver moderation flags, ad slots, urgency scoring, and feed analytics for UI.
- **Front-end:** Implement the tabbed timeline hub with ads/recommendations, reporting, follow/unfollow, moderation tools, responsive media, and saved filters.
- **User phone app:** Mirror UI patterns for mobile timeline hub, including tab navigation, urgency badges, and notifications.
- **Provider phone app:** Provide feed analytics overlays and quick responses to marketplace/custom job signals.
- **Database:** Optimise queries for feed pagination, prioritisation, and analytics across all three feeds.
- **API:** Support GraphQL/OpenAPI docs for timeline hub operations and WebSocket channels.
- **Logic:** Validate acceptance criteria, analytics tracking plans, and moderation SLAs for each feed.
- **Design:** Finalise wireframes and prototypes for tabbed timeline hub screens and configuration panels.

### Subtask 4.3 – Marketplace Pages & Checkout — 0%
- **Backend:** Serve explorer, storefront, business front, tool/material/service viewers, and checkout data.
- **Front-end:** Build pages with CRUD interactivity, ads/recommendations, zone filters, and responsive layouts.
- **User phone app:** Align mobile marketplace navigation for parity.
- **Provider phone app:** Deliver management panels for inventory, deals, and availability.
- **Database:** Ensure indexing for search filters and availability queries.
- **API:** Provide analytics events for conversions, drop-offs, and pricing experiments.
- **Logic:** Define funnel tracking, SLA metrics, and error handling flows.
- **Design:** Craft enterprise storefront, checkout, and wizard designs.

### Subtask 4.4 – Dashboard Implementation — 0%
- **Backend:** Aggregate metrics for user, serviceman, crew, provider, enterprise, admin dashboards (finance, escrow, tax, pipeline, roster, hub, settings).
- **Front-end:** Develop modular dashboard widgets with CRUD operations and analytics overlays.
- **User phone app:** Align dashboards for user personas on mobile.
- **Provider phone app:** Provide provider, crew, enterprise, admin mobile dashboards with finance controls.
- **Database:** Optimise reporting tables and caching strategies.
- **API:** Deliver dashboard data endpoints, export services, and notification hooks.
- **Logic:** Map user stories/acceptance criteria to dashboards, ensuring coverage.
- **Design:** Produce layout specs and interaction models per persona.

### Subtask 4.5 – Policies, Navigation & Knowledge Base — 0%
- **Backend:** Host policy CMS, navigation metadata, and documentation links.
- **Front-end:** Implement mega menus, footer behaviours, navigation updates, policy pages, README/full guide embeds.
- **User phone app:** Provide policy access, support centre links, and navigation parity.
- **Provider phone app:** Offer quick access to policies, help center, and upgrade notes.
- **Database:** Store navigation configuration and policy versions.
- **API:** Serve navigation configs to clients and track usage analytics.
- **Logic:** Finalise navigation taxonomy and documentation workflows.
- **Design:** Create mega menu layouts, footer variants, and knowledge base templates.

## Task 5 – Achieve Flutter Parity & Optimisation — 0%
Bring mobile experiences to parity with web and optimise performance/compliance.

### Subtask 5.1 – Navigation & Role Flows — 0%
- **Backend:** Provide role metadata endpoints and mobile-friendly auth flows.
- **Front-end:** Share assets/tokens for consistent navigation branding.
- **User phone app:** Implement splash, role changer, bottom tabs, contextual menus, and deep linking.
- **Provider phone app:** Extend role changer to business roles and dashboards.
- **Database:** Support mobile session tokens and role mapping tables.
- **API:** Deliver mobile-auth endpoints, refresh flows, and feature flag APIs.
- **Logic:** Document navigation logic and session persistence rules.
- **Design:** Produce mobile navigation wireframes and animation guidelines.

### Subtask 5.2 – Timeline Hub Parity — 0%
- **Backend:** Optimise socket payloads and CDN endpoints for timeline hub updates, urgency alerts, and media delivery on mobile.
- **Front-end:** Provide shared component specs for timeline hub tabs to ensure parity.
- **User phone app:** Build timeline hub tabs (Timeline, Custom Job Feed, Marketplace Feed), push notifications, and offline caching tuned per feed.
- **Provider phone app:** Enable provider-specific analytics, sponsorship placements, and rapid responses to feed alerts on mobile.
- **Database:** Index mobile-specific queries for offline sync, prioritisation, and caching.
- **API:** Support pagination, offline sync endpoints, and push notification triggers per feed.
- **Logic:** Define acceptance tests for parity, urgency handling, and offline behaviour.
- **Design:** Adapt timeline hub designs for handheld breakpoints and gestures.

### Subtask 5.3 – Commerce & Dashboard Parity — 0%
- **Backend:** Ensure APIs return lightweight payloads and secure payment flows for mobile.
- **Front-end:** Share design tokens and analytics events for conversions.
- **User phone app:** Implement explorer, storefront, checkout, wallet, rentals, materials, and metrics dashboards.
- **Provider phone app:** Provide catalog management, crew scheduling, finance/tax, escrow, and ads dashboards.
- **Database:** Enable delta sync for orders/inventory.
- **API:** Supply mobile-optimised endpoints and offline-safe mutations.
- **Logic:** Map parity checklist for commerce and dashboards.
- **Design:** Produce mobile checkout and dashboard patterns.

### Subtask 5.4 – Support, Integrations & Compliance — 0%
- **Backend:** Expose Chatwoot session APIs, Firebase messaging, analytics logging, and legal content endpoints.
- **Front-end:** Coordinate iconography/assets for support widgets.
- **User phone app:** Integrate Chatwoot bubble post-login, support inbox, attachments, emojis, GIFs, help center links, and policy acknowledgement.
- **Provider phone app:** Offer provider support hub, training content, and compliance reminders.
- **Database:** Store support transcripts, attachments metadata, and acknowledgement logs.
- **API:** Manage push notifications, attachments upload, and help center search.
- **Logic:** Define support escalation paths and compliance prompts.
- **Design:** Craft mobile support/chat UI and policy modals.

### Subtask 5.5 – Performance, Diagnostics & Store Compliance — 0%
- **Backend:** Provide analytics ingestion, feature flag toggles, and diagnostic endpoints.
- **Front-end:** Coordinate release notes, privacy labels, and asset pipelines.
- **User phone app:** Implement Firebase analytics/crashlytics, offline caching, media optimisation, RAM/battery profiling, App Store compliance, and in-app purchase/deep link handling.
- **Provider phone app:** Mirror diagnostics, offline caching, and compliance features.
- **Database:** Capture device telemetry and compliance audit data.
- **API:** Offer telemetry ingestion endpoints and configuration updates.
- **Logic:** Draft store submission checklist and monitoring plan.
- **Design:** Provide store asset guidelines and diagnostic dashboard mockups.

## Task 6 – Testing, Documentation & Launch Readiness — 0%
Execute comprehensive testing, documentation, and go-live rehearsals.

### Subtask 6.1 – Automated Testing Matrix — 0%
- **Backend:** Implement unit, integration, load, stress, usage, security, and financial tests with CI gating.
- **Front-end:** Add component, accessibility, and visual regression suites.
- **User phone app:** Create integration/golden tests, device farm automation, and performance benchmarks.
- **Provider phone app:** Cover provider flows with automated UI and API tests.
- **Database:** Validate migrations/seeders, rollback scripts, and data integrity tests.
- **API:** Run contract tests for web/mobile clients and integrations.
- **Logic:** Maintain test traceability matrix linked to requirements.
- **Design:** Support visual regression baselines and review workflows.

### Subtask 6.2 – Manual QA & Evidence Capture — 0%
- **Backend:** Provide tooling for log capture and feature flag toggles during manual runs.
- **Front-end:** Execute exploratory tests for timeline hub feeds, navigation, policies, and ads.
- **User phone app:** Validate timeline hub, commerce, support, and dashboard flows on device matrix.
- **Provider phone app:** Conduct manual verification of provider, crew, enterprise, admin dashboards and finance flows.
- **Database:** Snapshot data states before/after QA cycles for auditing.
- **API:** Supply API consoles and monitors for manual verification.
- **Logic:** Compile QA scripts, acceptance criteria sign-offs, and defect tracking.
- **Design:** Review UI against design system and capture annotated evidence.

### Subtask 6.3 – Observability & Incident Response — 0%
- **Backend:** Finalise alerting, incident runbooks, and chaos/rollback drills.
- **Front-end:** Monitor client-side errors, SLA dashboards, and uptime helper UI.
- **User phone app:** Configure crash reporting alerts, release monitors, and on-call rotations.
- **Provider phone app:** Track provider-specific incident dashboards and escalation paths.
- **Database:** Ensure backup/restore drills and audit log reviews.
- **API:** Implement synthetic monitoring and failover testing.
- **Logic:** Document incident command structure and communication protocols.
- **Design:** Produce incident dashboards and status page visuals.

### Subtask 6.4 – Documentation & Knowledge Base — 0%
- **Backend:** Contribute architecture diagrams, deployment runbooks, and API references.
- **Front-end:** Update README, full guide sections, and upgrade instructions.
- **User phone app:** Document mobile setup, feature tours, and troubleshooting.
- **Provider phone app:** Create provider training materials, policy summaries, and onboarding walkthroughs.
- **Database:** Publish data dictionary, migration catalog, and retention schedules.
- **API:** Generate OpenAPI/GraphQL specs and integration guides.
- **Logic:** Compile changelog, update brief, end-of-update report, and starter data catalogue.
- **Design:** Deliver UI inventories, style guides, and accessibility reports.

### Subtask 6.5 – Release Rehearsal & Handover — 0%
- **Backend:** Run final blue/green rehearsal, rollback validation, and performance burn-in.
- **Front-end:** Coordinate launch communications, feature flag flips, and monitoring dashboards.
- **User phone app:** Execute staged rollout, collect telemetry, and prepare support scripts.
- **Provider phone app:** Align provider communications, training sessions, and escalation contacts.
- **Database:** Lock migrations, confirm backups, and enable monitoring for launch window.
- **API:** Validate rate limits, failover readiness, and integration health.
- **Logic:** Finalise go-live checklist, roles/responsibilities, and post-launch review cadence.
- **Design:** Prepare stakeholder dashboards and launch-day content assets.
