# Version 1.50 – Features to Add

| Feature Cluster | Web Application Scope | Backend / Infrastructure Scope | Flutter Phone App Scope |
| --- | --- | --- | --- |
| **Enterprise Security & Compliance Core** | - RBAC enforcement across dashboards, creation studio, storefronts, messaging, and admin tools.<br>- Cookie banner, Privacy, Terms, About pages with GDPR-compliant consent capture.<br>- Scam warning banners and inline alerts on live feed, checkout, and messaging screens. | - Policy-based access control middleware, permission matrix storage, and audit logging.<br>- Encryption/hashing for sensitive columns, secrets management, reduced `.env` reliance with hardened defaults.<br>- Compliance automations: data export/delete flows, consent logs, DPIA documentation hooks. | - Role-aware navigation and gated screens mirroring web permissions.<br>- In-app privacy/terms pages, consent modals, and scam warning surfaces.<br>- Secure storage for tokens and device binding with biometric unlock option. |
| **Payments, Finance & Escrow Suite** | - Redesigned checkout with serviceman selection (manual or auto-match).<br>- Finance dashboard for payouts, disputes, escrow status, and wallet guidance.<br>- Campaign and ad spend budgeting UI tied to storefronts. | - Payment orchestration service covering onboarding, escrow, dispute workflows, payouts, tax invoices.<br>- Integration with external payment providers, ledger records, financial reporting exports.<br>- Validation for non-custodial wallet handling and alerts for regulatory boundaries. | - Mobile checkout flow with responsive summaries and serviceman selection.<br>- Finance settings for payout preferences, tax documents, and dispute status tracking.<br>- Push notifications for payment events and dispute milestones. |
| **Experience & Navigation Overhaul** | - Rebuilt public site (Home, Explore) with authentic imagery, CTA strategy, geo-filtering, and live feed highlights.<br>- Role dashboards with fully populated widgets (analytics, storefronts, inventory, rental, creation studio entry).<br>- Menu reorganisation for header/footer and post-login navigation. | - Content management endpoints for marketing pages, storefront configuration, and live feed aggregation.<br>- Analytics aggregation services powering dashboards and ranking algorithms.<br>- Availability calendar APIs per serviceman with timezone-aware scheduling. | - Screen architecture mirroring key flows (Explore, Bookings, Live Feed, Reviews, Messaging).<br>- Drawer/tab navigation tuned for mobile ergonomics.<br>- Calendar and availability pickers optimised for touch interactions. |
| **Intelligence & Integrations Hub** | - Admin integrations console to connect HubSpot, Salesforce, Slack, Google Drive.<br>- AI settings center to enable OpenAI, Claude, XAI Grok, manage keys, and toggle AI-assisted UX (messaging, recommendations, dispute triage). | - Integration connectors with OAuth handshakes, webhook processing, retry queues, and audit logs.<br>- AI orchestration layer with provider-specific adapters, rate limiting, and observability.<br>- Matching/ranking services enhanced with AI scoring and rule fallbacks. | - Integration status view with enable/disable toggles and sync health.<br>- AI-powered messaging assistance and recommendation chips, respecting BYO key configuration.<br>- Offline-safe caching strategy for integration-dependent data. |
| **Communication, Notifications & Collaboration** | - Upgraded messaging center with inbox threading, attachments, chat bubbles, AI assist, and onsite scam warnings.<br>- Notification tray aggregating bookings, payments, disputes, campaigns, integration events.<br>- Social login support (Google, Apple, Microsoft, LinkedIn). | - Unified notification service broadcasting to web, email, SMS, and FCM.<br>- Messaging microservice with persistence, encryption, and AI augmentation hooks.<br>- Identity federation layer linking social logins to Fixnado accounts. | - Real-time chat with typing indicators, attachments, and AI suggestions.<br>- FCM push notifications mapped to in-app notification center with preference controls.<br>- Social login support with secure token handling and account linking. |
| **Mobile Parity & Performance Enhancements** | - Shared design tokens and component guidelines to keep parity with mobile visuals.<br>- Responsive layouts ensuring functionality across desktop, tablet, and mobile web. | - API performance tuning, caching, and pagination strategies to support lightweight mobile consumption.<br>- Monitoring for mobile-specific endpoints and latency budgets. | - Modular widget library, lazy-loaded feature modules, and asset compression to keep build size low.<br>- Configurable API base URL selector for staging/production.<br>- Multi-language support with locale switcher and translation catalogues. |

## Supporting Tables & Entities
- **Database tables**
  - `roles`, `permissions`, `role_permission_map`, `user_roles` for RBAC enforcement.
  - `payments`, `escrows`, `disputes`, `payout_requests`, `invoices` for the finance suite.
  - `storefronts`, `business_fronts`, `service_packages`, `tool_listings`, `material_listings` to power creation studio outputs.
  - `live_feed_items`, `geo_zones`, `availability_slots`, `reviews` supporting matching, scheduling, and social proof.
  - `integration_accounts`, `integration_events`, `ai_providers`, `ai_feature_toggles` for the intelligence hub.
  - `notifications`, `messages`, `message_threads`, `attachments`, `notification_preferences` covering communication requirements.

- **Core backend functions/services**
  - `authorizeRequest(user, permission)` middleware and policy evaluators per route/controller.
  - `orchestratePaymentFlow(orderId)` handling checkout, escrow, dispute, payout sequences.
  - `generateScamAlerts(context)` combining heuristics and AI scoring for warnings.
  - `syncIntegrationAccount(provider)` to establish OAuth, store tokens securely, and queue sync jobs.
  - `executeMatchingAlgorithm(criteria)` merging geo-zonal, ranking, and availability data.
  - `dispatchUnifiedNotification(event)` distributing notifications to all channels including FCM.
  - `translateContent(key, locale)` served via shared localization service for web and mobile.

