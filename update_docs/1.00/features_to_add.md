# Version 1.00 – Features to Add

## Feature Portfolio Overview
| # | Feature Cluster | Key Deliverables |
| --- | --- | --- |
| 1 | Geo-Zonal Intelligence & Matching | Zone creation & management, polygon drawing tools, zone analytics, multi-zone packages, location-aware job routing |
| 2 | Booking & Custom Job Lifecycle | On-demand vs scheduled bookings, multi-serviceman coordination, custom job creation, bidding, negotiation, dispute hooks |
| 3 | Marketplace, Rentals & Inventory | Tool/material rentals & sales, insured seller enforcement, inventory ledger, rental logistics, marketplace upsells |
| 4 | Provider, Servicemen & Business Experience | Business fronts, rich profiles, avatars/banners, service packages, explorer search, SME & enterprise panel surfaces |
| 5 | Communications & Collaboration Suite | AI-assisted chat, Agora video/phone calls, notification routing, dispute messaging, comment threads |
| 6 | Governance, Compliance & Security | Admin/role panels, commission management, document verification, GDPR tooling, UK compliance workflows |
| 7 | Monetisation & Advertising | Fixnado Ads, Finova Ads (PPC, PPConversion, PPI, timed), campaign manager, targeting, budgeting |
| 8 | Analytics, Reporting & Insights | Dashboards, alerts, KPI catalogues, export tools, ad/booking/inventory analytics |
| 9 | Internationalisation & Financial Controls | Multi-language, multi-currency, multi-tax, payment localisation, UK legal compliance |

---

## 1. Geo-Zonal Intelligence & Matching
### Functional Requirements
- Polygon-based zone designer with snapping, radius tools, and coverage validation, enabling admins to draw precise service areas.
- Zone area management dashboard for create/update/archive, including effective dates and staged publishing for new regions.
- Zone hierarchy support for nested or overlapping coverage (e.g., city, borough, neighbourhood) with priority rules.
- Service-to-zone mapping (single & multi-zone) with scheduled availability windows and package-level overrides.
- Zone-aware service catalogue and explorer filters that respect user location, provider preferences, and compliance status.
- Zone analytics with heatmaps (jobs booked, response time, revenue, dispute rate) and SLA dashboards.
- Zone-based surge or premium pricing flags to support future monetisation.

### API & Data Model Additions
| Entity | Fields | Notes |
| --- | --- | --- |
| `Zone` | id, name, polygon_coordinates (GeoJSON), status, coverage_type, parent_zone_id, created_by, staged_publish_at | Supports hierarchical coverage |
| `ZoneServiceLink` | id, zone_id, service_id, package_id, priority, multi_zone_group, availability_window | Maps services/packages to zones |
| `ZoneAnalyticsSnapshot` | zone_id, period, bookings, revenue, avg_response_time, disputes, net_promoter_score | Drives dashboards |
| `ZoneMatchRule` | id, zone_id, matching_strategy (distance, compliance score), fallback_zone_id | Configures matching logic |

### Key Endpoints / Functions
- `POST/PUT/DELETE /zones`, `POST /zones/{id}/simulate`, `GET /zones/{id}/analytics`
- `POST /matching/evaluate` to test provider-client fit using zone + compliance criteria.
- Utility library: `calculatePolygonCentroid()`, `validatePolygonIntersect()`, `scoreProviderMatch()`.

### UI Components
- Admin zone editor map with draw/edit tools and coverage validation.
- Explorer zone overlay and location consent modal.
- Zone performance dashboard widgets (heatmap, KPI cards).

---

