# Version 1.00 – New Feature Brief

## Purpose
Version 1.00 is our largest evolution of Fixnado to date. The release positions the platform as an orchestrated marketplace for jobs, rentals, and advertising across web and Flutter applications. This brief explains *what* we are building, *why* each capability matters, and *how* the combined programme unlocks value for users, providers, operations, and regulators. It serves as a single alignment document for product, engineering, compliance, design, QA, revenue, and customer success teams.

## Problem Statements & Opportunities
- **Fragmented Discovery & Matching**: Users cannot reliably discover servicemen by location or compliance status. We must deliver polygon-based zone intelligence, AI-assisted matching, and explorer search to ensure every booking is routed to the right, insured professional.
- **Incomplete Job Lifecycle**: Bookings stop at simple assignments. Customers demand on-demand vs scheduled options, custom job bidding, negotiation, and dispute handling. Servicemen need multi-member coordination and rich communication channels (chat, video, phone).
- **Marketplace & Inventory Gaps**: Providers cannot monetise tool rentals or manage stock. A combined sales & rental marketplace with inventory tracking and insured-seller controls will diversify revenue and deepen engagement.
- **Compliance & Governance Pressure**: UK insurance, DBS, GDPR, and ID verification processes are manual. Admin teams require unified panels, audit trails, commission controls, and automated document expiry management to stay regulator-ready.
- **Monetisation & Analytics Needs**: Fixnado and Finova Ads must support PPC, PPCnv, PPI, timed campaigns, targeting, and budgeting. We need analytics and dashboards covering services, bookings, disputes, ads, inventory, and compliance metrics for data-driven optimisation.

## Strategic Goals
1. **Unify Service Supply & Demand** – Introduce zonal discovery, explorer search, custom jobs, and multi-party bookings across all web and Flutter experiences (Servicemen, Users, Provider/SME, Enterprise).
2. **Empower Providers & Teams** – Deliver multi-serviceman collaboration, rich business fronts, marketplace storefronts, AI-enabled chat, and tool rental workflows.
3. **Guarantee Trust & Compliance** – Enforce UK-specific insurance/DBS/ID verification, dispute management, and GDPR-ready communications (chat, Agora calls, phone bridges).
4. **Optimise Revenue Streams** – Launch Fixnado & Finova Ads, commission management, multi-tax/multi-currency billing, and rental/service package up-sells.
5. **Operational Excellence** – Provide analytics, admin/squad panels, observability, and inventory oversight so that operations, finance, and compliance can scale confidently.

## Feature Pillars & Highlights
| Pillar | Capabilities | Target Outcomes |
| --- | --- | --- |
| **Geo-Zonal Intelligence** | Polygon zone creation, zone area management, zone-based discovery, multi-zone services & packages, zone analytics | Accurate provider matching, reduced travel time, smart surge planning |
| **Service Acquisition & Lifecycle** | On-demand vs booked flows, custom job profiles (description, budget, attachments, zones), bidding/queries/comments, acceptance & rejection, dispute entry points, booking funnels | Transparent workflows, faster conversion, auditable history |
| **Provider & Marketplace Experience** | Business fronts with banners/video/galleries, servicemen profiles with avatars & certifications, service packages/custom offers, marketplace rentals & sales, inventory check-in/out | Rich brand presence, diversified revenue, better provider retention |
| **Communications & Collaboration** | Chat with provider-managed AI keys (OpenAI/Claude), Agora video & phone calling, notification routing, dispute messaging, comment threads | Faster resolution, compliant communications, better CSAT |
| **Governance & Compliance** | Admin/Servicemen/Provider/SME/Enterprise panels, ID/insurance/DBS verification, commission engine, document repository, security hardening, GDPR tooling | Regulatory readiness, controlled access, reduced manual effort |
| **Monetisation & Ads** | Fixnado Ads inventory, Finova Ads campaign manager (PPC, PPConversion, PPI, timed), targeting, budgets, reports | Trackable marketing ROI, new revenue channels |
| **Internationalisation & Finance** | Multi-tax, multi-currency, multi-language, UK compliance baselines, marketplace matching for insured sellers, payment localisation | Global-ready operations with UK-first compliance |
| **Analytics & Insight** | Booking funnels, zone heatmaps, inventory turnover, ad performance, dispute metrics, SLA dashboards | Data-driven decisions, proactive interventions |

