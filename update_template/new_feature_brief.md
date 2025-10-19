# Fixnado Version 1.00 – New Feature Brief

## Executive Summary
Version 1.00 cements Fixnado as an enterprise marketplace for services, rentals, and materials rather than a learning platform. The update removes course/instructor artefacts, restores marketplace-first language, and builds a production-ready foundation that spans web, backend, and mobile clients. Every feature ships with complete CRUD coverage, seeded starter data, deterministic intelligence, and governance so organisations can deploy Fixnado with zero placeholders.

## Strategic Objectives
- **Reaffirm the marketplace identity** by aligning copy, data models, and navigation to crews, providers, enterprises, and administrators while deprecating learner terminology entirely.
- **Deliver release-grade automation** through turnkey setup scripts/UI, migration + seeder orchestration, integration bootstrapping, and blue/green deployment rehearsals.
- **Complete persona dashboards** for users, servicemen, providers, crews, enterprises, and admins with embedded finance, escrow, tax, analytics, and compliance widgets—no standalone finance console.
- **Launch the timeline hub ecosystem** that delivers tabbed feeds with ads, recommendations, urgency signalling, and Chatwoot-powered support without requiring Discord-style group chat.
- **Codify compliance and documentation** via UK-ready legal pages, GDPR tooling, README/full guides, upgrade playbooks, and exhaustive testing artefacts.
- **Optimise performance and cost** by profiling high-usage flows, enforcing RAM and server budgets, and ensuring lightweight intelligence runs without GPU dependencies.

## Feature Pillars
1. **Release Readiness & Automation**
   - Provision infrastructure and configs using bash scripts or a deployment UI that captures environment secrets, toggles integrations, and supports rollback.
   - Automate database migrations/seeders with verification hooks and snapshot tooling that proves starter data integrity.
   - Instrument CI gates for unit, integration, load, usage, financial, functionality, security, CRUD, timeline hub, AI, login/registration, dashboard, mobile, zone, and commerce tests.

2. **Marketplace Commerce & Operations**
   - Provide full CRUD flows for services, rentals, and materials—covering discovery, checkout, escrow, refunds, logistics, and analytics.
   - Build storefronts, business fronts, and explorer/search surfaces with zone, skill, qualification, pricing, SEO, and hashtag matching.
   - Embed finance, escrow, tax, wallet, and metrics panels into every persona dashboard with exportable reporting, dispute management, and compliance logs.

3. **Timeline Hub & Support**
   - Rename the live feed to a tabbed timeline hub (Timeline, Custom Job Feed, Marketplace Feed), add ads/recommendations placements (main stream, sidebar, search, dashboards, detail pages), follow/unfollow, reporting, spam scanning, urgency indicators, and moderation analytics.
   - Provide feed configuration (saved filters, sponsorship controls, notification preferences) and analytics dashboards that surface impressions, conversions, escalations, and inventory risk.
   - Integrate Chatwoot for support via floating bubble (post-login), dashboard inbox previews, peer discovery, attachments, emojis, GIFs, and help-centre surfacing.

4. **Taxonomy, Matching & Intelligence**
   - Seed exhaustive catalogues for service categories, tool types, material types, zones (country → region → locality), skills, qualifications, SEO tags, hashtags, and pricing bands.
   - Deliver lightweight recommendation and matching services that can run on shared compute while offering explainability and override tooling.
   - Provide bad word/spam detection, report queues, RBAC, GDPR data workflows, and audit trails across all channels.

5. **Compliance, Documentation & Enablement**
   - Publish Terms (4–5k words), Privacy (3–5k), Refund (2.5–5k), Community Guidelines (5k), About Us (500 words), and FAQ (500–1k) tailored to Fixnado’s marketplace.
   - Refresh README, full guides, onboarding walkthroughs, release notes, and GitHub upgrade instructions.
   - Produce enablement kits for internal teams and partners covering timeline hub usage, marketplace operations, observability, and escalation paths.

## Comprehensive Logic Flows
### Identity & Role Assignment
1. **Registration & Role Selection**
   - Simplify language dropdown to single-word entries and ensure copy reflects marketplace personas.
   - Support email + social logins (Google, Apple, LinkedIn, Facebook) plus 2FA and ID verification when elevated access is requested.
   - Route new accounts through a role changer offering user, serviceman, provider, crew, enterprise, and admin choices with persona-specific onboarding tours.

2. **Access Control Enforcement**
   - Apply RBAC to every API route, WebSocket channel, dashboard widget, timeline hub feature, and admin action.
   - Maintain audit logs for persona escalation, flag toggles, and integration secrets with scheduled governance reviews.

