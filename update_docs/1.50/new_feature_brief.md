# Version 1.50 – New Feature Brief

## Vision
Version 1.50 positions Fixnado as an enterprise-ready marketplace and service orchestration platform that can be released directly to production. The update unifies the web and Flutter applications behind hardened APIs, elevates the customer and provider experience, and closes every outstanding compliance, security, and usability gap identified in prior audits.

## Strategic Objectives
- **Enterprise grade operations** – deliver enforceable roles, permission-driven controls, robust payment flows (including escrow and dispute handling), and regulated financial data handling without introducing an FCA-governed internal wallet.
- **Security & trust** – remove plaintext data, harden controllers/routes, streamline the `.env` footprint, and add real-time scam detection and warnings while meeting GDPR and international privacy requirements.
- **Experience excellence** – rebuild navigation, dashboards, storefronts, and creation flows so every role (customer, serviceman, SME/provider, enterprise, administrator) has a fully functional, delightful workspace across web and phone.
- **Extensibility & intelligence** – integrate HubSpot, Salesforce, Slack, Google Drive, and a pluggable AI suite (OpenAI, Claude, XAI Grok) that teams can toggle or bring their own keys for, enabling advanced automation without mandating a single vendor.
- **Mobile parity** – align the Flutter phone app with critical web functionality through modular APIs, multi-language UX, adaptive layouts, and performance-conscious packaging.

## Feature Pillars
### 1. Enterprise Hardening & Compliance
- Centralize role-based access controls (RBAC) with policy checks guarding every controller and route. Ensure permissions cascade consistently to dashboards, live feeds, messaging, creation studio tools, and admin operations.
- Replace plaintext storage with encrypted or hashed values; introduce secrets management for sensitive credentials while hardcoding only low-risk defaults (feature flags, static copy) to shrink `.env` obligations.
- Implement end-to-end payment lifecycle: provider onboarding, multi-serviceman assignments, secure checkout, escrow, dispute resolution, and financial reporting. Embed FCA-safe wallet guidance and external payout integrations.
- Finish database migrations and seeders with production-ready taxonomies, availability calendars, campaign templates, and storefront records. Guarantee migrations are idempotent and reversible.
- Embed GDPR tooling: consent capture, cookie banner, data export/delete routines, privacy/legal pages, and audit logging across web and mobile surfaces.

### 2. Connected Experience & Modular Architecture
- Establish a shared service layer for backend modules (auth, payments, messaging, notifications, AI, analytics) and expose typed REST/GraphQL endpoints consumed by both React and Flutter clients.
- Modularize the React app into feature domains (Home, Explore, Marketplace, Dashboards, Creation Studio, Messaging, Settings). Mirror modular widget libraries in Flutter with screen-specific state management.
- Rebuild navigation: header/footer for public visitors, role-aware dashboard menus, and reorganized app menus in Flutter. Ensure global notifications, messaging trays, and preference settings are consistent.
- Deliver comprehensive content: About, Terms, Privacy, Cookies, Explore, Storefronts, Business fronts, Service listings, and marketing narratives with on-brand colours, vector assets, and imagery.
- Finalize logic flows for geozonal matching, ranking algorithms, live feeds, availability calendars, reviews, inventory/rental management, and marketplace advertising.

### 3. Intelligent Integrations & Automation
- Ship integration connectors for HubSpot, Salesforce, Slack, Google Drive, and shared file storage within secure OAuth flows. Provide admin toggles and audit trails for each connection.
- Introduce an AI automation hub where operators can enable OpenAI, Claude, or XAI Grok (with BYO keys). AI services enrich messaging, recommendation ranking, dispute triage, and content generation; each feature degrades gracefully when disabled.
- Implement onsite scam detection and contextual warnings using rule-based heuristics and optional AI scoring, notifying both web and mobile users in real time.

### 4. Cross-Platform Communications & Engagement
- Upgrade messaging to support inbox threading, chat bubbles, attachments, notifications, and AI-assisted replies. Synchronize Firebase Cloud Messaging (FCM) push notifications with in-app trays on web and Flutter.
- Expand notifications to include booking updates, payment events, dispute milestones, campaign alerts, integration status changes, and preference-based digests.
- Align social login (Google, Apple, Microsoft, LinkedIn) across platforms with unified identity linking and permission scopes.

