# Version 1.00 – Features to Add

## Feature Portfolio Overview
| # | Feature Cluster | Key Deliverables |
| --- | --- | --- |
| 1 | Geo-Zonal Intelligence | Zone creation & management, polygon drawing tools, zonal service catalogues, zone analytics |
| 2 | Booking & Job Lifecycle | On-demand & scheduled bookings, multi-serviceman assignments, custom job creation, bidding & negotiations |
| 3 | Marketplace & Inventory | Tool rentals/sales marketplace, inventory ledger, insured seller validation, rental logistics |
| 4 | Provider & Client Experience | Rich profiles, business fronts, explorer search, service packages, custom services |
| 5 | Communications Suite | Real-time chat with AI assists, Agora video/phone calls, booking notifications, dispute messaging |
| 6 | Governance & Compliance | Admin panels, commission management, document verification, dispute resolution, GDPR compliance |
| 7 | Monetisation & Ads | Fixnado Ads, Finova Ads (PPC/PPI/etc.), campaign manager, targeting & budgeting |
| 8 | Analytics & Reporting | KPIs dashboards, inventory metrics, booking funnel analytics, ad performance |
| 9 | Internationalisation & Security | Multi-language/currency/tax support, security hardening, role-based access |

---

## 1. Geo-Zonal Intelligence
### Functional Requirements
- Polygon-based zone designer with snapping, radius tools, and coverage validation.
- Zone area management dashboard for admins to create, update, archive zones.
- Service-to-zone mapping (single & multi-zone support) with effective-date scheduling.
- Zonal services catalogue that filters offerings based on user location and zone coverage.
- Zone performance analytics (jobs booked, revenue, SLA compliance per zone).

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `Zone` | id, name, polygon_coordinates, status, coverage_type, created_by, active_from, active_to | Stored in GeoJSON-compatible format |
| `ZoneServiceLink` | id, zone_id, service_id, priority, multi_zone_group | Allows same service across zones |
| `ZoneAnalyticsSnapshot` | zone_id, period, bookings, revenue, avg_response_time | Drives dashboards |

### Dependencies
- Map rendering library (web) & native map kits (Flutter).
- Geo-indexing in database (PostGIS extension or equivalent).

---

## 2. Booking & Job Lifecycle
### Functional Requirements
- **On-Demand vs Scheduled**: Toggle at booking start, with SLA timers for on-demand requests.
- **Multi-Servicemen**: Ability to assign multiple servicemen per job with role tags (lead, assistant, specialist).
- **Custom Jobs**: Rich job forms capturing profile, description, budget, pictures, documents, and geo-location.
- **Bidding & Negotiation**: Providers submit bids, comment threads per bid, option to ask queries before bidding, acceptance/rejection with history logs.
- **Job Status Flow**: Draft → Submitted → Bidding → Accepted → In Progress → Completed → Closed/Disputed.
- **Booking Flow Enhancements**: Guided steps with validation, deposit handling, cancellation policies, and dispute escalation entry points.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `Booking` | id, client_id, service_id, zone_id, booking_type, scheduled_at, status, commission_id | Supports on-demand flag and scheduling |
| `BookingAssignment` | booking_id, serviceman_id, role, status, accepted_at | Tracks multiple servicemen |
| `CustomJob` | id, client_id, title, description, budget_range, attachments, location_polygon | Linked to booking or standalone |
| `Bid` | id, custom_job_id, provider_id, amount, currency, status, comments_thread_id | Comments stored separately |
| `BidComment` | id, bid_id, author_id, message, attachments | Supports questions/answers |

### Dependencies
- Notification service for bid updates.
- Document storage for attachments.
- Compliance checks triggered before job acceptance.

---

## 3. Marketplace & Inventory
### Functional Requirements
- Unified marketplace for renting and selling tools/materials with filters (category, availability, insured only).
- Inventory management console for providers (stock levels, check-in/out, depreciation tracking).
- Rental workflow: request → approval → pickup/delivery → return inspection → settlement.
- Marketplace matching ensuring only insured sellers appear in listings by default.
- Integration with booking flow to upsell rentals alongside services.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `InventoryItem` | id, provider_id, name, sku, category_id, quantity, unit_type, insurance_required, rental_rate | Supports rental & sale |
| `InventoryTransaction` | id, item_id, type (rental, sale, adjustment), quantity, related_booking_id | Maintains ledger |
| `MarketplaceListing` | id, item_id, listing_type (rent/sell), price, deposit, availability_window, insured_only | Controls storefront |
| `RentalAgreement` | id, listing_id, renter_id, status, pickup_at, return_due_at, condition_report | Handles rental lifecycle |

### Dependencies
- Payment & escrow services for deposits.
- Insurance verification APIs.

---

## 4. Provider & Client Experience
### Functional Requirements
- Explorer page with global search across services, packages, rentals, and custom jobs.
- Business front pages featuring banner, hero video, image gallery, about section, past projects, reviews, website, and social links.
- Servicemen profiles with avatars, banners, bio, certifications, ratings, service areas.
- Ability to offer service packages (predefined bundles), individual services, and custom service proposals.
- On-site banners for promotions configurable per zone or category.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `BusinessFront` | provider_id, banner_url, hero_video_url, gallery, about, showcase_projects | Rendered on explorer |
| `ServicePackage` | id, provider_id, name, description, inclusions, price, service_ids | Supports multi-zone availability |
| `ProfileMedia` | owner_id, owner_type, media_type, url, caption | Banners, avatars, galleries |
| `BannerPlacement` | id, zone_id, category_id, media_url, cta_url, schedule | Powers on-site banners |

