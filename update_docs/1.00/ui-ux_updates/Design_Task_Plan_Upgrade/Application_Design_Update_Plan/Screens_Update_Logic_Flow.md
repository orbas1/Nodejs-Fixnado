 # Inventory Ledger Logic Flows — Version 1.00 (Updated 2025-10-16)

## 1. Provider Dashboard Load
1. Provider authenticates; RBAC middleware returns roles and inventory scope.
2. App requests `/api/inventory/health` with query `?includeAlerts=true&includeNextCount=true`.
3. Response hydrates hero widget:
   - Calculate available = `onHand - reserved - damaged`.
   - Determine `health.status` (`healthy`, `warning`, `critical`) and map to tokenised colour + icon.
4. Parallel requests:
   - `/api/inventory/items?page=1&pageSize=25&include=nextCount,alerts` for table data.
   - `/api/inventory/alerts?status=open` for alert rail fallback.
5. Telemetry event `inventory.health.view` fired once data resolves; include counts of open alerts and variance delta.

## 2. Alert Acknowledgement Flow
1. User selects alert card → modal displays detail (threshold, history, recommended actions).
2. User chooses `Acknowledge`:
   - Client collects optional note, disables submit until 2 characters typed if alert severity = `critical`.
   - POST `/api/inventory/alerts/{alertId}/acknowledge` with `{ note }`.
3. Success:
   - Remove alert from active list, append timeline entry to detail drawer.
   - Trigger toast “Alert acknowledged — finance notified.” when severity = `critical`.
   - Emit telemetry `inventory.alert.acknowledge` including `responseTimeMs` derived from `Date.now() - alert.createdAt`.
4. Failure:
   - Display error banner referencing support article, retain modal state for retry.

## 3. Snooze Flow
1. User selects `Snooze` → dropdown offering 4h or 24h.
2. PATCH `/api/inventory/alerts/{alertId}/snooze` with `{ durationHours }`.
3. On success, alert card moves to “Snoozed” section with countdown badge; scheduler triggers local timer to resurface card after expiry.
4. Telemetry `inventory.alert.snooze` logs duration and severity.

## 4. Escalation Flow
1. User selects `Escalate` on alert or reconciliation variance.
2. Modal summarises recipients (Finance Ops group) and includes latest ledger snapshot ID from health payload.
3. POST `/api/inventory/alerts/{alertId}/escalate` with `{ message, targetGroup, snapshotId }`.
4. Success path:
   - Slack webhook invoked server-side; UI shows confirmation banner with link to escalation log.
   - Alert card tagged with `Escalated` chip and locked from further snoozes.
   - Telemetry `inventory.alert.escalate` recorded.

## 5. Ledger Drill-down
1. User opens item row → front-end requests `/api/inventory/items/{inventoryId}/ledger?page=${page}&pageSize=25&filter[...]`.
2. Response displayed in table with sticky totals row recalculated client-side.
3. Selecting ledger entry exposes detail panel with metadata (correlationId, references, attachments, related alerts).
4. Export action triggers `GET /api/inventory/items/{inventoryId}/ledger/export?filters...`; UI shows spinner until download URL ready.
5. Telemetry `inventory.ledger.filter` fired whenever filters change; `inventory.ledger.export` fired on export completion.

## 6. Adjustment Flow
1. User chooses `Adjust stock` from detail drawer → form collects type, quantity, reason, notes.
2. Validation: quantity > 0, reserved adjustments require `reason` not `Other`.
3. POST `/api/inventory/{inventoryId}/adjust` with body `{ type, quantity, reason, notes, correlationId }`.
4. Optimistic update appends new ledger row with placeholder `pending` badge; once response returns, update with server-provided entry ID and timestamp.
5. If response triggers new alert (e.g., negative available), backend includes `alertsCreated` array; UI surfaces inline banner prompting immediate acknowledgement.

## 7. Cycle Count & Reconciliation Flow
1. User initiates cycle count from dashboard or detail drawer.
2. App loads last reconciliation context via `/api/inventory/{inventoryId}/reconciliation/context` to pre-fill expected quantity.
3. Stepper stages:
   - **Preparation:** Show instructions, allow download of printable checklist.
   - **Count Entry:** Capture counted quantity, method, attachments; validate attachments <10MB.
   - **Variance Review:** Calculate variance; if `abs(variance) > INVENTORY_LOW_STOCK_BUFFER`, require justification and risk classification.
4. POST `/api/inventory/{inventoryId}/reconcile` with aggregated payload.
5. Success updates UI:
   - Health widget recalculated via refreshed `/health` call.
   - Reconciliation timeline adds entry with new status.
   - Alerts referencing inventory ID resolved automatically client-side.
6. Telemetry `inventory.reconciliation.submit` logged with variance delta and cause codes.

## 8. Error Handling & Edge Cases
- **Network Failure:** Display offline banner, queue adjustment/reconciliation requests locally with retry once network restored.
- **Permission Denied:** If API returns 403, show RBAC toast and disable action buttons for session.
- **Concurrent Update:** When ledger fetch returns `409` with `latestVersion`, prompt user to refresh detail drawer; auto-refresh occurs for health widget every 60s.
- **Stale Data:** If `health.generatedAt` older than 5 minutes, show banner instructing provider to rerun sync; CTA triggers `/api/inventory/health/refresh` endpoint if user has `inventory:sync` scope.

## 9. Analytics & Logging Hooks
- Emit telemetry for: dashboard view, alert actions, filter changes, exports, adjustment submissions, reconciliation submissions.
- All events include `correlationId` from API response when available to tie UI actions to ledger entries.
- Include `inventoryRole` (Provider/Admin/FinanceOps) in payload for segmentation.
- Backend logging guidelines referenced in `inventoryService.js` ensure UI correlation IDs appear in audit trail.

## 10. Integration with Drawings & Blueprints
- Wireframes `dashboard_drawings.md` and `Admin_panel_drawings.md` annotate component states for each step.
- Logic map cross-references `Screens_Update.md` sections for copywriting and interaction specifics.
- Provider mobile flows align with `App_screens_drawings.md` for parity; interactions re-used via Flutter component library documented separately.