### 5. User Experience & Interface Modernization
- Redesign the home page for pre-launch storytelling with authentic imagery, concise copy, and compelling calls-to-action without fabricating traction.
- Elevate purchase flows with beautifully presented serviceman selection, service packages, and upsell opportunities. Ensure provider-managed serviceman assignments and auto-match logic operate flawlessly.
- Craft dashboards for every role (user, serviceman, SME/provider, enterprise, admin) with fully functional widgets: analytics, campaign management, escrow/dispute panels, storefront management, inventory/rental tools, and creation studio entry points.
- Implement multi-language support (starting with en-GB + 2 additional locales) including translation files, locale switchers, and localized formatting rules.

### 6. Mobile Application Parity & Performance
- Sync Flutter screens with backend modules: onboarding, explore, bookings, messaging, notifications, availability calendars, reviews, finance settings, and creation utilities where mobile-friendly.
- Optimize Flutter widget organisation, theming, vector assets, and responsiveness while keeping app size low via deferred loading and asset compression.
- Add configurable API base URL selection for staging/production without altering endpoint schemas. Provide README/setup instructions for testers.
- Ensure tests span Dart unit tests, widget tests, and integration smoke suites once Flutter tooling is available.

## Quality & Release Gates
- Comprehensive automated test coverage (unit, integration, e2e) for backend, frontend, and Flutter clients. Include role-based access tests, payment flow simulations, and integration mocks.
- Security audit pass: OWASP checklist, dependency scans, penetration testing, and code reviews verifying encryption, input validation, and threat modelling mitigations.
- Documentation deliverables: updated README, setup guides, `.env.example`, architecture diagrams, and runbooks for operations and incident response.
- Production readiness checklist covering monitoring, logging, alerting, scaling policies, and rollback plans.

## Expected Outcomes
- Launch-ready platform with zero placeholder code, clear logic flows, and verified integrations.
- Empowered teams that can orchestrate services, manage storefronts, and deploy campaigns confidently.
- Resilient infrastructure supporting enterprise clients, high-volume transactions, and secure AI-assisted operations from day one.

## Requirement Coverage Matrix
| Requirement Theme | Delivery Highlights |
| --- | --- |
| **Enterprise level upgrade (Web + Phone)** | Consolidated RBAC, policy enforcement, administrator console, hardened infrastructure, enterprise dashboards, and performance budgets across both clients. |
| **Backend ↔ Frontend / API cohesion** | Shared contract-first APIs, documented OpenAPI schemas, GraphQL resolvers, SDK generation for React/Flutter, CI contract tests, and staging environments mirroring production. |
| **Lean environment configuration** | Updated `.env.example`, environment validation, secrets vault integration, and documentation on which keys remain hardcoded defaults. |
| **Production-readiness** | Blue/green deployment scripts, observability dashboards, rollback playbooks, and compliance sign-off prior to release. |
| **Full automated and manual testing** | Test suites covering logic flows, payments, integrations, messaging, live feed, inventory, rentals, multilingual UX, and regression gates for both clients. |
| **Security & privacy** | Route/controller guards, encryption, scam warnings, anti-virus/hacker mitigations, GDPR tooling, consent management, cookie banner, privacy legal pack. |
| **Role fidelity** | Distinct dashboards, menu schemas, and creation studio permissions for users, servicemen, SMEs/providers, enterprises, and administrators. |
| **Modular architecture** | Feature-based modules in backend, frontend, and Flutter with shared component/widget libraries and design tokens. |
| **Payment provider integrations** | Provider onboarding, multi-serviceman checkout, escrow/dispute automation, financial reporting, FCA-compliant wallet guidance. |
| **Data hygiene** | Removal of plaintext database fields, migrations for calendars/inventory/reviews, seeded taxonomies, and logic gap closures. |
| **AI & integrations** | Toggleable connectors for HubSpot, Salesforce, Slack, Google Drive, OpenAI, Claude, XAI Grok with BYO key support and observability. |
| **Experience polish** | UX/UI redesign, vectors, theming, menu organisation, beautiful purchase flows, creation studio, explore/live feed, storefronts, and business fronts. |
| **Notifications & communications** | Upgraded messaging, AI assist, social logins, Firebase push, notification preference center, scam alerts across surfaces. |
| **Documentation & readiness artefacts** | README refresh, setup guides, architecture briefs, security runbooks, compliance checklist, release notes. |