## 2. Booking & Custom Job Lifecycle
### Functional Requirements
- **On-Demand vs Scheduled**: Booking wizard toggle with SLA timers for on-demand requests, queueing and auto-expiry policies.
- **Multi-Servicemen Coordination**: Assign multiple servicemen per job with role tags (lead, assistant, specialist) and acceptance workflow per participant.
- **Custom Jobs**: Detailed job creation capturing profile, description, budget ranges, attachments (images, docs), zone polygon, preferred schedule.
- **Bidding & Negotiation**: Providers place bids, add clarifying comments, ask questions before bidding, amend bids with audit history, and view competitor count (no pricing).
- **Decision & Contracting**: Clients accept/reject bids, confirm service terms, trigger commission/tax calculations, and sign digital confirmations.
- **Dispute Hooks**: Entry points during job timeline for dispute creation, evidence upload, and messaging with dispute team.
- **Booking Flow Enhancements**: Deposit handling, cancellation policies, milestone tracking, automated reminders, and rating prompts post-completion.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `Booking` | id, client_id, service_id, zone_id, booking_type, scheduled_at, status, commission_rule_id, pricing_breakdown | Supports on-demand flag and taxes |
| `BookingAssignment` | booking_id, serviceman_id, role, status, accepted_at, declined_reason | Handles multi-serviceman flows |
| `CustomJob` | id, client_id, title, description, budget_range, attachments, location_polygon, expiry_at, required_documents | Links to booking or standalone |
| `Bid` | id, custom_job_id, provider_id, amount, currency, status, revision_no, comments_thread_id, decision_at | Tracks bidding lifecycle |
| `BidComment` | id, bid_id, author_id, message, attachments, visibility (public/private), ai_generated | Supports negotiation |
| `DisputeTrigger` | id, booking_id, reason_code, triggered_by, created_at | Initiates dispute case |

### Key Endpoints / Functions
- `POST /bookings` (with `type=on_demand|scheduled`), `PATCH /bookings/{id}/assignments`, `POST /bookings/{id}/timeline-event`.
- `POST /custom-jobs`, `POST /custom-jobs/{id}/bids`, `POST /bids/{id}/comment`, `POST /bids/{id}/decision`.
- Service functions: `calculateBookingQuote()`, `enforceCancellationPolicy()`, `initiateDispute()`.

### UI/UX Assets
- Guided booking wizard (web & Flutter) with progress tracker, deposit summary, compliance checks.
- Bid management views (list, detail, comment threads) for clients and providers.
- Custom job detail pages with attachments, budgets, and location map.

---

## 3. Marketplace, Rentals & Inventory
### Functional Requirements
- Unified marketplace surfaces for renting and selling tools/materials with filters (category, availability, insured-only, zone coverage).
- Inventory management console for providers: stock levels, check-in/out, depreciation tracking, low-stock alerts, barcode/QR scan support (future hardware integration ready).
- Rental workflow: request → approval → pickup/delivery scheduling → check-out inspection → return inspection → settlement.
- Integration hooks to upsell rentals during booking and custom job flows.
- Marketplace matching restricted to insured sellers by default, with compliance badges.
- Inventory audits and reporting, including multi-location storage support.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `InventoryItem` | id, provider_id, name, sku, category_id, quantity, unit_type, location_zone_id, insurance_required, rental_rate, sale_price | Supports rental & sale |
| `InventoryTransaction` | id, item_id, type (rental_out, rental_return, sale, adjustment), quantity, related_booking_id, performed_by, note | Maintains ledger |
| `MarketplaceListing` | id, item_id, listing_type (rent/sell), price, deposit, availability_window, insured_only, featured_flag | Controls storefront |
| `RentalAgreement` | id, listing_id, renter_id, booking_id, status, pickup_at, return_due_at, condition_report_out, condition_report_in, damages | Manages lifecycle |
| `InventoryAlert` | id, item_id, threshold_type, triggered_at, resolved_at | For analytics and notifications |

### Key Endpoints / Functions
- `POST /inventory/items`, `PATCH /inventory/items/{id}` (quantity, location, insurance flags).
- `POST /marketplace/listings`, `GET /marketplace/explorer`, `POST /rentals/{id}/check-in`, `POST /rentals/{id}/return`.
- Utility functions: `calculateRentalDeposit()`, `validateInsuranceStatus()`, `triggerInventoryAlert()`.

### UI Elements
- Marketplace explorer with tabs (Rentals, Sales, Bundles) and filter chips.
- Provider inventory dashboard (stock cards, check-in/out flows, alerts panel).
- Rental detail view with timeline, documents, and communication panel.