### Timeline Hub & Communications Ecosystem
1. **Timeline Publishing**
   - Post creation triggers upload checker → bad word/spam scanner → moderation queue → publish to the selected feed (Timeline, Custom Job Feed, Marketplace Feed) with tagging, SEO metadata, ads/recommendation eligibility, urgency signals, and analytics hooks.
2. **Timeline Engagement**
   - Timeline hub renders personalised content with responsive components that avoid text overflow; follow/unfollow, reactions, comments, shares, reports, and live metrics propagate via socket.io with per-feed analytics counters.
3. **Feed Prioritisation & Escalation**
   - Urgent custom jobs, inventory shortages, and sponsored campaigns trigger notifications, dashboards updates, and escalation workflows to providers, admins, or support teams.

### Marketplace & Commerce Flow
1. **Discovery**
   - Explorer/search indexes services, servicemen, providers, crews, tools, and materials with filters for zones, categories, skills, qualifications, pricing, and tags.
   - Storefronts and business fronts showcase branding, deals, availability, reviews, inventory, and location coverage.
2. **Checkout & Fulfilment**
   - Purchases for services, rentals, and materials route through secure checkout with wallet, escrow, tax, and finance integrations; orders feed dashboards with pipeline status, scheduling, payments, and support actions.
3. **Operations & Analytics**
   - Dashboards expose pipeline, calendar, roster, metrics, finance, escrow, tax, compliance, and hub modules tuned to each persona. Admin controls manage zones, disputes, system settings, GDPR, maintenance, documents, and appearance.

### Support & Knowledge Base
1. **Support Entry Points**
   - Post-login Chatwoot bubble links to https://support.edulure.com, enabling live support, peer chats, help-centre browsing, and ticket creation. Dashboard inbox and top-bar preview keep conversations accessible.
2. **Escalation & Reporting**
   - Report buttons exist on timeline hub feeds, storefront, and dashboard widgets; escalations create audit logs and feed moderation + compliance workflows. Attachments undergo file scanning and retention policies.

### Deployment & Testing Lifecycle
1. **Environment Provisioning**
   - Deployment automation sets up infrastructure, runs migrations/seeders, configures integrations (Hubspot, Google, Salesforce, Chatwoot, SMTP, Firebase, Cloudflare R2/Wasabi/local storage options, OAuth providers), and validates env templates.
2. **Testing Pipeline**
   - Execute unit, integration, load, usage, financial, functionality, error handling, access control, CRUD, timeline hub, AI, integration, login/registration, dashboard, mobile, zone, service purchase, rental, and material purchase tests with evidence storage.
3. **Observability & Release**
   - Monitor uptime helper dashboards, load balancers, RAM/CPU usage, analytics, and logs. Rehearse blue/green releases, rollback drills, and chaos scenarios before production cutover.

## Release Readiness Commitments
1. Production-ready deployment automation with rollback plans and rehearsed runbooks.
2. Comprehensive logic flow diagrams completed before development begins.
3. Live service rehearsal covering deployment, timeline hub, and commerce flows.
4. Automated setup scripts/UI validated end-to-end.
5. Timeline rename implemented across copy, analytics, and APIs.
6. Unit test suites for backend, frontend, and mobile.
7. Load and stress testing for high-usage scenarios with documented thresholds.
8. Usage tests confirming CRUD across services, rentals, materials, dashboards, and communications.
9. Financial reconciliation tests covering purchases, rentals, subscriptions, escrow, and refunds.
10. Functional regression suites for every persona dashboard and marketplace flow.
11. Error handling and resilience drills.
12. Access control and RBAC verification on all surfaces.
13. CRUD validation for all interactive modules—no static placeholders.
14. Community programming hubs validated for announcements, events, media, leaderboards, and moderation workflows.
15. Lightweight intelligence services tested for accuracy, fallbacks, and resource ceilings.
16. Integration smoke tests for Hubspot, Google, Salesforce, Chatwoot, SMTP, Firebase, storage providers, and OAuth logins.
17. Login and registration validation including social logins and 2FA.
18. Dashboard functionality tests for user, serviceman, crew, provider, enterprise, and admin personas.
19. Mobile parity testing across iOS/Android devices with timeline hub, explorer, and commerce coverage.
20. GitHub upgrade tooling rehearsed for future releases.
21. Database migrations/seeders executed with rollback simulation and audit trail.
22. Security, penetration, and GDPR compliance testing with remediation logs.
23. Full starter data populated for services, tools, materials, zones, tags, and policies.
24. Publication of full guides, README, onboarding tours, and governance artefacts.
25. Legal documentation authored to specified lengths and approved.
26. Ads and recommendation placements validated across all mandated surfaces.
27. Bad word/spam scanners operational with manual moderation fallback.
28. Report buttons active on every interactive surface with workflow integration.
29. File submission protection enforced by upload checker and malware scanning.
30. Zone catalogue implemented with automated zone tests and global coverage checks.
31. Service purchase, rental, and material purchase tests automated with evidence capture.
32. RAM and server stress reduction stories completed with profiling artefacts.
33. High usage management playbooks updated and adopted by ops.
34. No learner/course/instructor terminology remains in code, copy, or data.

