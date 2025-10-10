# Version 1.50 – Features Update Plan

## Phase 1 – Foundations & Architecture
1. Audit existing schemas and APIs to catalogue gaps for zone management, bookings, inventory, ads, and compliance data, documenting migration impacts.
2. Extend authentication, authorization, and user role matrices to support Admin, Servicemen, SME Provider, and Enterprise panels with granular permissions, 2FA, and device management.
3. Localise the platform for multi-language, multi-currency, and multi-tax requirements; prepare configuration services, translation keys, currency conversion providers, and tax computation engines.
4. Upgrade security posture with GDPR-compliant consent capture, encryption reviews, audit logging baselines, and penetration testing of public endpoints.
5. Establish data retention and backup strategies covering chat logs, documents, media, bookings, and financial transactions.

## Phase 2 – Zone Intelligence & Service Matching
1. Design database models for polygon zone creation, zone areas, zone hierarchies, and zone-service relationships with versioning.
2. Build APIs and admin tooling for zone CRUD operations, service zoning, and multi-zone package assignment, including bulk upload/import tooling.
3. Implement zone-aware matching logic that filters providers, listings, ads, and Finova campaign audiences based on client location, compliance status, and availability.
4. Update explorer global search and on-site banner targeting to leverage zone metadata, heatmaps, and radius-based fallbacks for sparse areas.
5. Deliver monitoring dashboards for zone coverage gaps, overlapping polygons, and inactive services.

## Phase 3 – Booking Models & Workforce Management
1. Expand booking services to support on-demand dispatch, scheduled appointments, recurring bookings, and mixed bookings that include rentals or tool drop-offs.
2. Enhance booking flow UI/UX across web and Flutter apps to capture availability, payment preferences, compliance prerequisites, and required documents.
3. Introduce multi-serviceman assignment, workload balancing, shared calendars, and task checklists for team-based jobs with status tracking.
4. Document function flows covering job creation, reassignment, escalation, completion, follow-up, and client feedback loops within each panel.
5. Integrate booking notifications across email, SMS, push, and in-app channels with localisation and timezone awareness.

## Phase 4 – Custom Jobs, Bidding & Collaboration
1. Implement custom job creation forms capturing profile, description, budget, media, compliance requirements, and location details with draft autosave.
2. Deliver bid lifecycle features: bid submission, edits, acceptance/rejection, comments, attachments, and audit history with timestamped status changes.
3. Add custom job query threads allowing clients and providers to ask clarifying questions before bid acceptance, with escalation paths to disputes.
4. Integrate AI-assisted drafting for bids and responses when providers connect OpenAI or Claude API keys, including token usage caps and moderation filters.
5. Provide analytics on bid performance, win/loss reasons, and response time to help providers optimise proposals.

## Phase 5 – Marketplace, Rentals & Inventory
1. Extend marketplace schemas to support tool rentals, sales listings, service packages, and bundled materials with stock tracking and supplier linkage.
2. Build inventory management dashboards for providers to monitor quantities, reservations, reorder thresholds, utilisation analytics, and low-stock alerts.
3. Create rental workflows including availability calendars, pricing rules, deposits, delivery/pickup logistics, damage assessment, and return confirmation.
4. Enable marketplace filters for insured-only sellers and highlight compliance badges on listings, search results, and provider profiles.
5. Integrate inventory movements with bookings and custom jobs so consumables and tools are reserved automatically.

## Phase 6 – Communications & Engagement
1. Upgrade messaging infrastructure with inbox management, categorisation, message retention policies, and spam/scam detection heuristics.
2. Add AI response capabilities in chat when providers opt-in with their own API keys, ensuring token usage tracking, moderation, and manual override controls.
3. Integrate Agora SDK for in-app voice and video calls within web and Flutter clients; provide scheduling from booking flows and post-call feedback prompts.
4. Launch on-site banners, business front profiles, and explorer enhancements showcasing videos, reviews, social links, and geo-targeted promotions.
5. Implement messaging analytics covering response times, AI usage ratios, and customer satisfaction ratings.

## Phase 7 – Panels, Administration & Monetisation
1. Build dedicated dashboards for Admin, Servicemen, SME Provider, and Enterprise users with contextual analytics metrics, onboarding checklists, and notifications.
2. Implement commission management tools configurable by service type, zone, provider tier, booking channel, and campaign participation with reconciliation exports.
3. Roll out Fixnado and Finova Ads modules covering PPC, PPConversion, PPI billing, campaign budgets, targeting rules, scheduling, creative management, and performance reporting.
4. Provide service listing management controls for categorisation, subcategories, multi-zone availability, upsell add-ons, and seasonal pricing.
5. Introduce revenue dashboards combining ads, commissions, rentals, and service sales to inform growth decisions.

## Phase 8 – Compliance & Trust
1. Deploy ID, DBS, and insurance verification workflows with document upload, automated validation partners, expiry reminders, and escalation paths.
2. Ensure UK regulatory compliance by mapping legal requirements to product features, reporting, data retention policies, and consent management.
3. Add transparency features such as compliance dashboards, badges, user notifications when statuses change, and public trust signals on profiles.
4. Integrate dispute management workflows for clients and providers, linking to bookings, custom jobs, chat history, and financial transactions with SLA tracking.
5. Provide audit exports and evidence packages to support insurance claims, mediation, and legal requests.

## Phase 9 – Quality Assurance & Launch Readiness
1. Create end-to-end test plans for booking scenarios, marketplace transactions, AI messaging, rentals, and compliance flows across all panels and device types.
2. Validate multi-language, currency, and tax configurations in staging environments; ensure Flutter apps mirror functionality and pass store submission guidelines.
3. Conduct performance benchmarking for search, ads delivery, zone matching, live communications, and inventory synchronisation under peak load.
4. Finalise release documentation, training materials, migration guides, and support playbooks before production rollout of Version 1.50.
5. Run phased launch checkpoints, including beta testing, go/no-go reviews, and post-release monitoring plans.