---

## 4. Provider, Servicemen & Business Experience
### Functional Requirements
- **Business Fronts**: Customisable storefront pages with banner, hero video, image gallery, about section, showcase projects, reviews, website, and social media links.
- **Servicemen Profiles**: Avatars, banners, certifications, experience timeline, zone coverage, availability schedule, ratings, and service categories.
- **Service Offerings**: Ability to sell service packages (pre-bundled), individual services, and bespoke custom offers with upsell suggestions.
- **Explorer Page**: Global search across services, packages, rentals, custom jobs, providers, and servicemen with advanced filters (zone, rating, compliance badges, language, currency).
- **On-site Banners**: Configurable marketing banners per zone/category, with scheduling and A/B testing capability.
- **Function Flows**: Documented flows for user registration, provider onboarding, job creation, booking, rental, dispute, and ad campaign creation.
- **App Bookings**: Synchronised calendar view across web and Flutter apps showing upcoming bookings, tasks, and rental commitments.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `BusinessFront` | provider_id, banner_url, hero_video_url, gallery, about, showcase_projects, website, social_links, badges | Rendered on explorer |
| `ServicePackage` | id, provider_id, name, description, inclusions, price, currency, duration, service_ids, zone_scope | Supports multi-zone availability |
| `ProfileMedia` | owner_id, owner_type, media_type, url, caption, is_primary | Banners, avatars, galleries |
| `BannerPlacement` | id, zone_id, category_id, media_url, headline, cta_url, schedule_start, schedule_end, targeting_rules | Powers on-site banners |
| `ProviderShowcase` | id, provider_id, title, description, media_refs, testimonial_ids | Past projects |

### Key Endpoints / Functions
- `POST /business-front`, `POST /profiles/{id}/media`, `POST /service-packages`, `GET /explorer` with multi-entity search results.
- Business front builder functions: `generateShowcaseLayout()`, `validateMediaRatio()`, `calculatePackageSavings()`.

### UI Components
- Drag-and-drop business front editor, profile media uploader, review showcase, package comparison cards, booking calendar view.

---

## 5. Communications & Collaboration Suite
### Functional Requirements
- Real-time chat with AI assistance toggled per thread, using provider-managed API keys (OpenAI, Claude) secured via vault.
- Chat moderation, profanity filtering, GDPR-compliant consent prompts, and AI message labelling.
- Agora video and phone call integration with scheduling, call logging, and PSTN fallback for poor connectivity.
- Notification routing engine for push/email/SMS with quiet hours and channel preferences per user.
- Dispute messaging channels with role-specific message types (client, provider, admin, adjudicator) and evidence attachments.
- Commenting on bids, custom jobs, and rental agreements with context-specific templates.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `ChatThread` | id, context_type (booking, marketplace, dispute, support), participants, ai_assist_enabled, consent_token_id | Links to conversation context |
| `ChatMessage` | id, thread_id, sender_id, message_type (text, file, ai), content, attachments, ai_generated, moderation_status | Tracks AI usage |
| `AgoraSession` | id, thread_id, channel_name, token, session_type (video/voice), started_at, ended_at, recording_url | Stored for compliance |
| `NotificationPreference` | user_id, channel, enabled, quiet_hours, locale | Personalised routing |
| `ProviderAIKey` | provider_id, vendor (OpenAI/Claude), key_alias, usage_limit, last_rotated_at | Manages API keys |

### Key Endpoints / Functions
- `POST /chat/threads`, `POST /chat/messages`, `POST /chat/{id}/ai-toggle`, `POST /agora/session`, `POST /notifications/dispatch`.
- Functions: `moderateMessage()`, `invokeAIReply()`, `recordCallMetadata()`, `respectQuietHours()`.

### UI Elements
- Chat widget with AI toggle, token usage meter, and moderation warnings.
- Call panel with video preview, call logs, and escalate-to-dispute button.
- Notification settings modal with channel switches and schedule selectors.

---

