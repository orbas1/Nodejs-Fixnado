# Version 1.50 – Features Update Plan

## Phase 1 – Foundations & Architecture
1. Audit existing schemas and APIs to catalogue gaps for zone management, bookings, inventory, and compliance data.
2. Extend authentication, authorization, and user role matrices to support Admin, Servicemen, SME Provider, and Enterprise panels with granular permissions.
3. Localise the platform for multi-language, multi-currency, and multi-tax requirements; prepare configuration services and translation keys.
4. Upgrade security posture with GDPR-compliant consent capture, encryption reviews, and audit logging baselines.

## Phase 2 – Zone Intelligence & Service Matching
1. Design database models for polygon zone creation, zone areas, and zone-service relationships.
2. Build APIs and admin tooling for zone CRUD operations, service zoning, and multi-zone package assignment.
3. Implement zone-aware matching logic that filters providers, listings, and ads based on client location and compliance status.
4. Update explorer global search and on-site banner targeting to leverage zone metadata.

## Phase 3 – Booking Models & Workforce Management
1. Expand booking services to support on-demand dispatch, scheduled appointments, and mixed bookings that include rentals.
2. Enhance booking flow UI/UX across web and Flutter apps to capture availability, payment preferences, and required documents.
3. Introduce multi-serviceman assignment, workload balancing, and shared calendars for team-based jobs.
4. Document function flows covering job creation, reassignment, escalation, completion, and follow-up within each panel.

## Phase 4 – Custom Jobs, Bidding & Collaboration
1. Implement custom job creation forms capturing profile, description, budget, media, and location details.
2. Deliver bid lifecycle features: bid submission, edits, acceptance/rejection, comments, and audit history.
3. Add custom job query threads allowing clients and providers to ask clarifying questions before bid acceptance.
4. Integrate AI-assisted drafting for bids and responses when providers connect OpenAI or Claude API keys.

## Phase 5 – Marketplace, Rentals & Inventory
1. Extend marketplace schemas to support tool rentals, sales listings, and service packages with stock tracking.
2. Build inventory management dashboards for providers to monitor quantities, reservations, reorder thresholds, and utilisation analytics.
3. Create rental workflows including availability calendars, pricing rules, deposits, and return confirmation.
4. Enable marketplace filters for insured-only sellers and highlight compliance badges on listings.

## Phase 6 – Communications & Engagement
1. Upgrade messaging infrastructure with inbox management, categorisation, and message retention policies.
2. Add AI response capabilities in chat when providers opt-in with their own API keys, ensuring token usage tracking and safety checks.
3. Integrate Agora SDK for in-app voice and video calls within web and Flutter clients; provide scheduling from booking flows.
4. Launch on-site banners, business front profiles, and explorer enhancements showcasing videos, reviews, and social links.

## Phase 7 – Panels, Administration & Monetisation
1. Build dedicated dashboards for Admin, Servicemen, SME Provider, and Enterprise users with contextual analytics metrics.
2. Implement commission management tools configurable by service type, zone, provider tier, and campaign participation.
3. Roll out Fixnado and Finova Ads modules covering PPC, PPConversion, PPI billing, campaign budgets, targeting rules, and scheduling.
4. Provide service listing management controls for categorisation, subcategories, and multi-zone availability.

## Phase 8 – Compliance & Trust
1. Deploy ID, DBS, and insurance verification workflows with document upload, validation, expiry reminders, and escalation paths.
2. Ensure UK regulatory compliance by mapping legal requirements to product features, reporting, and data retention policies.
3. Add transparency features such as compliance dashboards, badges, and user notifications when statuses change.
4. Integrate dispute management workflows for clients and providers, linking to bookings, custom jobs, and chat history.

## Phase 9 – Quality Assurance & Launch Readiness
1. Create end-to-end test plans for booking scenarios, marketplace transactions, AI messaging, and compliance flows across all panels.
2. Validate multi-language, currency, and tax configurations in staging environments; ensure Flutter apps mirror functionality.
3. Conduct performance benchmarking for search, ads delivery, zone matching, and live communications.
4. Finalise release documentation, training materials, and migration guides before production rollout of Version 1.50.
