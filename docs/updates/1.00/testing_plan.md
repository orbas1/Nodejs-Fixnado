# Fixnado Version 1.00 – Testing Plan

## 1. Testing Objectives
- Validate the corrected marketplace scope—timeline hub, commerce flows, dashboards, policies—across web and mobile channels, replacing learner/course remnants.【F:docs/updates/1.00/new_feature_brief.md†L3-L126】【F:docs/updates/1.00/features_to_add.md†L3-L28】
- Confirm deployment automation, RBAC, content safety, GDPR tooling, and legal acknowledgements operate end-to-end before launch.【F:docs/updates/1.00/features_update_plan.md†L3-L47】【F:docs/updates/1.00/pre-update_evaluations/issue_report.md†L3-L35】
- Ensure all release readiness commitments—including financial, timeline hub, service purchase, rental, material purchase, zone, AI, and integration tests—are executed with evidence for compliance and operations handover.【F:docs/updates/1.00/new_feature_brief.md†L83-L126】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L3-L31】

## 2. Test Governance & Traceability
- Maintain a requirement-to-test matrix aligning feature pillars and issues with automated and manual coverage tracked in `update_progress_tracker.md` and `update_task_list.md` subtasks.【F:docs/updates/1.00/update_progress_tracker.md†L5-L67】【F:docs/updates/1.00/update_task_list.md†L6-L299】
- Integrate testing checkpoints into Milestones 1–5 exit criteria so downstream work only begins once evidence is captured.【F:docs/updates/1.00/update_milestone_list.md†L3-L54】
- Store artefacts (logs, screenshots, recordings, metrics) per test run to support legal, compliance, and operational reviews.【F:docs/updates/1.00/pre-update_evaluations/issue_list.md†L3-L33】

## 3. Automated Test Coverage
### 3.1 Backend
- Unit tests for services covering timeline hub orchestration, commerce/finance, recommendation scoring, and integration adapters.【F:docs/updates/1.00/update_task_list.md†L92-L140】
- Integration tests verifying checkout (services, rentals, materials), escrow, refunds, tax, wallet operations, and Chatwoot/Firebase connectors.【F:docs/updates/1.00/update_task_list.md†L112-L140】
- Load/stress tests targeting timeline hub feeds (Timeline, Custom Job, Marketplace) and concurrent checkout flows to validate high-usage commitments.【F:docs/updates/1.00/new_feature_brief.md†L14-L126】

### 3.2 Front-end (Web)
- Component/unit tests for timeline hub cards and widgets, storefront/checkout forms, dashboards, mega menus, and policy pages.【F:docs/updates/1.00/update_task_list.md†L145-L194】
- Accessibility and visual regression tests to ensure enterprise styling, text wrapping fixes, and simplified copy.【F:docs/updates/1.00/features_update_plan.md†L66-L82】
- End-to-end browser suites covering registration, role changer, timeline hub interactions, explorer filters, service/rental/material purchases, dashboards, policies, and support bubble flows.【F:docs/updates/1.00/new_feature_brief.md†L36-L126】

### 3.3 Mobile (User & Provider Apps)
- Integration/golden tests for navigation (splash, role changer, tabs), timeline hub parity, checkout, wallet, dashboards, and support modules.【F:docs/updates/1.00/update_task_list.md†L198-L236】
- Performance tests capturing frame times, memory, battery impact during event playback, media uploads, and offline caching scenarios.【F:docs/updates/1.00/update_task_list.md†L239-L246】
- Automated device farm runs for iOS/Android covering user and provider flows, with telemetry assertions for Firebase/Chatwoot integrations.【F:docs/updates/1.00/features_update_plan.md†L83-L97】

### 3.4 API & Database
- Contract tests validating REST/WebSocket/GraphQL endpoints for timeline hub, commerce, support, and intelligence services, including backwards compatibility for renamed timeline routes.【F:docs/updates/1.00/update_task_list.md†L92-L140】
- Database migration/seed validation ensuring transactional integrity, starter data completeness (services, rentals, materials, zones, tags), and rollback success.【F:docs/updates/1.00/update_task_list.md†L6-L24】
- Security tests (RBAC, rate limiting, injection, encryption) and GDPR consent/export/delete flows across all data stores.【F:docs/updates/1.00/update_task_list.md†L49-L75】

