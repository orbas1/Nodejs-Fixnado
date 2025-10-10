# Version 1.50 – New Feature Brief

## Overview
Version 1.50 focuses on transforming Fixnado into an AI-augmented service marketplace where homeowners, tenants, SMEs, and enterprise facility teams can seamlessly discover, book, and manage professional services. The release expands geographic intelligence, multi-sided marketplace operations, and compliance tooling while unifying every participant experience across web, backend, and Flutter applications. The update also introduces monetisation and analytics layers so stakeholders can measure performance, optimise campaigns, and ensure every engagement meets UK and GDPR compliance standards.

## Personas & Value Propositions
- **Consumers & Tenants:** Effortlessly discover insured, compliant professionals within their service zones, compare bids, ask clarifying questions, and book onsite or remote services with transparent pricing and documentation.
- **Servicemen & Independent Contractors:** Manage multi-zone availability, advertise packaged or custom offerings, coordinate teams, automate communications with AI, and maintain compliance records from a single panel.
- **SME & Enterprise Providers:** Orchestrate fleets of servicemen, manage shared inventory and rentals, leverage Finova Ads to boost visibility, and control commissions, taxes, and currencies at scale.
- **Marketplace Operations & Admins:** Configure zoning policies, manage disputes, enforce ID/DBS/insurance verifications, monitor analytics, and ensure multi-language localisation with granular access controls.

## Feature Pillars

### 1. Hyper-Local Zone Intelligence & Matching
- Introduce polygon-based zone creation with granular zone area management to align providers with precise service territories.
- Deliver zone-level service catalogues, enabling zonal, multi-zone, and cross-zone service packages with accurate availability and pricing.
- Power location matching so jobs, marketplace listings, and promotional banners automatically surface to users inside targeted zones.

### 2. Flexible Booking & Service Fulfilment Models
- Support both on-demand dispatching and scheduled bookings for services and rentals, with clear booking flows for users and providers.
- Enable multi-serviceman deployments where teams can be assigned to a single job, share schedules, and coordinate tasks.
- Expand function flows to cover job intake, reassignment, escalation, and completion sign-off for all service types and panels.

### 3. Provider & Client Matching Enhancements
- Build intelligent provider-to-client matchmaking that leverages zone data, service categories, compliance status, and historical performance.
- Allow providers to offer individual services, curated service packages, and bespoke custom services tailored to client needs.
- Capture rich custom job details—profile, description, budget, media, and location—to fuel better recommendations and success metrics.

### 4. Marketplace, Rentals, & Inventory Ecosystem
- Extend the marketplace to support renting and selling tools, materials, and service packages with inventory tracking per provider.
- Introduce rental of tools alongside service bookings, complete with availability calendars, deposit handling, and return workflows.
- Provide end-to-end inventory management for servicemen, SMEs, and enterprises, including stock levels, reorder alerts, and analytics.

### 5. Custom Jobs Collaboration & Bidding
- Implement end-to-end workflows for creating, querying, bidding, accepting/rejecting, and commenting on custom jobs.
- Enable both clients and providers to ask and answer custom job queries with threaded messaging linked to each bid.
- Surface bid comparison tools and history so clients can evaluate offers, negotiate, and approve work confidently.

### 6. AI-Assisted Communications & Messaging
- Integrate AI response tooling by allowing servicemen and providers to connect OpenAI or Claude API keys for chat assistance.
- Upgrade the chat system with inbox management, message categorisation, and automation templates powered by AI suggestions.
- Support real-time video and phone calls via Agora within web and Flutter apps, expanding collaboration options during quoting and service delivery.

### 7. Compliance, Security, and Trust
- Enforce ID, DBS, and insurance verification with document uploads, expiry tracking, and compliance dashboards.
- Ensure GDPR adherence and UK regulatory compliance across data handling, consent, audit trails, and reporting.
- Add marketplace filters to surface insured-only sellers and display compliance badges throughout user journeys.

### 8. Multi-Panel Experience & User Management
- Deliver dedicated panels for Admin, Servicemen, SME Providers, and Enterprise accounts with tailored workflows and permissions.
- Provide user management tooling that spans account creation, role assignments, access control, and secure authentication.
- Introduce avatars, banners, and business fronts (video, imagery, project showcases, reviews, websites, social links) for rich profile experiences.

### 9. Marketing, Ads, and On-Site Engagement
- Launch Fixnado and Finova Ads suites, covering PPC, PPConversion, PPI models, campaign budgeting, targeting, and scheduling.
- Enable on-site banners and explorer pages with global search to amplify discovery, promotions, and geo-targeted campaigns.
- Offer analytics metrics dashboards to monitor ad performance, service uptake, and operational efficiency across panels.

