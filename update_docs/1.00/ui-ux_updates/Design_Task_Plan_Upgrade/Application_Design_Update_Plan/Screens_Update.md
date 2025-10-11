# Screen Updates — Compliance Integration (Version 1.00)

## Admin & Support Mobile Panels
- **Dispute Transcript Export Modal:** Present compliance rationale (“Transcripts include personal data. Exports are logged and require compliance approval.”) with dual confirmation buttons. CTA uses primary gradient, secondary CTA labelled “Request approval” gating export behind compliance workflow.
- **Provider Address Reveal Banner:** Default provider profile shows city + postcode district. Reveal button triggers modal with checklist referencing DPIA storage windows and RBAC audit trail. Banner copy links to support article describing temporary access rights.
- **Chat Retention Notice:** Chat threads display retention tooltip (90 days standard, 2 years for disputes). Tooltip anchored to header info icon; includes link to privacy policy and action to escalate dispute that extends retention.

## Field Service Screens
- **On-site Check-in:** Introduce consent checkbox for photographing premises. Checkbox state persisted locally and sent to backend as part of booking update payload. Inline copy references DPIA-02 mitigation (“Photos stored encrypted, deleted after dispute resolution or 180 days”).
- **Incident Reporting:** Add radio buttons for severity and optional voice note upload. Confirmation screen highlights retention and anonymisation details with direct link to issue intake process, encouraging staff to log design-impacting incidents.

## Telemetry Opt-out Prompt
- Add “Why we collect this” link next to theme toggle in settings. Link opens bottom sheet summarising hashed-IP approach, retention length (12 months), and opt-out instructions referencing support article ID KB-182.

## Status Messaging Updates
- Error toast for restricted features updated to: “Your role cannot access this feature. Contact a compliance officer or request temporary access in Slack #fixnado-support.” include `aria-live="assertive"` and `data-qa="toast-rbac-restricted"` for testing.

---
*Updated 2025-10-15 alongside compliance evidence refresh (Task 1.5).*

## Provider Inventory Dashboard (2025-10-16)
- **Hero Ledger Widget:** Three-column card presenting **On-hand**, **Reserved**, and **Damaged** counts with percentage change chips referencing previous 24-hour window. Background colour adjusts per health state (`healthy` = `color.surface.success`, `warning` = `color.surface.warning`, `critical` = `color.surface.error`). Badge label consumes `health.status` from `/api/inventory/health`.
- **Variance Summary:** Inline banner highlights last reconciliation variance (`health.lastVariance.units`), cycle count timestamp, and owner. Include CTA “Open reconciliation sheet” which navigates to modal documented below.
- **Quick Actions Row:** Buttons for `Adjust stock`, `Record cycle count`, and `View ledger`. Buttons emit telemetry events `inventory.quick_action.select` with payload `{ action, inventoryId }`.
- **Inventory List Module:** Table lists each SKU with columns `Item`, `On-hand`, `Reserved`, `Available`, `Health`, `Next Count`, `Alerts`. Rows display avatar or icon derived from category token, with `Health` column using pill components (Healthy/Watch/Critical). Clicking row opens detail drawer defined below.
- **Alert Stack:** Right rail surfaces outstanding alerts grouped by severity. Each alert includes title (“Low stock: Lithium drill batteries”), summary copy, threshold note (“Buffer 12 units, current 8”), and actions `Acknowledge`, `Snooze 4h`, `Escalate`. Snooze triggers API patch `/api/inventory/alerts/{alertId}/snooze` and pushes toast confirmation.

## Inventory Detail Drawer
- **Header:** Shows item thumbnail, SKU, category, and location metadata. Provide inline `Sync` status referencing last ledger sync timestamp.
- **Tabs:** `Overview`, `Ledger`, `Counts`, `Alerts`.
  - **Overview:** Mirrored KPIs (On-hand, Reserved, Damaged, Available), reorder point chart, supplier notes, and attachments for compliance docs.
  - **Ledger:** Paginated table (page size default 25) showing `Date`, `Type`, `Quantity`, `Balance After`, `Performed By`, `Correlation ID`, `Notes`. Filters align with API query params (`type`, `performedBy`, `from`, `to`, `correlationId`). Provide export button that triggers CSV download with watermark referencing environment and timestamp.
  - **Counts:** Timeline of scheduled and completed counts with variance outcomes; each entry includes method (Scan/Manual), counted quantity, variance delta, justification text, attachments indicator.
  - **Alerts:** Historical alerts with status (Open/Acknowledged/Resolved), severity, and resolution notes.