## Detailed Feature Scope
### Front-End Experience
- Fix text wrapping through responsive typography, truncation, and layout constraints; labels restricted to 1–2 words except purposeful breadcrumbs/descriptions.
- Reorganise navigation via enterprise-ready mega menus, footer transitions, and persona dashboards with quick actions.
- Ensure all sections display live data with optional demo starter data toggles for sales/training contexts.
- Restyle modules for enterprise polish—consistent spacing, typography, dark/light variants, and accessible colour contrast.
- Simplify copy to marketplace nomenclature and embed tooltips explaining services, rentals, materials, zones, and finance widgets.
- Implement security overlays (RBAC guards, session warnings), upload checker UX, file submission protection, and CDN-backed media handling.
- Integrate ads and recommendation widgets on timeline, search, dashboards, storefronts, detail pages, and post-transaction surfaces with analytics tracking.
- Surface tagging, SEO, skill, qualification, category, pricing, and zone selectors with auto-complete and rule validation.
- Provide follow/unfollow, bookmarking, comparison, and share interactions with real-time updates.
- Add observability cues (uptime helper, load balancing, caching states) to admin/operator views.

### Timeline Hub Modules
- Timeline hub supports mixed media, service highlights, rental availability alerts, material promotions, and urgent custom job or marketplace updates.
- Sidebars host ads, recommended services/materials, trending feeds, and support CTAs.
- Feed configuration panels manage saved filters, sponsorship slots, urgency alerts, and moderation queues with role-based visibility.
- Leaderboards show top servicemen/providers/crews by region, rating, response time, and transaction volume.
- Moderation center includes queue management, escalation flows, evidence capture, and analytics for response times.

### Support & Inbox
- Chatwoot floating bubble renders within 2 seconds post-login, suppressed when logged out.
- Dashboard inbox includes pinning, unread states, bulk actions, attachments, emojis/GIFs, and escalation tags synced with Chatwoot.
- Provide support analytics dashboards for SLAs, satisfaction, backlog aging, and escalation counts.
- Integrate peer-to-peer discovery with opt-in settings, RBAC, and audit logs.

### Policies & Knowledge Base
- Content management workflow for drafting, reviewing, approving, and versioning legal pages with localisation placeholders.
- Knowledge base includes guided tours, video walkthroughs, release notes, troubleshooting, and upgrade playbooks.
- Onboarding tours triggered from dashboards covering timeline hub usage, marketplace purchases, and support channels.

### Navigation & Pages
- Main header/mega menu surfaces Timeline Hub, Explorer, Storefront, Business Front, Dashboards, Support, Policies, and Tools/Materials categories.
- Footer adapts post-login to highlight dashboard + support quick links.
- Tabbed menus for dashboards ensure persona-specific flows (e.g., provider pipeline, crew shifts, enterprise portfolio).
- Update all page templates: Home, Profile, Timeline, Creation Studio (for service packages/rentals/material listings), Explorer/Search with zone filters, Storefront, Business Front, Service/Tool/Material detail + checkout, dashboards per persona, Fixnado Ads management, Support Center, Policies, About, FAQ.

### Dashboard Requirements
- **User Dashboard**: Home, Profile, Orders, Rentals, Support, Inbox, Wallet, Hub, Metrics, Settings—all interactive with timeline widgets, recommendations, and finance snapshots.
- **Serviceman Dashboard**: Home, Profile, Calendar, Pipeline, Services, Serviceman profile, Ads, Custom jobs, Metrics, Payments, Escrow, Finance, Tax, Settings, Hub—includes crew assignments and availability management.
- **Crew Dashboard**: Home, Metrics, Calendar, Shifts, Jobs, Bids, Wallet, Escrow, Tax, Inbox, Training, Tools, Keys, Hub, Profile, Settings.
- **Provider/Business Dashboard**: Home, Calendar, Pipeline, Services, Storefront, Business Front, Ads, Crew, Custom jobs, Roster, Rentals, Inventory, Tools, Metrics, Materials, Payments, Escrow, Finance, Tax, Onboard, Profile, Settings, Hub.
- **Enterprise Dashboard**: Home, Plan (Calendar), Status (Portfolio), Work (Campaign ads), Money (Finance, Tax), Risk, Vendors, Hub, Settings, Metrics.
- **Admin Dashboard**: Start (Home/Profile), Plan (Calendar/Zones), Work (Ops), Assets, Settings, Hub, System Management, Page Management, Finance Management, Dispute, Escrow, GDPR, Compliance, Maintenance Mode, Appearance, Documents, Inbox.
- Finance/escrow/tax modules integrated into each dashboard with exports, alerts, and compliance logs.