- **Frontend/Flutter component highlights**
  - React component suites: `CreationStudioWizard`, `FinanceDisputePanel`, `ServiceProviderSelector`, `IntegrationToggleCard`, `NotificationCenterDrawer`.
  - Flutter widgets: `ServicemanPickerSheet`, `FinanceDashboardScreen`, `ScamAlertBanner`, `IntegrationStatusTile`, `LocaleSwitcherMenu`, `ChatThreadView`.

## Acceptance Notes
- Every feature must reach production-ready quality: no placeholder text, stubs, or unfinished logic.
- Automated tests (unit, integration, e2e) must cover all new endpoints, workflows, and UI states.
- Documentation updates (README, setup guides, `.env.example`) are mandatory before release sign-off.

## Web Application Feature Breakdown
- **Home & Marketing**: Compliance-safe hero, service showcases, testimonials, FAQ, CTA strategy, cookie consent banner, legal footer links, newsletter opt-in.
- **Explore & Live Feed**: Geo-zonal filters, AI-enhanced ranking, availability overlays, scam alerts, multilingual support, storefront spotlight, reviews aggregation.
- **Storefronts & Business Fronts**: Template library, drag-and-drop sections, inventory catalogues, rental listings, pricing tables, service bundles, campaign banners, ad placements.
- **Inventory & Rental Management**: CRUD tools, availability calendar integration, rental scheduling, asset status tracking, import/export utilities, analytics widgets.
- **Payments & Finance**: Checkout wizard, escrow progress tracker, dispute resolution center, finance settings (payout methods, tax forms), compliance notices, downloadable statements.
- **Messaging & Notifications**: Inbox threading, chat bubbles, attachments, AI assist toggle, onsite scam warnings, unified notification drawer with filtering and preference controls.
- **Account Preferences & Settings**: Profile management, security controls (2FA, session management), notification preferences, social login linking, language selection.
- **Administrator Console**: Role/permission editor, integration toggles, moderation queues, audit logs, monitoring dashboards, incident workflows, user impersonation guardrails.
- **Creation Studio**: Wizards for services, packages, tool/material listings, storefront creation, serviceman profile fronts, marketing campaigns, with preview and publishing workflows.
- **Campaigns & Advertising**: Fixnado ads management (campaign setup, budgeting, targeting, creatives, placement selection, analytics), promotion scheduling, compliance approvals.
- **Integrations Hub**: Connectors for HubSpot, Salesforce, Slack, Google Drive, AI providers, file sync dashboards, webhook health indicators, BYO key inputs, enable/disable toggles.
- **Legal & Compliance**: About, Terms & Conditions, Privacy Policy, GDPR request portal (export/delete), consent logs, DPIA records, security posture documentation.

## Backend / Infrastructure Feature Breakdown
- **Service Modules**: Auth & RBAC, Payments & Escrow, Messaging, Notifications, Integrations, AI Orchestration, Analytics, Campaigns/Ads, Inventory/Rentals, Storefronts.
- **Security Hardening**: Input validation, rate limiting, WAF integration, secrets management, controller protection, logging redaction, backup/restore automation.
- **Data Management**: Migration suite covering all new tables, seeders for roles, taxonomies, storefront templates, AI feature flags, campaign types, review categories.
- **Integration Services**: OAuth flows, webhook processors, retry queues, error alerting, audit logs, sandbox/production separation.
- **Testing Harness**: Contract tests, load tests for payments/messaging/live feed, security regression suite, CI gating, seed data for e2e flows.
- **Observability**: Metrics (payments, messaging latency, AI usage), centralized logging, alerting policies, dashboards, SLA monitors, uptime probes.

## Flutter Phone Application Feature Breakdown
- **Navigation & Layout**: Bottom tab navigation for Home, Explore, Bookings, Messaging, Notifications, Preferences; secondary drawers for Finance, Integrations, Support.
- **Feature Parity Modules**: Booking management, live feed, messaging with AI assist, review submission, calendar availability, finance settings, dispute tracking, integration status.
- **UX Enhancements**: Adaptive cards, responsive typography, vector icons, dark mode, haptic feedback, offline messaging drafts, localized formatting.
- **Performance Controls**: Code splitting via deferred components, asset compression, caching strategies, background sync optimization, diagnostics dashboard.
- **Security & Compliance**: Biometric unlock, secure storage, GDPR consent flows, privacy/legal screens, scam alert banners, session timeout policies.
- **Configuration & Extensibility**: API base URL switcher, feature flag sync with backend, error reporting hooks, in-app support links.

## Testing & Quality Coverage
- **Backend**: Unit tests for services/controllers, integration tests for payments, messaging, integrations, analytics; e2e flows for booking-to-payout; load tests for live feed and notifications.
- **Frontend**: Component/unit tests, Cypress e2e covering signup, purchase, creation studio, campaign management, messaging, notifications, admin operations; accessibility audits; visual regression captures.
- **Flutter**: Unit/widget/integration tests, golden tests for UI, performance profiling, device farm smoke tests, localization verification, offline/online transition tests.
- **Security & Compliance**: OWASP ASVS review, GDPR DPIA, data retention audits, secrets scanning, dependency vulnerability scans, phishing/virus resilience drills.
- **Operational Readiness**: Runbook dry-runs, monitoring/alerting validation, rollback rehearsal, support team training, release communication sign-off.