- **Footer Actions:** Buttons `Adjust stock` (opens adjustment form), `Record cycle count`, and `New alert` (for manual escalations). Buttons disabled for roles lacking permissions per RBAC mapping.

## Adjustment & Cycle Count Forms
- **Adjust Stock Form:** Fields `Adjustment type` (Increase, Decrease, Transfer), `Quantity`, `Reason` (dropdown referencing `inventory_adjustment_reasons`), optional `Reference ID`, and `Notes`. Validation ensures quantity >0 and reason selected. On submit, call `/api/inventory/{inventoryId}/adjust` with payload capturing `source` (manual) and `correlationId`. Show success toast “Inventory updated — ledger entry FX-{sequence} created.” and append entry to ledger table optimistically.
- **Cycle Count Modal:** Stepper with `Preparation` (instructions referencing `dashboard_drawings.md`), `Count entry`, `Variance review`. Users input counted quantity, select method, attach photo/PDF evidence. Variance review stage calculates delta using health response; if delta exceeds buffer, show inline warning and require justification textarea.
- **Accessibility:** All modals trap focus, support keyboard shortcuts (`Esc` to close, `Ctrl+Enter` to submit), and provide screen reader announcements describing variance outcomes.

## Reconciliation Sheet Workflow
- **Triggering:** Accessed from dashboard banner or ledger row flagged as variance. Pre-populated with expected vs counted values and last adjustment metadata.
- **Sections:** `Context` (auto-filled details), `Variance Analysis` (multi-select for cause: Miscount, Damaged goods, Supplier shortage, Theft risk, Other), `Action Plan` (assign follow-up owner, due date), `Supporting Evidence` (file upload, max 5 attachments, 10MB each).
- **Submission:** On submit, call `/api/inventory/{inventoryId}/reconcile` with payload capturing variance analysis selections, notes, attachments metadata, and chosen action owner. Display success summary card with reconciliation ID and link to audit log. Post-submission UI updates health widget and closes outstanding alerts referencing reconciliation.
- **Audit Trail:** Add timeline entry with state `Reconciled` including user, timestamp, variance delta, and attachments count. Provide `Download reconciliation report` button generating PDF summary via backend.

## Alert Behaviour Specifications
- **Severity Mapping:**
  - *Warning:* Stock below buffer but above critical floor. Colour uses `color.alert.warning`. Provide CTA `Restock plan` linking to purchase order surface.
  - *Critical:* Stock below critical floor or variance unresolved >24h. Uses `color.alert.critical` and triggers Slack webhook `#fixnado-ops` after acknowledgement window lapses.
- **Acknowledgement Flow:** When user acknowledges, require optional note (pre-filled suggestions: “Incoming shipment due”, “Manual adjustment in progress”). Response data posted to `/api/inventory/alerts/{alertId}/acknowledge` and appended to audit timeline.
- **Snooze Flow:** Options 4h or 24h. Snoozed alerts greyed with countdown chip. Once timer elapses, alert returns to active column with `Snoozed by {name}` note.
- **Escalation Flow:** Opens confirmation modal summarising recipient (Finance Ops) and auto-includes current ledger snapshot ID. Submit triggers `/api/inventory/alerts/{alertId}/escalate` and posts comment to admin panel notifications.

## Telemetry & Analytics Hooks
- Emit events for key interactions with payload schema:
  - `inventory.health.view` `{ inventoryId, status, varianceDelta, alertCount }`
  - `inventory.alert.acknowledge` `{ alertId, severity, responseTimeMs, noteLength }`
  - `inventory.ledger.filter` `{ filterType, valueCount, correlationIdProvided }`
  - `inventory.reconciliation.submit` `{ inventoryId, varianceDelta, causeCodes, attachmentCount }`