## 4. Manual Test Coverage
- **Release rehearsals:** Execute blue/green cutover drills, rollback, and crisis scenarios using the automated tooling to validate operational readiness.【F:docs/updates/1.00/update_task_list.md†L36-L44】【F:docs/updates/1.00/update_task_list.md†L292-L299】
- **Functional walkthroughs:** Manual verification of persona dashboards (user, serviceman, crew, provider, enterprise, admin), pipeline/calendar/finance widgets, and analytics overlays.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L165-L183】
- **Support & compliance flows:** Validate Chatwoot bubble/inbox, help center search, attachments, emojis/GIFs, report buttons, spam moderation, legal acknowledgement prompts, GDPR requests, and policy views.【F:docs/updates/1.00/new_feature_brief.md†L67-L126】【F:docs/updates/1.00/update_task_list.md†L69-L88】【F:docs/updates/1.00/update_task_list.md†L228-L236】
- **Commerce scenarios:** End-to-end tests for service purchase, rentals, material purchase, wallet top-up, refunds, tax calculation, escrow release, invoice exports, and analytics dashboards.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L112-L120】
- **Zone and taxonomy validation:** Manual spot checks of global zone hierarchy, category/tag filters, SEO/hashtag recommendations, and zone-aware dashboards.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/pre-update_evaluations/fix_suggestions.md†L13-L21】

## 5. Non-Functional & Compliance Testing
- **Performance/Load:** Simulate peak usage for timeline hub feeds, checkout, Chatwoot sessions, and analytics pipelines; verify RAM/server stress reductions and autoscaling behaviour.【F:docs/updates/1.00/new_feature_brief.md†L14-L126】【F:docs/updates/1.00/update_task_list.md†L26-L34】
- **Security:** Conduct penetration tests, vulnerability scans, OAuth/social login validation, RBAC audits, upload malware scanning, and spam/bad-word classifier evaluations.【F:docs/updates/1.00/pre-update_evaluations/issue_report.md†L12-L16】【F:docs/updates/1.00/update_task_list.md†L49-L67】
- **GDPR & Legal:** Verify consent logging, subject access requests, retention jobs, legal versioning, acknowledgement history, and policy word counts/links.【F:docs/updates/1.00/update_task_list.md†L69-L88】
- **Financial:** Reconcile purchases, rentals, materials, refunds, commissions, ads, escrow, and wallet transactions against finance/tax dashboards, verifying data exports and audit trails.【F:docs/updates/1.00/new_feature_brief.md†L56-L126】【F:docs/updates/1.00/update_task_list.md†L112-L120】
- **Accessibility & UX:** Run WCAG 2.1 AA checks on web and mobile, validate simplified language dropdown, text wrapping fixes, and usability heuristics for enterprise audiences.【F:docs/updates/1.00/features_update_plan.md†L66-L82】【F:docs/updates/1.00/features_to_add.md†L10-L21】

## 6. Testing Schedule & Responsibilities
- **Milestone 1:** Execute automation smoke tests for deployment scripts, RBAC checks, and legal acknowledgement flows before milestone exit.【F:docs/updates/1.00/update_milestone_list.md†L3-L13】
- **Milestone 2:** Run API/contract tests and load baselines for timeline hub and commerce services as soon as they reach staging.【F:docs/updates/1.00/update_milestone_list.md†L15-L24】
- **Milestone 3:** Conduct component, accessibility, and end-to-end web suites plus UX sign-off sessions prior to release of dashboards/policies.【F:docs/updates/1.00/update_milestone_list.md†L26-L34】
- **Milestone 4:** Perform device lab runs, Firebase/Chatwoot integration checks, and mobile parity verification ahead of milestone closure.【F:docs/updates/1.00/update_milestone_list.md†L36-L44】
- **Milestone 5:** Complete full regression, financial reconciliation, observability drills, and documentation reviews before go-live rehearsal sign-off.【F:docs/updates/1.00/update_milestone_list.md†L46-L54】

## 7. Reporting & Exit Criteria
- Update `update_progress_tracker.md` after every test cycle, capturing percentage gains per task/subtask and linking to evidence repositories.【F:docs/updates/1.00/update_progress_tracker.md†L5-L67】
- Produce QA summaries for end-of-update report, changelog, and update brief, including pass/fail matrices, defect trends, and remediation notes.【F:docs/updates/1.00/update_task_list.md†L281-L299】
- Gate release on completion of all automated suites, manual checklists, and compliance sign-offs documented in milestone exit criteria.【F:docs/updates/1.00/update_milestone_list.md†L3-L54】