## 6. Governance, Compliance & Security
### Functional Requirements
- Comprehensive admin panel with modules for user management, commission configuration, dispute handling, compliance queues, analytics, ad approvals, and security oversight.
- Dedicated panels for Servicemen, Provider/SME, and Enterprise roles providing dashboards, task lists, compliance alerts, booking pipelines, and revenue snapshots.
- ID, insurance, DBS, and document verification workflows with submission steps, reviewer assignment, status tracking, expiry reminders, and rejection appeals.
- Dispute management including evidence intake, timeline, adjudication decisions, resolution messaging, and SLA tracking.
- Commission management with tiered rules by service category, zone, booking type, and provider tier, plus history log for auditing.
- Security tooling: MFA enrolment, device management, session revocation, anomaly detection alerts, audit log viewer, GDPR requests handling (export/delete).
- Marketplace matching enforcement ensuring only insured sellers appear; compliance badges displayed across explorer and listings.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `CommissionRule` | id, service_category_id, zone_id, booking_type, provider_tier, rate_type, rate_value, effective_date, cap, created_by | Supports flexible commission models |
| `ComplianceDocument` | id, owner_id, owner_type, doc_type (ID, DBS, insurance, certification), status, submitted_at, reviewed_by, expires_at, rejection_reason | Workflow state |
| `DisputeCase` | id, related_booking_id, complainant_id, status, resolution, evidence_links, assigned_admin_id, sla_due_at | Tied to chat history |
| `UserRoleAssignment` | user_id, role, panel_access, permissions, last_reviewed_at | Drives RBAC |
| `SecurityEvent` | id, user_id, event_type, severity, metadata, handled_by, handled_at | Supports anomaly detection |
| `GDPRRequest` | id, requester_id, request_type (export/delete), submitted_at, due_at, status | Compliance tracking |

### Key Endpoints / Functions
- `POST /admin/commissions`, `POST /compliance/documents`, `PATCH /compliance/documents/{id}`, `POST /disputes`, `POST /gdpr/requests`.
- Functions: `calculateCommissionPayout()`, `scheduleDocumentReminder()`, `scoreComplianceRisk()`, `detectSuspiciousLogin()`.

### UI Modules
- Admin dashboards with KPI tiles, compliance queue board, commission editor, dispute timeline view, GDPR request tracker.
- Role panels with widgets: job queue, compliance badge status, revenue breakdown, ads performance.

---

## 7. Monetisation & Advertising (Fixnado + Finova)
### Functional Requirements
- Fixnado Ads inventory for internal placements (on-site banners, explorer tiles) with scheduling and targeting.
- Finova Ads campaign manager supporting PPC, pay-per-conversion, pay-per-impression, time-based campaigns, and custom objectives.
- Targeting dimensions: zone, service category, package type, language, device type, audience segments (new vs repeat), insured status.
- Budgeting & Pacing: daily/total budgets, spend caps, pacing algorithms, alerts for overspend/underspend, auto-pause on policy breach.
- Campaign analytics: impressions, clicks, conversions, cost per metrics, ROI, funnel charts.
- Creative management with approval workflow, asset validation (specs, durations), and versioning.
- Integration with booking & marketplace flows for campaign attribution and conversion tracking.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `AdCampaign` | id, owner_id, campaign_type, objective, start_at, end_at, budget, pacing_model, bid_strategy, status | Supports various pricing models |
| `AdTargetingRule` | id, campaign_id, zone_ids, categories, languages, device_types, audience_segments, insured_only, schedule_rules | Multi-dimensional targeting |
| `AdCreative` | id, campaign_id, media_type, asset_url, copy, cta, approval_status, version, specs | Reusable assets |
| `AdPlacement` | id, placement_type (banner, explorer_tile, in-app_banner), zone_id, category_id, priority, auction_weight | Controls rendering |
| `AdPerformanceMetric` | campaign_id, period, impressions, clicks, conversions, spend, revenue_contribution | Feeds analytics |
| `AdBudgetEvent` | id, campaign_id, event_type (spend, top-up, alert), amount, triggered_at | Budget audit trail |