- Provide instrumentation guidelines ensuring events fire after successful API responses and include correlation ID from backend payloads for cross-system tracing.

---
*Updated 2025-10-16 to align provider/admin inventory experiences with Task 3.1 ledger services.*

## Rental Agreement Hub (2025-10-17)
- **Board Layout:** Kanban board with columns `Requested`, `Approved`, `Checked-out`, `In Inspection`, `Settled`, `Cancelled`. Cards display renter name/company, inventory items with thumbnails, pickup/return schedule, deposit balance (badge uses warning styling when hold active), insurance badge (Approved/Pending/Expired), and outstanding checkpoint count.
- **Quick Actions:** Contextual buttons surface per column — `Approve`, `Decline`, `Request docs` in Requested; `Start checkout` in Approved; `Record checkpoint`, `Flag dispute`, `Extend rental` in Checked-out; `Complete inspection`, `Escalate to finance` in Inspection. Buttons emit telemetry events `rental.board.action` with payload `{ action, rentalId, column }`.
- **Filters & Search:** Global filters for `Location`, `Category`, `Status`, `Deposit risk`, `Insurance status`. Search supports SKU, renter, agreement ID. Filter pills persist across sessions via local storage.
- **Empty States:** Provide illustration + CTA: “No pending rental requests — publish marketplace listings or enable auto-approval in settings.” Buttons link to marketplace configuration and settings.

## Rental Detail Drawer
- **Header:** Shows rental ID, status pill, deposit summary (hold amount vs available), scheduled pickup/return, and associated inventory items with on-hand/reserved balances for quick context.
- **Tabs:** `Overview`, `Timeline`, `Documents`, `Ledger`, `Alerts`.
  - **Overview:** Contract metadata, renter contacts, insurance policy, pricing (rental rate, deposit, additional fees), outstanding tasks.
  - **Timeline:** Chronological checkpoints (request, approvals, signatures, checkout, checkpoints, disputes, settlement). Each entry includes user, timestamp, and notes. Overdue checkpoints flagged with warning icons and CTA `Follow up`.
  - **Documents:** Upload list (signed contract, insurance cert, inspection photos). Supports inline preview, metadata (expiry date, classification). Add button opens modal with drag-drop + category selection.
  - **Ledger:** Integrates with inventory ledger; shows reservation holds, checkout deductions, damage fees, refunds. Supports CSV export referencing `rentalLedgerExport` route.
  - **Alerts:** Aggregated alerts (overdue return, missing inspection, unresolved damage). Buttons `Acknowledge`, `Snooze`, `Escalate` map to `/api/rentals/{id}/alerts` endpoints.
- **Footer:** Buttons `Start checkout`, `Record checkpoint`, `Settle rental`, `Cancel rental`. Buttons disabled based on status + RBAC. Provide tooltip if disabled (“Only Finance Ops may settle rentals”).

## Checkout & Return Workflows
- **Checkout Modal:** Steps `Verify identity`, `Document condition`, `Confirm pickup`. Capture renter signature (canvas with undo), ID reference number, photos (min 2). On submit call `/api/rentals/{id}/checkout` with payload containing captured data. Provide success toast referencing deposit hold.
- **Return Modal:** Detects partial vs full return. Users select returned items/quantities, attach photos, and specify condition rating. If variance detected, require note and choose resolution (Charge deposit, Bill difference, Schedule repair). On submit, call `/api/rentals/{id}/return` and trigger ledger update.
- **Accessibility:** Stepper announces progress via `aria-live`. Photo upload supports keyboard-only navigation and includes descriptive instructions.