## Personas & Key Journeys
- **Consumers**: Discover services & rentals via explorer, filter by zone or compliance badges, request custom jobs, join chat/video, manage bookings, view analytics-driven recommendations.
- **Servicemen**: Receive zone-based job leads, join multi-person assignments, configure AI chat assistance, upload documents, manage availability, view commissions, and respond to disputes.
- **Providers & SMEs**: Configure business fronts, manage servicemen teams, maintain inventory, launch service packages, handle bids, monitor ads, and enforce compliance across staff.
- **Enterprises**: Coordinate multi-zone jobs, integrate into panels with custom analytics, manage SLA commitments, and use Finova Ads for co-marketing.
- **Administrators & Compliance Officers**: Operate from an expanded admin panel covering user management, commission policies, verification workflows, dispute arbitration, analytics, and GDPR tooling.

## Success Metrics
- ≥85% of bookings auto-matched within correct zones and compliance requirements.
- ≥70% of custom jobs progressing from bid to acceptance with complete audit history.
- <5% compliance document expiry at any time due to automated reminders and panel alerts.
- ≥30% adoption of marketplace rentals or tool sales among pilot providers within 90 days.
- ≥50% of provider chats leveraging AI-assisted replies when keys are configured.
- ≥95% uptime across chat, Agora video/phone, and notification systems during hypercare.
- Double-digit lift in ad revenue quarter-over-quarter post-launch (Fixnado + Finova combined).

## Dependencies & Constraints
- **Technical**: Requires geo-indexing (PostGIS or equivalent), secure vaulting for API keys, Agora SDK integration across web and Flutter, scalable chat infrastructure, and data warehouse updates for analytics.
- **Regulatory**: Must maintain GDPR consent tracking, implement UK DBS & insurance validation, and enforce insured-only marketplace listings.
- **Operational**: New support playbooks for disputes, rentals, ads, and compliance. Training required for multi-panel operations.
- **Financial**: Multi-currency FX feeds, multi-tax computation, commission settlement processes aligned with HMRC expectations.

## Risk Analysis & Mitigations
| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Incorrect zone polygons leading to mismatched bookings | High cancellation rate | Medium | Provide zone simulation tools, QA geo-fencing, allow staged rollout per region |
| AI-generated content violating policy or user expectations | Legal/reputational | Medium | Implement prompt guidelines, moderation hooks, opt-in consent, and provider-level throttling |
| Inventory inaccuracies causing rental disputes | Financial loss | Medium | Enforce check-in/out confirmations, photo evidence, reconciliations, integration with barcode/QR scanning |
| Document verification backlog | Compliance risk | Medium | Staff compliance queue, automate reminders, prioritise expiring docs in dashboards |
| Complex booking flow overwhelming users | Conversion drop | Low/Medium | Prototype with UX testing, progressive disclosure, contextual help, mobile-first design |
| Agora service outage | Communication blackout | Low | Provide PSTN fallback, notify users, maintain redundant provider |

## Deliverables
- Updated backend services & schemas for zones, bookings, inventory, documents, ads, analytics, and security auditing.
- Frontend web modules for explorer, marketplace, panels, chat/calls, analytics, and banners.
- Flutter app parity across Servicemen, User, Provider, and Enterprise applications, including voice/video and multilingual support.
- Admin, Servicemen, Provider/SME, and Enterprise panel enhancements with role-based access control and analytics widgets.
- Documentation (API specs, SOPs, compliance guides, support playbooks) and training curriculum for internal teams.
- Observability artefacts (dashboards, alerts) and compliance evidence packs for UK regulators.

## Out of Scope (for Version 1.00)
- Automated hardware integration (IoT sensors for tools) – slated for later release.
- Third-party marketplace aggregation beyond Fixnado-operated listings.
- AI auto-pricing for bids (manual controls only in 1.00).

## Alignment & Next Steps
1. Review this brief with product, legal, compliance, marketing, and operations leadership.
2. Approve resource plan and sequencing, then formalise epics/stories in the tracker with traceability to this document.
3. Transition to the detailed execution blueprint in `features_update_plan.md` for planning, and maintain status in the update progress tracker.
4. Begin cross-functional kick-off and discovery workshops per feature pillar.