### Backend Platform
- Modularise controllers, services, middleware, routes, configs, and utilities by domain (timeline hub, marketplace, finance, support, intelligence).
- Implement RBAC and guardrails for all endpoints; remove learner/instructor/ course-specific logic.
- Provide integration adapters for Hubspot, Google, Salesforce, Chatwoot, SMTP, Firebase, Cloudflare R2/Wasabi/local storage, OAuth, and optional managed AI APIs with configuration toggles.
- Deliver WebSocket/socket.io infrastructure for timeline updates, support escalations, event notifications, job dispatch, and analytics streaming.
- Provide failure handling, retries, circuit breakers, fallback data, and structured logging for observability.
- Ship `.env` templates, environment bootstrap scripts, secret rotation playbooks, and configuration guides.

### Mobile Application (Flutter)
- Achieve parity with web flows: splash, role changer, timeline hub, explorer, dashboards per persona, service/rental/material viewers, checkout, support, inbox, wallet, ads, settings, about, policies, profile management.
- Implement bottom navigation, contextual menus, and persona switching.
- Provide offline/low-connectivity strategies for timeline, support transcripts, and order summaries.
- Integrate Firebase for push notifications, analytics, crash reporting, messaging, and remote config for feature toggles.
- Ensure App Store/Play compliance including in-app purchase options or deep links, accessibility, and privacy disclosures.

### Data, Taxonomy & Knowledge Management
- Populate service categories, tool/material catalogues, zone hierarchies, skills, qualifications, SEO tags, hashtags, and pricing tables with seeded data.
- Provide admin UIs or scripts to maintain taxonomies with audit logs and translation readiness.
- Offer analytics dashboards for engagement, conversion, ads, recommendations, support, and compliance with drill-down filters.
- Implement metadata cataloguing, lineage tracking, retention policies, and privacy tooling (DSAR portal, consent logs).

### Lightweight Intelligence & Automation
- Deploy deterministic + rule-based recommendations for services, rentals, materials, and timeline hub feeds with explainability surfaces.
- Introduce automation triggers (e.g., notify providers when rentals drop below threshold, alert ops when zone coverage is incomplete) with approval flows and rollback history.
- Provide moderation assistance for the timeline hub using small-scale classifiers or heuristics that run on shared compute and degrade gracefully.
- Track intelligence performance, costs, and fallback rates with dashboards.

### Financial & Monetisation
- Centralise ledgers for purchases, rentals, material sales, ads, sponsorships, commissions, and refunds; provide exports and reconciliation scripts.
- Support dynamic pricing, coupons, bundles, tax handling, and sponsorship tiers for timeline hub promotions.
- Provide ad management UI with pacing controls, policy enforcement, reporting, and dispute resolution.
- Implement cost governance dashboards (infrastructure spend, RAM/server usage, intelligence inference costs, storage) with sustainability metrics.

### Observability & Reliability
- Unified telemetry stack capturing logs, metrics, traces for backend, frontend, mobile, and integrations with SLO dashboards.
- Synthetic monitoring for login, timeline, support chat, checkout, and APIs from multiple regions.
- Chaos testing toolkit simulating outages, latency spikes, and socket disruptions with documented mitigation outcomes.
- Evidence vault storing CI reports, load test metrics, penetration findings, financial reconciliations, GDPR logs, and release readiness sign-offs.

### Enablement & Adoption
- Role-based training (user, serviceman, provider, crew, enterprise, admin, support) with certification quizzes and sandbox access.
- Partner launch kits with monetisation calculators, marketing assets, and upgrade roadmaps.
- Feedback loops via NPS, satisfaction surveys, Chatwoot sentiment, and analytics instrumentation feeding backlog grooming.
- Change communication hub for release notes, FAQs, stakeholder briefings, and localisation-ready announcement templates.

Maintain this brief as the canonical scope document for Version 1.00 updates; update it whenever priorities shift or new compliance requirements emerge.