## Inspection Workbench
- **Interface:** Split panel with checklist on left, evidence gallery on right. Checklist items include condition checks, accessory inventory, documentation review. Each item toggles between `Pass`, `Issue`, `Not applicable`. `Issue` requires note and optional cost estimate.
- **Damage Classification:** Dropdown for severity (Cosmetic, Functional, Safety-critical) and responsibility (Customer, Provider, Unknown). If Safety-critical, show banner with “Escalate to compliance” CTA.
- **Evidence Tools:** Support photo annotations, file upload (PDF receipts), and audio notes. Provide `Request additional evidence` button that sends templated email/notification to renter.
- **Completion:** `Complete inspection` button summarises variances, recommended actions (Charge deposit, Schedule repair, Approve refund). Confirmation modal shows ledger impact preview and allows finance reviewer assignment.
- **Telemetry:** Emit `rental.checkpoint.submit` with payload `{ rentalId, checkpointType, outcome, issueCount, varianceAmount }` after successful submission.

## Settlement & Dispute Handling
- **Settlement Modal:** Pre-populates deposit amounts, damage charges, rental fees, late fees, and adjustments. Supports partial deposit refund slider with notes. Requires confirmation of refund destination (card, bank transfer) and optional due date for outstanding charges.
- **Dispute Escalation:** When disputes flagged, open panel capturing reason codes (Damage contested, Return window disputed, Deposit request), attachments, and notify finance/compliance recipients. Provide `Schedule review` option with calendar integration.
- **Document Retention:** Info banner reminds users that rental agreements retained for 7 years (per DPIA). Provide link to purge automation request for completed rentals.
- **Alerts:** Completed settlement triggers success toast and resolves outstanding alerts. If partial refund, create follow-up task with due date and owner.

## Cross-channel Notes
- Ensure provider mobile UI mirrors board columns using horizontal scroll and gesture support; include offline caching for inspection checklists.
- Admin web surfaces aggregated metrics (Active rentals, Pending inspections, Deposits held) via dashboard cards referencing `Dashboard Designs.md`.
- QA selectors documented for board columns (`data-qa="rental-column-requested"` etc.) and actions to support automated regression.
- Copy references compliance requirements (“Deposits held for 14 days post-inspection”) and links to support articles for renters/providers.
- **Controller QA Alignment (2025-10-21):** Flutter booking/rental controller tests exercise cached refresh, offline banner messaging, creation, scheduling, return, and inspection flows, mirroring this spec plus `Screens_Update_Logic_Flow.md` so automation evidence ties to design intent before Milestone M4. `_DateField` defaults to 09:00 local with optional time skip; storing UTC respects inspection scheduling copy and ensures provider/admin dashboards render consistent timelines.

---
*Updated 2025-10-17 to capture rental lifecycle UX tied to `/api/rentals` orchestration and inspection governance.*

## Campaign Manager Console (2025-10-19)
- **Campaign Overview Page:** Grid/list hybrid displaying campaign cards with advertiser logo, campaign name, spend vs budget bar, pacing badge (Ahead/On Track/Behind/Paused), active flights count, and outstanding invoice chip. Cards include quick actions `View details`, `Pause`, `Resume`, `Generate invoice`, each exposing `data-qa` selectors and keyboard shortcuts (`Shift+P` pause/resume).
- **Filters & Segmentation:** Global filters for `Status`, `Advertiser`, `Objective`, `Flight window`, and `Overspend risk`. Filter pills persist between sessions and echo query parameters when deep linked. Search supports fuzzy match on campaign name, ID, advertiser, and flight label.
- **Campaign Detail Header:** Displays campaign summary metrics (Budget total, Spend to date, Delivery %, Clicks, CTR, CPC) with trending indicators referencing `/api/campaigns/:id` payload. Include compliance badge (Eligible/Pending/Revoked) linking to insured seller application detail.
- **Pacing Timeline Widget:** Line chart plotting planned vs actual spend with shading for forecasted burn. Annotations show overspend triggers, pause/resume timestamps, and scheduled invoice dates. Export actions `Download CSV` and `Send to Slack` emit telemetry `campaign.pacing.export`.
- **Flight Manager Section:** Table listing flights with columns `Name`, `Status`, `Start`, `End`, `Daily Budget`, `Spend`, `Delivery %`. Row actions `Edit flight`, `Duplicate`, `Close` call respective endpoints. Hover tooltips summarise targeting overrides per flight.
- **Targeting Composer Drawer:** Launches from detail page `Edit targeting` CTA. Drawer includes chips for `Geography`, `Categories`, `Audience segments`, `Slot types`. Each chip group supports add/search/remove with inline validation referencing backend caps. Error messaging surfaces when approaching `CAMPAIGN_TARGETING_CAP`, suggesting bulk upload or segment consolidation.
- **Budget & Schedule Form:** Stepper capturing total budget, daily budget, start/end date, timezone, pacing mode (Even/Accelerated), overspend tolerance (read-only default). Inline calculators show expected daily burn and project end date. Validation ensures daily budget ≤ total budget / days.
- **Invoice & Billing Drawer:** Accessible via `View invoices` CTA. Lists invoices with status pill, due countdown chip, amount, and action buttons `Download PDF`, `Record payment`, `Escalate`. Payment recording triggers modal capturing amount, reference, payment method, and notes. Escalation opens template with finance Slack channel pre-filled.
- **Compliance & Eligibility Banner:** When insured seller status pending/expired, banner displays summary copy, outstanding requirements, and CTA to open compliance queue. Banner prevents activation until resolved and logs telemetry `campaign.blocked.compliance`.
- **Daily Metric Ingestion Panel:** Provides log table (date, spend, impressions, clicks, conversions, ingestion status). Supports manual upload for corrections with CSV dropzone (schema instructions). Error rows show remediation guidance referencing API response.
- **Notifications & Audit Trail:** Activity feed captures key events (creation, targeting edits, flight adjustments, overspend pauses, invoices issued, payments posted). Each entry lists actor, timestamp, summary, and link to relevant drawer. Feed supports export for compliance review.

