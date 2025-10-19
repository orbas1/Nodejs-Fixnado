# Fixnado Version 1.00 – Issue List

## 1. Release Readiness & Automation Gaps
- No automated provisioning or deployment tooling; environments require manual setup without rollback or blue/green safety nets.
- Database migrations and seeders are unscripted, lacking validation, rollback plans, and starter data coverage for services, rentals, materials, zones, and tags.
- Observability stack is incomplete—no uptime helper dashboards, load balancing visibility, RAM profiling, or stress testing baselines.

## 2. Security & Compliance Weaknesses
- RBAC is inconsistently enforced across web, API, chat, and mobile surfaces; learner/instructor remnants create unintended access paths.
- File submission protection, spam/bad word scanning, report workflows, and GDPR tooling are absent or stubbed.
- UK-compliant legal documents, policy acknowledgement flows, and documentation trails are missing.

## 3. Marketplace & Commerce Deficiencies
- Service, rental, and material flows are fragmented; finance, escrow, tax, and wallet controls live in separate dashboards or not at all.
- Explorer/search lacks comprehensive filters for zones, categories, pricing, qualifications, and recommendations.
- Storefronts, business fronts, and timeline monetisation are underdeveloped, preventing ad/recommendation placements and CRUD completeness.

## 4. Timeline Hub & Support Shortcomings
- Live feed is still named “Live Feed” with learner-centric copy; timeline hub features (Timeline, Custom Job Feed, Marketplace Feed tabs, ads, recommendations, follow/unfollow, reporting) are incomplete.
- No orchestration exists to prioritise custom job requests or marketplace inventory updates, leaving feeds without urgency signalling and analytics.
- Support channels do not integrate Chatwoot; no floating chat bubble, dashboard inbox, attachments, emoji/GIF support, or help center links.

## 5. Mobile Parity & Performance Issues
- Flutter app retains learning terminology, lacks role changer onboarding, and does not expose marketplace dashboards or checkout flows.
- Timeline hub tabs, storefront, and support features are missing or static; no parity with web experiences.
- Mobile diagnostics, Firebase integrations, offline caching, media handling, and in-app purchase compliance are unimplemented.

## 6. Documentation & Knowledge Base Gaps
- README, full guide, starter data references, and GitHub upgrade instructions are outdated or absent.
- No changelog, update brief, or end-of-update reporting framework tied to release readiness.
- Training materials, support playbooks, and maintenance mode procedures are missing for operations handover.
