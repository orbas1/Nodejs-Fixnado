# Fixnado Version 1.00 – Priority Features to Add

## High-Priority Short List
- Ship production-ready release automation with migrations, seeders, starter data, rollback drills, and GitHub upgrade tooling.
- Deliver a timeline hub with Timeline, Custom Job Feed, and Marketplace Feed tabs featuring ads, recommendations, moderation, urgency signalling, and Chatwoot-powered support.
- Complete marketplace commerce across services, rentals, and materials with persona dashboards embedding finance, escrow, tax, analytics, and compliance widgets.
- Publish legal, governance, and knowledge artefacts so Fixnado can launch immediately with no placeholders or learner terminology.

## Platform Foundations & Release Readiness
- **Deployment Automation**: Bash scripts or deployment UI provisioning infrastructure, secrets, integrations, blue/green releases, and health checks.
- **Database & Data**: Automated migrations/seeders with verification, rollback plans, seeded service/tool/material catalogues, full zone hierarchies, and starter accounts for every persona.
- **Testing Envelope**: CI orchestration for unit, integration, load, stress, usage, security, financial, functionality, error handling, access control, CRUD, timeline hub, AI, integration, login/registration, dashboard, mobile, zone, service purchase, rental, material purchase, and regression suites.
- **Observability Stack**: Unified logging/metrics/tracing, uptime helper dashboards, load balancing monitors, RAM/server profiling, synthetic checks, and alert routing with escalation runbooks.
- **Governance & Compliance**: RBAC enforcement, access audits, GDPR tooling (DSAR portal, consent logging, retention policies), incident response playbooks, and documentation of release readiness sign-offs.

## Timeline Hub & Engagement
- **Timeline Hub Upgrade**: Rename live feed to Timeline Hub with Timeline, Custom Job Feed, and Marketplace Feed tabs; enable mixed-media posts, ads/recommendations placements (stream, sidebar, search, dashboards, detail pages), follow/unfollow, reporting, spam scanning, moderation queues, analytics, urgency badges, and performance budgets.
- **Feed Configuration**: Saved filters, notification preferences, and sponsorship controls tailored to each feed so providers can prioritise custom jobs, inventory restocks, and promotional campaigns.
- **Signal Surfaces**: Feed analytics dashboards highlighting impressions, conversions, escalations, and service inventory health with RBAC-controlled access.
- **Support Integration**: Chatwoot floating bubble (post-login), dashboard inbox parity, peer discovery, attachments, emojis, GIFs, help centre integration, SLA analytics, and escalation tags.
- **Safety Tooling**: Bad word/spam detection, report buttons everywhere, moderation workbench with triage statuses, audit logging, and compliance exports.

## Marketplace Commerce & Catalogues
- **Explorer/Search**: Multi-index search across services, servicemen, providers, crews, tools, materials with zone, skill, qualification, pricing, SEO, hashtag filters and sorting.
- **Storefront & Business Front**: Branding, hero media, availability calendars, deals, reviews, location coverage, category tags, and CTAs for hire/purchase/contact.
- **Service/Rental/Material Flows**: CRUD for listings, secure checkout, wallet integration, escrow management, tax calculations, refund workflows, contracts, logistics integration, and analytics dashboards.
- **Ads & Recommendations**: Placement manager with pacing controls, policy enforcement, reporting, A/B testing hooks, and recommendation surfaces tied to deterministic intelligence.
- **Taxonomy Governance**: Complete service/tool/material categories, zone catalogues, skills, qualifications, SEO tags, hashtags, pricing bands, and admin tooling to maintain them with audit trails.

## Persona Dashboards & Navigation
- **User Dashboard**: Home, Profile, Orders, Rentals, Support, Inbox, Wallet, Hub, Metrics, Settings with timeline modules, recommendations, and finance snapshots.
- **Serviceman Dashboard**: Home, Profile, Calendar, Pipeline, Services, Ads, Custom Jobs, Metrics, Payments, Escrow, Finance, Tax, Settings, Hub.
- **Crew Dashboard**: Home, Metrics, Calendar, Shifts, Jobs, Bids, Wallet, Escrow, Tax, Inbox, Training, Tools, Keys, Hub, Profile, Settings.
- **Provider/Business Dashboard**: Home, Calendar, Pipeline, Services, Storefront, Business Front, Ads, Crew, Custom Jobs, Roster, Rentals, Inventory, Tools, Metrics, Materials, Payments, Escrow, Finance, Tax, Onboard, Profile, Settings, Hub.
- **Enterprise Dashboard**: Home, Plan, Status, Work (Campaign ads), Money (Finance & Tax), Risk, Vendors, Hub, Settings, Metrics.
- **Admin Dashboard**: Start, Plan (Calendar/Zones), Work (Ops), Assets, Settings, Hub, System Management, Page Management, Finance Management, Dispute, Escrow, GDPR, Compliance, Maintenance Mode, Appearance, Documents, Inbox.
- **Navigation Refresh**: Mega menus, tabbed dashboards, footer transitions, language dropdown with single-word options, simplified copy, and contextual quick actions.