### Provider Mobile Parity
- Mobile layout condenses campaign list into stacked cards with swipe actions (Pause/Resume/Invoices). Pacing badge surfaces as pill with accessible text. Tapping card opens detail view with collapsible sections for Flights, Targeting, Billing.
- Mobile targeting composer reuses chip pattern with segmented control for category selection and bottom-sheet modals for radius input. Validation/instruction copy adapts to smaller screen with progressive disclosure.
- Billing view in mobile emphasises due invoices first with CTA `Mark as paid` (subject to RBAC). Payment recording limited to authorised finance roles; otherwise show info banner linking to support.

### Accessibility & QA Instrumentation
- Keyboard navigation: `Tab` order cycles overview → filters → cards → analytics widgets → details; `Ctrl+Enter` submits targeting changes; `Shift+F` focuses filter panel.
- Aria-live regions announce pacing status changes ("Campaign paused due to overspend"), invoice due warnings, and targeting validation errors.
- QA selectors enumerated for key interactions: `data-qa="campaign-card"`, `data-qa="campaign-targeting-chip"`, `data-qa="campaign-invoice-row"`, `data-qa="campaign-overspend-banner"`.
- Telemetry schema guidelines specify payload fields for events (`campaign.create.submit`, `campaign.targeting.add`, `campaign.flight.update`, `campaign.invoice.generate`, `campaign.pacing.export`, `campaign.status.pause_auto`).

### Integrations & Dependencies
- References to backend endpoints: `/api/campaigns`, `/api/campaigns/:id/flights`, `/api/campaigns/:id/daily-metrics`, `/api/campaigns/:id/invoices`, `/api/compliance` for eligibility checks.
- Drawings alignment: `dashboard_drawings.md` (admin pacing widgets), `Admin_panel_drawings.md` (campaign detail layout), `website_drawings.md` (public ads management CTA placements), `App_screens_drawings.md` (provider mobile cards).
- Finance runbook tie-ins: escalate overdue invoices after `invoiceDueInDays` threshold, display due countdown states (Due soon, Overdue) and highlight autopay status when Finova integration enabled.

---
*Updated 2025-10-19 to align campaign manager UI with `/api/campaigns` targeting, pacing, and billing services.*