### Dependencies
- Media storage/CDN.
- Review & rating system integration.

---

## 5. Communications Suite
### Functional Requirements
- Real-time chat with opt-in AI assistance using provider-specific OpenAI or Claude API keys.
- Chat moderation, audit logs, and GDPR-compliant consent prompts.
- Integrated Agora video and phone calls accessible from chat or booking details.
- Notification routing (push, email, SMS) for booking updates, bids, disputes, and rentals.
- Dispute conversation channels with structured message types (evidence, decision, resolution).

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `ChatThread` | id, context_type (booking, marketplace, support), participants, ai_assist_enabled | Links to conversation context |
| `ChatMessage` | id, thread_id, sender_id, message_type, content, attachments, ai_generated | Tracks AI flag |
| `AgoraSession` | id, thread_id, channel_name, token, session_type (video/voice), started_at | Stored for compliance |
| `NotificationPreference` | user_id, channel, enabled, quiet_hours | Personalised routing |

### Dependencies
- AI provider key vault.
- Real-time messaging infrastructure (WebSocket/SignalR/Firestore).

---

## 6. Governance & Compliance
### Functional Requirements
- Comprehensive admin panel with modules for user management, commission setup, dispute handling, compliance queue, analytics, and ad approvals.
- Dedicated panels for Servicemen, Provider/SME, and Enterprise with role-based dashboards.
- ID, insurance, DBS, and document verification workflows with status tracking, expiry reminders, and rejection appeals.
- Dispute system with evidence collection, adjudication workflow, and decision logging.
- GDPR tooling: consent management, data export/delete, audit log viewer.
- Security hardening including MFA, session management, and anomaly detection.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `CommissionRule` | id, service_category_id, rate_type, rate_value, effective_date, cap | Supports flexible commission models |
| `ComplianceDocument` | id, owner_id, doc_type (ID, DBS, insurance), status, expires_at, reviewer_id | Workflow state |
| `DisputeCase` | id, related_booking_id, complainant_id, status, resolution, evidence_links | Tied to chat history |
| `UserRoleAssignment` | user_id, role, panel_access, permissions | Drives RBAC |

### Dependencies
- External identity verification providers.
- Audit logging infrastructure.

---

## 7. Monetisation & Ads
### Functional Requirements
- Fixnado Ads platform for internal promotions and marketplace placements.
- Finova Ads suite supporting PPC, pay-per-conversion, pay-per-impression, time-based campaigns, and custom campaign types.
- Campaign targeting by zone, category, language, platform, demographics, and behaviour.
- Budget management with pacing, spend alerts, and performance reporting.
- Ad creative management (banners, video, text) with approval workflows and scheduling.

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `AdCampaign` | id, owner_id, campaign_type, objective, start_at, end_at, budget, pacing | Supports various pricing models |
| `AdTargetingRule` | id, campaign_id, zone_ids, categories, languages, device_types | Multi-dimensional targeting |
| `AdCreative` | id, campaign_id, media_type, asset_url, copy, cta | Reusable assets |
| `AdPerformanceMetric` | campaign_id, period, impressions, clicks, conversions, spend | Feeds analytics |

### Dependencies
- Analytics pipeline for attribution.
- Payment processor for ad billing.

---

## 8. Analytics & Reporting
### Functional Requirements
- Unified analytics dashboards covering bookings, inventory, ads, communication metrics, compliance statuses.
- Customisable reports with export (CSV/PDF) and scheduled delivery.
- Drill-downs for zone performance, serviceman productivity, marketplace turnover, ad ROI.
- Alerting for threshold breaches (low inventory, expiring documents, high dispute rate).

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `MetricDefinition` | id, name, description, calculation_logic | Centralised metric catalogue |
| `AnalyticsDashboard` | id, role, widgets_config | Tailored dashboards per persona |
| `AlertRule` | id, metric_id, threshold, direction, notification_channel | Automates monitoring |

### Dependencies
- Data warehouse or analytics store.
- BI tooling integration (Looker, Metabase, etc.).

---

## 9. Internationalisation & Security
### Functional Requirements
- Multi-language support (content translation, locale-specific formatting).
- Multi-currency pricing with real-time FX updates and localised tax breakdowns.
- Multi-tax engine supporting VAT variations, regional levies, and tax-inclusive pricing.
- Security enhancements: MFA, session timeout policies, anomaly detection, encryption.
- Final compliance alignment for UK regulations and GDPR (data residency, consent, breach response plans).

### Data & API Needs
| Entity | Fields | Notes |
| --- | --- | --- |
| `CurrencyRate` | currency_code, rate, effective_at, source | For FX conversions |
| `TaxRule` | id, jurisdiction, rate, applicability_conditions, effective_dates | Supports multi-tax |
| `LocaleContent` | key, locale, value, last_updated | For translations |
| `SecurityEvent` | id, user_id, event_type, severity, metadata | Monitors security posture |

### Dependencies
- FX rate provider.
- Translation management system.
- Security information and event management (SIEM).

---

## Cross-Cutting Considerations
- **Performance**: Ensure caching and pagination for explorer, marketplace, and analytics endpoints.
- **Accessibility**: WCAG-compliant UI components for web and mobile.
- **Scalability**: Modular microservices with clear SLAs and auto-scaling policies.
- **Observability**: Structured logging, metrics, and tracing for every new service.
- **Data Governance**: Document retention schedules, anonymisation processes, and consent tracking.

