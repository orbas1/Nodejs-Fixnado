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