## Campaign Analytics Export & Fraud Monitoring (2025-10-20)
- **Analytics Export Outbox:** Insert dashboard tile group (3-up layout) summarising `Pending`, `Sent (24h)`, and `Failed` export counts sourced from `/api/campaigns/:id/analytics-exports`. Each tile includes retry countdown chip (hh:mm:ss), tooltip describing warehouse endpoint + API key requirement, and CTA `View payloads` opening modal with paginated table (payload hash, metric date, last attempt, retry status). Modal supports JSON download and exposes banner when API key missing; aligns to `dashboard_drawings.md` export module sketches.
- **Export Detail Modal:** Detail view lists individual exports with columns `Metric date`, `Payload hash`, `Attempt count`, `Last response`. Failed rows render inline alert with `Retry now` button calling `/api/campaigns/:id/analytics-exports/{exportId}/retry` and capturing telemetry `campaign.analytics.export.retry`. Successful rows surface `Download JSON` (downloads `payload`), plus `Send to warehouse` disabled when export already sent. Accessibility: table supports sticky header, keyboard navigation, and descriptive aria labels for status badges.
- **Fraud Signal Rail:** Right-hand anomaly rail shows grouped signals by severity (Critical, Warning, Informational) with badges `Overspend`, `Underspend`, `Suspicious CTR`, `Suspicious CVR`, `Delivery gap`, `No spend`. Each card displays sparkline (7-day metric), absolute delta (e.g., `+124% CTR vs baseline`), SLA countdown, and buttons `Assign`, `Resolve`, `Escalate`. `Assign` opens modal to delegate to Fraud Ops with due date + Slack channel selection. `Resolve` triggers `/api/campaigns/fraud-signals/{id}/resolve` requiring resolution note and optionally attaches invoice reference. Severity colours map to `color.alert.critical`, `color.alert.warning`, `color.alert.info` tokens for parity with `Admin_panel_drawings.md` anomaly annotations.
- **Summary KPI Enhancements:** Overview hero now includes ROI %, Conversion Rate, Spend Delta (vs plan), and `Open anomalies` badge. Tooltips define formulas (e.g., ROI = `(revenue - spend) / spend`) and link to finance/fraud runbook sections. KPI cards emit telemetry `campaign.summary.view` with payload `{ campaignId, roi, ctr, openAnomalies }` once metrics hydrate.
- **Notification Drawer:** Added notifications tab logging exporter failures, requeue attempts, and anomaly escalations. Entries include timestamp, channel (Slack/email/in-app), and CTA `Re-run export` or `Open fraud case`. Drawer references copy decks in `Web_Application_Design_Update/Dashboard Designs.md` and ensures alerts set `aria-live="assertive"` so assistive tech announces new high-severity items. Provide filter chips (All, Export, Fraud) and search by campaign/flight ID.
- **Provider Mobile Treatments:** Mobile dashboard surfaces export status as stacked cards with countdown progress ring and `Retry` swipe action (RBAC-limited). Anomaly cards collapse metrics into digestible copy (“Overspend: £540 over plan today. Paused 35m ago.”) with CTA `Review in console` deep linking to admin detail. Offline mode caches latest metrics and shows banner instructing user to reconnect before retrying exports.
- **Operations Hand-offs:** Copy references finance escalation instructions (“Escalate to #fin-ads-ops if retry fails twice”) and fraud investigation workflow (“Attach raw log before resolution”). QA selectors enumerated for automation: `data-qa="campaign-export-tile"`, `data-qa="campaign-export-retry"`, `data-qa="campaign-fraud-card"`, `data-qa="campaign-fraud-resolve"`.
- **Telemetry & Accessibility:** All export/fraud interactions trigger events (`campaign.analytics.export.retry`, `campaign.analytics.export.download`, `campaign.fraud.resolve`, `campaign.fraud.assign`) capturing campaignId, signalType, resolutionLatencyMs. Live region announcements describe status updates (“Analytics export FX-482 marked as sent at 14:02”). Keyboard shortcuts: `Shift+R` focuses retry button, `Shift+A` opens assignment modal, `Ctrl+Shift+E` downloads JSON payload. Error copy links to support article KB-341 for warehouse credential setup.

---
*Updated 2025-10-20 to incorporate analytics export visibility, fraud anomaly rail, and notification workflows powering `/api/campaigns` telemetry integration.*
