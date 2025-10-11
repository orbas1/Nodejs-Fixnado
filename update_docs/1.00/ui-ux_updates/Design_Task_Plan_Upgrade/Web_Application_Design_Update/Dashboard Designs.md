
## Compliance & Security Signalling (Added 2025-10-15)
- **Telemetry Dashboard Help Drawer:** Add inline “Privacy & Opt-out” accordion summarising hashed-IP anonymisation, retention windows (12 months), and quick link to support article KB-182. Drawer accessible via question mark icon with focus trap + escape support.
- **Feature Toggle Audit Trail Panel:** Insert table column for `Change request ID` and tooltip describing audit logging path; emphasise only Global Admin can mutate toggles. Provide link to compliance contact for approvals.
- **Document Retention Widgets:** Compliance dashboard card surfaces upcoming document purge events (rental agreements reaching 7-year limit) with CTA to review or extend hold; include legend aligning with DPIA action plan statuses.
- **RBAC Warning Banner:** When compliance officers view redacted data, show persistent banner clarifying reason for masking and steps to request temporary reveal, referencing RBAC minutes item RBAC-02.

## Inventory Health & Reconciliation (Added 2025-10-16)
- **Stock Health Overview Card:** 3-column layout mirroring provider mobile widget with aggregated metrics for on-hand, reserved, damaged. Include sparkline for last 7 days and threshold chips derived from `/api/inventory/health`. Card uses `color.surface.layer` background with state-specific accent border.
- **Alert Queue Widget:** Vertical list grouped by severity with filter chips (All, Warning, Critical). Each entry displays SKU, location, variance delta, and ageing timer. Provide inline actions `Ack`, `Snooze`, `Escalate`; actions call corresponding endpoints and update list without refresh.
- **Reconciliation Pipeline:** Timeline component summarising scheduled counts, overdue reconciliations, and completed actions. Integrate color-coded status icons and CTA `Open reconciliation sheet` linking to modal (see Application Design plan). Display SLA badge when overdue >24h.
- **Variance Heatmap:** Grid view plotting SKUs vs location with colour intensity representing variance percentage. Hover tooltip reveals last count owner, variance reason, and attachments indicator. Supports exporting screenshot to PNG for finance review.
- **Finance Drill-down Drawer:** When admin selects an alert, open side drawer showing ledger snapshot, attachments, and decision log. Provide `Request evidence` button triggering Slack message to provider with templated copy.
- **Telemetry Hooks:** Each widget includes `data-qa` selectors for automation and emits events `inventory.dashboard.widget_view` with widgetId + filters so analytics can audit adoption.