## Detailed Web Experience Commitments
- **Navigation & Menus**: Reorganise header/footer, dashboard sidebars, and contextual menus ensuring quick access to Explore, Storefronts, Campaigns, Finance, Inventory, Rentals, Creation Studio, Messaging, Preferences, and Admin controls.
- **Dashboards by role**:
  - *User*: bookings, live feed, messaging inbox, preferences, wallet guidance, dispute status.
  - *Serviceman*: assignment queue, calendar, inventory tools, earnings, performance analytics, creation studio shortcuts.
  - *SME/Provider*: team management, storefront builder, campaign management, ads, finance overview, availability scheduling, serviceman allocation controls.
  - *Enterprise*: portfolio analytics, SLA tracking, integration health, procurement tools, compliance reports, bespoke ranking/geo-zonal tuning.
  - *Administrator*: system health, role/permission editor, integration toggles, moderation queues, dispute escalation, audit trails.
- **Creation Studio**: Guided flows to create services, packages, tool/material listings, storefronts, business fronts, serviceman profiles, and marketing campaigns with preview and publish stages.
- **Marketplace & Explore**: Refined Explore page with geo-filtering, ranking, live feed integration, ads/placements, reviews, availability calendars, and multilingual content.
- **Payments & Finance**: Transparent checkout, service package comparison, serviceman selection UI, escrow/dispute center, campaign budgets, finance settings, invoice download, and FCA-safe wallet explanations.
- **Content & Legal**: About Us, Terms & Conditions, Privacy Policy, Cookies banner, compliance-friendly home page with authentic imagery and compelling CTAs tailored for pre-launch stage.
- **Messaging & Notifications**: Inbox threading, chat bubbles, attachments, AI suggestions, scam alerts, unified notification center with filters, read states, and preference management.
- **Logic Completion**: Close all placeholder logic, finalize matching algorithms, live feed intelligence, campaign automation, and ensure every route/controller is exercised and protected.

## Detailed Flutter Experience Commitments
- **Screen & Widget Organisation**: Feature-aligned navigation (bottom tabs/drawer) covering Home, Explore, Bookings, Messaging, Notifications, Finance, Preferences, Live Feed, and creation utilities where mobile-appropriate.
- **Functional Parity**: Replicate bookings, messaging with AI assist, live feed, reviews, availability calendar, finance settings, dispute tracking, integrations status. Provide deep links to desktop for complex admin-only tasks while explaining transitions.
- **Performance & Size Optimisation**: Tree-shake icons/vectors, defer heavy modules, compress assets, and monitor bundle size budgets.
- **Theming & UI Polish**: Align colours, typography, button vectors, component upgrades, and design tokens with the web experience.
- **Connectivity & Configuration**: Configurable API base URL selector, resilient networking with offline caching, retry/backoff, and secure storage of tokens.
- **Compliance & Security**: GDPR consent screens, privacy/legal content, scam alert banners, biometrics for account access, secure credential handling.
- **Notifications & Social Logins**: FCM push integration, in-app notification center, social login flows, account linking, and messaging notifications with preference syncing.
- **Testing & Documentation**: Flutter unit/widget/integration suites, performance profiling, README/setup guidance for QA teams, and parity checklists ensuring no required feature is omitted.

## Governance & Quality Controls
- **Logic & Data Validation**: End-to-end scenarios for geo-zonal matching, ranking, inventory/rental operations, storefront publishing, and ad campaign lifecycle.
- **Security Hardening**: Routine pen tests, dependency vulnerability scans, controller threat modelling, bot mitigation, and incident response drills.
- **Operational Monitoring**: Metrics dashboards for payments, messaging latency, AI usage, live feed freshness, integration sync status, and mobile performance.
- **User Feedback Loops**: In-app surveys, analytics funnels, and qualitative research sessions to confirm UX simplicity and usability targets are met post-launch.