### Key Endpoints / Functions
- `POST /ads/campaigns`, `POST /ads/campaigns/{id}/targeting`, `POST /ads/campaigns/{id}/creatives`, `POST /ads/campaigns/{id}/budget-event`.
- Functions: `calculatePacing()`, `allocatePlacementInventory()`, `attributeConversion()`.

### UI Components
- Ads manager dashboard (campaign list, spend charts, performance metrics).
- Targeting builder with zone map, category selectors, audience toggles.
- Creative upload wizard with spec validation and approval workflow.

---

## 8. Analytics, Reporting & Insights
### Functional Requirements
- Unified analytics dashboards covering bookings, zones, servicemen performance, marketplace turnover, inventory health, ads ROI, dispute rates, compliance status.
- Role-specific analytics views (Admin, Provider, Serviceman, Enterprise) with drill-down, saved filters, and scheduled reports.
- Alerting for threshold breaches (low inventory, expiring documents, high dispute rate, ad overspend, SLA breaches).
- Export capabilities (CSV, PDF) and API endpoints for third-party BI tools.
- Metric catalogue documenting definitions, owners, formulas, and compliance notes.
- Analytics integration with Finova Ads for conversion tracking and ROI computation.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `MetricDefinition` | id, name, description, calculation_logic, owner_team, refresh_frequency | Centralised metric catalogue |
| `AnalyticsDashboard` | id, role, widgets_config, permissions | Tailored dashboards per persona |
| `AlertRule` | id, metric_id, threshold, direction, notification_channel, cooldown_period | Automates monitoring |
| `ReportSchedule` | id, dashboard_id, format, recipients, cadence | Scheduled exports |
| `InsightsAnnotation` | id, metric_id, annotation_text, created_by, created_at | Context for anomalies |

### Key Endpoints / Functions
- `GET /analytics/dashboards`, `POST /analytics/alerts`, `POST /analytics/report-schedule`, `POST /analytics/annotations`.
- Functions: `computeZoneHeatmap()`, `generateBookingFunnel()`, `monitorAdROI()`.

### UI Components
- Dashboard builder with widget library (charts, tables, maps, KPI tiles).
- Alert management modal, scheduled report configuration dialog, annotation timeline.

---

## 9. Internationalisation & Financial Controls
### Functional Requirements
- Multi-language support across web and Flutter (content translation, locale-specific formatting, RTL readiness where applicable).
- Multi-currency pricing with real-time FX updates, currency selector per user, and consistent rounding rules.
- Multi-tax engine supporting VAT, regional levies, inclusive/exclusive pricing, and compliance with UK HMRC reporting.
- Payment localisation (local payment methods, receipts, invoice templates) and commission settlement exports.
- GDPR compliance tooling (consent logs, data export/delete flows), UK-specific legal content, insurance/DBS requirements.
- Security hardening: MFA, session controls, anomaly detection, SIEM integration.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `CurrencyRate` | currency_code, rate, effective_at, source, variance_flag | For FX conversions |
| `TaxRule` | id, jurisdiction, rate, applicability_conditions, effective_dates, accounting_code | Supports multi-tax |
| `LocaleContent` | key, locale, value, last_updated, source | For translations |
| `PaymentReceipt` | id, transaction_id, currency, amount, tax_breakdown, issued_at, locale | Localised receipts |
| `ConsentRecord` | id, user_id, consent_type, granted_at, revoked_at, metadata | GDPR tracking |
| `SecurityPolicy` | id, policy_type, description, enforcement_level, updated_at | Security governance |

### Key Endpoints / Functions
- `GET /i18n/locales`, `POST /i18n/content`, `GET /finance/currency-rates`, `POST /finance/tax-calculation`, `POST /consent/log`.
- Functions: `convertCurrency()`, `applyTaxRules()`, `formatLocaleDate()`, `enforceMFAPolicy()`.

### UI Considerations
- Language switcher, currency selector, localised tax breakdown, consent management centre, security settings panel.

---