## Front-End Experience & Styling
- Responsive layouts eliminating text wrapping and enforcing accessible typography, spacing, and colour contrast.
- Production-grade styling for the timeline hub, explorer, storefront, dashboards, support, and policy pages.
- Live data by default with demo toggle for training; no placeholders anywhere.
- Upload checker with inline feedback, virus scanning hooks, and retry/resume flows.
- Media pipelines for images/video with CDN support, thumbnails, and optimised delivery for event replays and media galleries.
- Ads/recommendation components instrumented with analytics, frequency caps, and fallback messaging.
- UI cues for uptime helper, load balancing, caching, and maintenance states for operators.

## Backend & Integrations
- Modular controllers/services/middleware/utilities organised by domain (timeline hub, marketplace, finance, support, intelligence, governance).
- RBAC guardrails removing learner/instructor logic and aligning to user/serviceman/provider/crew/enterprise/admin personas.
- Integration adapters for Hubspot, Google, Salesforce, Chatwoot, SMTP, Firebase, Cloudflare R2/Wasabi/local storage, Stripe (or equivalent), OAuth providers, and optional managed AI APIs (toggleable).
- WebSocket/socket.io infrastructure powering timeline updates, support escalations, event notifications, job dispatch, analytics streaming.
- Failure handling strategies with retries, circuit breakers, fallback data, structured logging, and tracing.
- Environment configuration assets: `.env` templates, bootstrap scripts, secret rotation guidelines, and config documentation.

## Mobile Application Parity (Flutter)
- Splash, role changer, persona onboarding, timeline hub, explorer, dashboards, service/rental/material detail + checkout, support, inbox, wallet, ads, settings, about, policies, profile management.
- Bottom navigation + contextual menus per persona with deep linking.
- Media capture/upload, support messaging, attachments, and offline caching for key data (orders, timelines, programming highlights).
- Firebase integration for push notifications, analytics, crash reporting, messaging, remote config.
- Compliance with Apple/Google policies including in-app purchase vs. web flow strategy, privacy disclosures, accessibility.

## Compliance, Documentation & Enablement
- Publish Terms, Privacy, Refund, Community Guidelines, About, FAQ to specified lengths with content management workflow, localisation placeholders, and acknowledgement logging.
- README, full guide, onboarding tutorials, upgrade notes, deployment guides, persona-specific runbooks, and troubleshooting FAQ.
- Governance documents: RBAC policy, feature flag lifecycle, incident response, disaster recovery, escalation matrices.
- Enablement kits for support, operations, sales, and partners with demos, calculators, release notes, and training decks.

## Intelligence & Automation (Lightweight)
- Recommendation engine enhancements covering services/rentals/materials/timeline hub posts with explainability overlays and fairness checks.
- Automation triggers for zone coverage gaps, SLA breaches, abandoned carts, expiring ads, low inventory, and compliance reminders with approval + rollback.
- Moderation assistance for timeline hub using heuristics or compact classifiers with manual override flows.
- Analytics dashboards tracking intelligence accuracy, fallback rates, cost ceilings, and manual interventions.

## Financial & Operational Excellence
- Unified ledger for purchases, rentals, materials, ads, subscriptions, commissions with exports, reconciliation scripts, dispute + refund tooling.
- Dynamic pricing and promotion toolkit with campaign scheduling, coupons, bundles, tax settings, preview flows, and compliance guardrails.
- Finance dashboards inside every persona view covering revenue, payouts, escrow balances, tax obligations, and alerts.
- Cost governance dashboards for infrastructure spend, RAM/server usage, intelligence inference cost, media storage, and sustainability metrics.
- Audit-ready logs for financial operations, GDPR events, security incidents, and release readiness.

## Observability, Reliability & Quality
- Synthetic probes for login, timeline, support chat, checkout, API endpoints across regions with automated incident creation.
- Chaos engineering routines for integration outages, latency spikes, socket disruption, storage failures, and rollback validation.
- Evidence vault storing CI artifacts, test results, load metrics, penetration reports, financial reconciliations, GDPR logs, and sign-offs.
- Performance regression guards integrated into CI/CD with thresholds gating merges.
- Post-launch monitoring plan capturing Chatwoot trends, ad/recommendation performance, zone coverage, and backlog grooming triggers.

## Training, Adoption & Feedback
- Role-based certification paths for user, serviceman, provider, crew, enterprise, admin, support, and operations teams.
- Partner launch kits with sandbox access, marketing assets, monetisation calculators, and upgrade guidance.
- Interactive product tours for timeline hub, commerce flows, dashboards, support, and governance tools with completion analytics.
- Feedback channels (NPS, surveys, sentiment analysis, analytics instrumentation) feeding product backlog and release retrospectives.
- Communication hub for release notes, FAQs, stakeholder briefings, localisation-ready announcements, and scheduled office hours.

Maintain this list as the authoritative backlog for Version 1.00 additions; update it as scope evolves while preserving the marketplace-first direction.