### 10. Financial & Operational Controls
- Introduce commission management configurable by service type, zone, and provider tier.
- Support multi-currency, multi-tax, and multi-language operations to cater to regional and international customers.
- Enhance service listing management, bookings, and marketplace transactions with auditable payment and compliance records.

## Experience Scenarios
- **Explorer Discovery Flow:** Users land on the explorer page, filter by service category, and are presented with zone-matched providers and tool rentals, complemented by on-site banners and Finova Ads tailored to their region.
- **Custom Job Collaboration:** A commercial client drafts a bespoke maintenance request with media attachments, receives AI-assisted bid summaries from multiple providers, conducts live Agora video walkthroughs, and selects the preferred team using bid comparison analytics.
- **Provider Operations:** A serviceman configures multi-zone availability, reserves shared equipment via inventory dashboards, syncs bookings to the Flutter mobile app, and leverages AI chat templates to respond instantly to client messages.
- **Admin Compliance Oversight:** Administrators monitor ID, DBS, and insurance expirations from a central compliance panel, trigger reminders, review dispute queues with linked chat history, and export GDPR-compliant audit trails.

## Technical & Architectural Considerations
- Establish geospatial database support (e.g., PostGIS) for polygon zones, heatmaps, and zone-based analytics.
- Introduce microservice-friendly contracts for bookings, inventory, messaging, ads, and compliance, ensuring consistent APIs across web, backend Node.js services, and Flutter clients.
- Implement secure storage for provider-supplied OpenAI/Claude API keys with usage monitoring, throttling, and fallbacks.
- Standardise event streams (e.g., via Kafka or Redis Streams) for booking updates, inventory changes, dispute escalations, and ad campaign triggers to unlock near-real-time dashboards.
- Expand infrastructure observability—structured logging, distributed tracing, and proactive alerting—covering Agora communications, payment flows, and marketplace transactions.

## Data, Compliance & Security Requirements
- Capture explicit consent for AI-assisted messaging, storing consent artefacts per user per locale.
- Encrypt sensitive identity documents at rest and in transit, storing checksum metadata for tamper detection.
- Retain immutable audit trails linking bookings, disputes, payments, chat logs, and compliance statuses in accordance with UK statutory requirements.
- Introduce role-based data access policies so that each panel (Admin, Servicemen, SME Provider, Enterprise) can only view authorised customer and financial information.
- Provide GDPR tooling: data subject access request handling, erasure workflows, consent revocation, and breach notification playbooks.

## Success Metrics & KPIs
- **Adoption:** % increase in active zonal services and custom job postings; number of providers completing compliance verification.
- **Engagement:** Reduction in time-to-first-response via AI chat templates; average number of messages, video calls, and bids per custom job.
- **Monetisation:** Growth in Fixnado/Finova Ads revenue, tool rental utilisation rates, and commission capture accuracy across currencies.
- **Operational Excellence:** SLA adherence for bookings, dispute resolution time, and inventory turnover metrics segmented by provider type.

## Risks & Mitigations
- **Complexity of Multi-Panel UX:** Mitigate through shared component libraries, panel-specific UX guidelines, and early usability testing with each persona.
- **AI Integration Compliance:** Provide clear documentation on acceptable use, monitor logs for misuse, and allow admins to revoke API key access instantly.
- **Marketplace Fraud & Disputes:** Strengthen identity checks, introduce behavioural analytics to detect suspicious listings, and integrate mediation workflows.
- **Performance Under Load:** Conduct load tests on zone search, ads delivery, and media-heavy profiles; utilise CDN caching for static assets and employ auto-scaling policies.
- **Change Management:** Deliver comprehensive release notes, tutorials, and in-app tours to ease adoption by existing providers and enterprise clients.

## Quality Assurance Strategy
- Expand automated test suites to cover zone-matching algorithms, booking permutations, inventory transactions, and AI chat fallbacks.
- Run accessibility reviews (WCAG 2.1) across new panels, profiles, and booking flows, including localisation checks for right-to-left languages.
- Stage beta programmes with select providers and enterprise partners to validate Agora communications, ad campaign set-up, and dispute handling end-to-end.
- Establish observability dashboards and alert thresholds before production rollout to capture regressions early.

## Expected Outcomes
- Increase conversion by matching clients with compliant providers offering the right services in the right zones and languages.
- Improve operational efficiency through inventory visibility, commission automation, AI-assisted collaboration, and integrated custom job workflows across all panels.
- Strengthen trust and retention by combining rigorous compliance, real-time collaboration, transparent documentation, and data-driven insights for every stakeholder.