## Cross-Cutting Considerations
- **Accessibility**: WCAG 2.1 AA compliance for web and mobile; screen reader support, keyboard navigation, captioning for videos.
- **Performance**: Caching, pagination, background jobs for heavy analytics, CDN for media assets, lazy-loading for explorer.
- **Scalability**: Modular microservices, auto-scaling policies, queue-based processing for chat/video/inventory events.
- **Observability**: Structured logging, tracing, metrics dashboards, log retention policies meeting compliance.
- **Data Governance**: Data retention schedules, anonymisation scripts, consent audits, DPIA documentation.
- **Quality Controls**: Feature flags, canary deployments, blue/green release options, automated regression suites, manual exploratory testing.

## Summary of Core Tables & Services
| Area | Core Tables | Primary Services/Modules |
| --- | --- | --- |
| Zones & Matching | `Zone`, `ZoneServiceLink`, `ZoneAnalyticsSnapshot`, `ZoneMatchRule` | Zones Service, Matching Engine |
| Bookings & Jobs | `Booking`, `BookingAssignment`, `CustomJob`, `Bid`, `BidComment`, `DisputeTrigger`, `DisputeCase` | Booking Orchestrator, Dispute Manager |
| Marketplace & Inventory | `InventoryItem`, `InventoryTransaction`, `MarketplaceListing`, `RentalAgreement`, `InventoryAlert` | Marketplace Engine, Inventory Ledger |
| Profiles & Business Fronts | `BusinessFront`, `ServicePackage`, `ProfileMedia`, `BannerPlacement`, `ProviderShowcase` | Profile Service, Explorer Service |
| Communications | `ChatThread`, `ChatMessage`, `AgoraSession`, `NotificationPreference`, `ProviderAIKey` | Messaging Service, Call Orchestrator |
| Governance & Compliance | `CommissionRule`, `ComplianceDocument`, `UserRoleAssignment`, `SecurityEvent`, `GDPRRequest` | Admin Panel API, Compliance Vault |
| Monetisation & Ads | `AdCampaign`, `AdTargetingRule`, `AdCreative`, `AdPlacement`, `AdPerformanceMetric`, `AdBudgetEvent` | Fixnado Ads, Finova Ads Manager |
| Analytics & Reporting | `MetricDefinition`, `AnalyticsDashboard`, `AlertRule`, `ReportSchedule`, `InsightsAnnotation` | Analytics Pipeline, Reporting API |
| Internationalisation & Finance | `CurrencyRate`, `TaxRule`, `LocaleContent`, `PaymentReceipt`, `ConsentRecord`, `SecurityPolicy` | Finance Engine, Localisation Service |

---

## Function Flow Highlights
1. **Zone Creation → Provider Matching**
   - Admin draws zone → system validates polygon → zone published → services/packages linked → matching engine scores providers by zone, compliance, availability.
2. **On-Demand Booking**
   - User selects service → on-demand toggle triggers SLA → system finds nearest compliant providers → multi-serviceman assignment invites → acceptance updates booking timeline → chat/calls open → job completion triggers commission settlement.
3. **Custom Job Bidding**
   - Client posts custom job with attachments → providers receive notifications → submit bids/questions → client comments/clarifies → acceptance triggers contract + deposit → job tracked with milestone statuses → dispute entry available throughout.
4. **Marketplace Rental**
   - Provider lists tool with insurance badge → user discovers via explorer or booking upsell → rental request flows to provider approval → check-in/out captured with photos → inventory ledger updates → deposits reconciled.
5. **Compliance Review**
   - Provider uploads insurance/DBS → document enters review queue → compliance officer verifies, logs notes → expiry reminders scheduled → marketplace listing locked if document lapses.
6. **Ad Campaign Launch**
   - Provider configures Finova campaign → selects targeting (zones, categories, languages) → uploads creatives for approval → budget/pacing monitored → analytics dashboard tracks conversions tied to bookings or rentals.
7. **Analytics Feedback Loop**
   - Event data flows to warehouse → dashboards update near real-time → alert fires for high dispute rate in zone → admin investigates via compliance queue → adjustments made to zone rules or provider status.

These features collectively deliver the Version 1.00 mandate: a secure, compliant, data-driven service and marketplace ecosystem with comprehensive governance, monetisation, and customer experience enhancements.
