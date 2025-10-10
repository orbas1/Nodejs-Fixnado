# Version 1.00 – New Feature Brief

## Purpose
Version 1.00 is focused on transforming Fixnado into a fully-fledged services and marketplace ecosystem covering on-demand bookings, managed inventory, advertising, and compliance-driven provider vetting. This brief captures the problem statements, the desired outcomes, and the rationale for each high-priority capability so that engineering, design, QA, and compliance teams can align on a single delivery narrative.

## Strategic Goals
1. **Unify Service Supply & Demand** – Introduce sophisticated provider-to-client matching, zonal discovery, and booking flows that operate across web and Flutter apps for users, servicemen, SMEs, and enterprise customers.
2. **Enable Monetisation & Growth** – Support multi-tier service offerings, marketplace commerce, Fixnado/Finova ad products, and commission management while keeping revenue operations auditable.
3. **Guarantee Trust & Compliance** – Enforce UK-specific insurance, DBS, GDPR, and ID validation workflows with dispute resolution, document management, and secure communications.
4. **Operational Excellence** – Deliver analytics, admin visibility, and structured inventory/rental oversight so operations teams can monitor performance and scale with confidence.

## Feature Overview
| Theme | Capabilities | Target Outcomes |
| --- | --- | --- |
| **Geo-Zonal Intelligence** | Zone creation, polygon-based service areas, zonal service catalogues, multi-zone offerings, location-aware matching | Accurate provider suggestions, reduced travel time, intelligent surge planning |
| **Service Acquisition** | On-demand & scheduled bookings, multi-serviceman assignments, custom job creation, bidding, queries, comments, acceptance/rejection flows | Increased job conversion, transparency for clients, equitable work distribution |
| **Marketplace & Inventory** | Tool rentals and sales, inventory tracking, service package management, marketplace matching for insured sellers only | Diversified revenue, audited stock levels, reduced fraud |
| **Provider & Client Experience** | Rich profile pages (avatars, banners, media, reviews, showcases, social links), business fronts, explorer page, chat (incl. AI responses via OpenAI/Claude APIs), video & phone calls via Agora | Enhanced engagement, trust, and multi-channel communication |
| **Governance & Security** | Commission configuration, admin/servicemen/provider/enterprise panels, user management, dispute workflows, insurance & document verification, GDPR compliance | Controlled operations, regulatory adherence, documented audit trails |
| **Global Reach & Finance** | Multi-tax, multi-currency, multi-language support, Fixnado & Finova ad stacks with targeting and budgeting tools | Localised experiences, scalable marketing, monetisation flexibility |
| **Insights & Oversight** | Analytics dashboards, booking funnels, inventory metrics, ad performance reporting | Data-driven decision making, optimisation of service and ad spend |

## Personas & Journeys Affected
- **Consumers**: Discover services via explorer & zonal search, evaluate providers through rich profiles, create custom jobs, rent tools, and manage bookings.
- **Servicemen**: Receive zonal job leads, manage availability, join teams for large jobs, respond via AI-assisted chat, and showcase portfolios.
- **SME Providers & Enterprises**: Operate storefront-style business fronts, coordinate multiple servicemen, manage inventory, and launch Finova ad campaigns.
- **Administrators**: Configure commissions, enforce compliance, monitor disputes, manage user roles, and access granular analytics.

## Success Metrics
- ≥85% of bookings auto-matched to providers within correct zones.
- <5% compliance document expiry at any given time through proactive alerts.
- ≥30% adoption rate of marketplace rentals in pilot regions.
- ≥50% of provider conversations utilising AI-assisted replies when API keys configured.
- ≥95% uptime across communication touchpoints (chat, Agora calls).

## Constraints & Dependencies
- All data handling must remain GDPR compliant with clear consent and audit logging.
- Agora integration requires native support in Flutter apps and web clients with fallback to phone call bridging.
- AI chat responses must respect rate limits and key management policies per provider.
- Multi-currency and tax logic must integrate with existing billing infrastructure and HMRC reporting expectations.
- Marketplace operations must restrict listings to insured sellers by default, verified through the ID/document workflow.

## Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Incorrect zonal boundaries leading to mismatched bookings | Customer dissatisfaction, increased cancellations | Provide geo-fencing QA tools, allow admins to simulate coverage before publishing |
| AI-generated chat content violating policy | Legal & reputational | Implement prompt guidelines, moderation hooks, and opt-in consent for providers |
| Inventory inaccuracies | Lost revenue, double-bookings | Implement periodic stock reconciliations, check-in/out confirmations, and device scanning (future enhancement) |
| Non-compliance with UK regulations | Fines, operational shutdown | Embed compliance checkpoints during onboarding, automatic reminders before document expiry |
| Complex booking flows overwhelming users | Abandonment | Design UX prototypes with user testing, progressive disclosure of advanced options |

## Deliverables
- Updated schemas and APIs for zones, bookings, inventory, ads, and compliance artifacts.
- Admin and provider panel modules with role-based access control for new capabilities.
- Flutter app updates covering servicemen, user, provider, and enterprise variants.
- Documentation updates (user guides, compliance SOPs) and training for operations/support teams.

## Alignment & Next Steps
- Validate scoping with product, legal, and marketing stakeholders.
- Finalise resource allocation for backend, frontend, mobile, and QA squads.
- Lock requirements in JIRA/Linear with traceability to this brief.
- Transition to the detailed update plan in `features_update_plan.md` for execution sequencing.

