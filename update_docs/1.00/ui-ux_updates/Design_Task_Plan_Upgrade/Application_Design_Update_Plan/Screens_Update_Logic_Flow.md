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

## 11. Rental Agreement Board Lifecycle
1. Board initialises by fetching `/api/rentals?status=all&include=alerts,checkpoints` and `/api/inventory/health?includeHolds=true`.
2. Columns derive from status; cards show deposit + insurance badges. Telemetry `rental.board.view` emitted with counts per column.
3. Drag-and-drop disabled to enforce explicit actions; column transitions require button interactions so audit trail captured.
4. Filter interactions update query parameters; results paginated with infinite scroll, each fetch logs `rental.board.filter` event.

## 12. Rental Approval Flow
1. User selects rental in Requested column → detail drawer opens.
2. `Approve` button triggers modal capturing approval notes, insurance verification, optional documents request.
3. POST `/api/rentals/{id}/approve` with approval metadata. On success, board updates card column to Approved, triggers inventory reservation update via `/api/inventory/{itemId}/adjust` (reservation).
4. Telemetry `rental.approval.complete` recorded; success toast summarises reservation lock.

## 13. Checkout Flow
1. From Approved column, `Start checkout` opens multi-step modal.
2. Identity verified via photo capture / ID entry; condition documented with photos & checklist.
3. POST `/api/rentals/{id}/checkout` including captured data, deposit confirmation, signature payload.
4. Inventory service reduces on-hand/reserved counts accordingly; UI refreshes health widget and rental card status to Checked-out.
5. Telemetry `rental.checkout.complete` logs items, duration, deposit hold reference.

## 14. Return & Partial Return Flow
1. `Record return` button initiates return wizard that pre-populates expected quantities.
2. User selects items returned, attaches photos, classifies condition. If partial, wizard prompts for follow-up schedule.
3. POST `/api/rentals/{id}/return` with arrays of line items, condition ratings, variance notes.
4. Inventory service releases reservations / adjusts ledger; alerts generated when outstanding holds remain > buffer.
5. Telemetry `rental.return.submit` includes counts of returned vs outstanding units.

## 15. Inspection & Damage Assessment
1. Inspection workbench loads `/api/rentals/{id}/checkpoints?type=inspection` to pre-fill checklist.
2. Each checklist item update posts to `/api/rentals/{id}/checkpoints` with immediate persistence; UI marks item complete.
3. On completion, summary modal calculates variance, recommends actions (Charge deposit, Approve refund) based on backend heuristics.
4. POST `/api/rentals/{id}/inspect` finalises inspection, attaches evidence, triggers ledger adjustments and potential alert escalation.
5. Telemetry `rental.checkpoint.submit` and `rental.inspection.complete` fire with severity/outcome fields.

## 16. Settlement & Escalation
1. `Settle rental` opens modal summarising financials (rental fees, damage, refunds).
2. User confirms refund split and outstanding balance. POST `/api/rentals/{id}/settle` to release deposit/record charges.
3. If unresolved issues, `Escalate dispute` triggers `/api/rentals/{id}/dispute` with reason codes and attachments.
4. Alerts updated: settlement resolves inventory holds; dispute creates critical alert & Slack webhook via backend.
5. Telemetry `rental.settlement.submit` and `rental.dispute.raise` recorded for analytics dashboards.

## 17. Alert & Inventory Integration
- Rental overdue/inspection alerts share rail with inventory alerts; API `/api/rentals/{id}/alerts` drives UI state.
- Acknowledgement path posts to `/api/rentals/{id}/alerts/{alertId}/acknowledge`, echoing metadata to inventory alert timeline.
- Snooze/escalation actions propagate to both rental + inventory audit logs ensuring consistent MTTA reporting.
- Health widget recalculates available inventory factoring rental holds and overdue returns using combined `/api/inventory/health` payload.
- **2025-10-21 Flutter QA Update:** Controller suites mirror cached refresh, offline banner, approval, scheduling, checkout, return, and inspection flows so Flutter parity stays aligned with this logic; `_DateField` defaults (09:00 local, optional time skip, UTC persistence) are documented to keep inspection SLAs/timelines consistent across provider/admin dashboards.

## 18. Campaign Creation Flow
1. User selects `Create campaign` → modal/route initialises with advertiser pre-selected (based on account context) and compliance eligibility check via `/api/compliance/companies/:companyId/summary`.
2. Step 1 (Basics): Capture campaign name, objective, start/end dates. Validation ensures end ≥ start and start ≥ today. POST draft to `/api/campaigns` with status `draft`; response returns `campaignId` for subsequent steps.
3. Step 2 (Budget): Collect total + daily budget. UI calculates minimum flight duration and highlights overspend multiplier (read-only). PATCH `/api/campaigns/:id` to persist budgets. If validation fails (daily > total/days), show inline error and block progression.
4. Step 3 (Targeting): User adds targeting chips; each addition triggers POST `/api/campaigns/:id/targeting` with payload `{ type, value, params }`. Service responds with canonicalised rule + ruleId. UI updates chip list and telemetry `campaign.targeting.add`.
5. Step 4 (Flights): User defines first flight schedule. POST `/api/campaigns/:id/flights` with `{ name, startDate, endDate, dailyBudget, totalBudget, status }`. Response includes flightId; UI renders timeline preview.
6. Step 5 (Review): Summarise configuration, display eligibility/compliance banners if outstanding requirements. Finalise by PATCH `/api/campaigns/:id` status `active` (if startDate ≤ today) or `scheduled`. Emit telemetry `campaign.create.submit` and show success toast referencing pacing analytics availability.

## 19. Targeting Management Flow
1. From campaign detail, user clicks `Edit targeting` → drawer fetches existing rules via `GET /api/campaigns/:id/targeting`.
2. Adding rule: user selects rule type (Geo radius, Category, Audience, Slot). Form collects values with auto-complete referencing taxonomy endpoints (e.g., `/api/catalog/categories`). On submit, POST to `/api/campaigns/:id/targeting`.
3. Backend enforces `CAMPAIGN_TARGETING_CAP`; if exceeded, returns 422 with `limitExceeded` flag and remaining slots. UI displays inline error and suggests consolidating segments.
4. Removing rule: user clicks chip remove; DELETE `/api/campaigns/:id/targeting/:ruleId`. Success updates chip list and logs telemetry `campaign.targeting.remove`.
5. Reordering (priority weight): drag handles adjust order; PATCH `/api/campaigns/:id/targeting/reorder` with new sequence array. Response returns normalised order to render.

## 20. Daily Metric Ingestion & Overspend Handling
1. Scheduled job or manual API call posts to `/api/campaigns/:id/daily-metrics` with array of `{ date, spend, impressions, clicks, conversions }`.
2. Backend calculates cumulative spend vs allocated (campaign + flight). If spend exceeds `overspendMultiplier * dailyBudget`, service auto-pauses campaign and returns `overspendTriggered=true` plus recommended resume time.
3. UI receives ingestion response via webhook/polling endpoint `/api/campaigns/:id/pacing`. When overspend triggered, detail view displays critical banner and disables resume button until finance review, referencing config `campaigns.overspendMultiplier`.
4. Telemetry event `campaign.status.pause_auto` fired with payload `{ campaignId, flightId, spendDelta, triggeredAt }`. Slack/notification job invoked for finance escalation.
5. Once user reviews, pressing `Resume` triggers POST `/api/campaigns/:id/actions/resume` with acknowledgement note. Response clears banner and logs `campaign.status.resume_manual`.

## 21. Invoice Generation & Settlement Flow
1. Finance user selects `Generate invoice` on campaign detail. POST `/api/campaigns/:id/invoices` with `{ billingPeriodStart, billingPeriodEnd }`.
2. Backend calculates amount from daily metrics, returns invoice with due date = `generatedAt + invoiceDueInDays`. UI appends invoice row, surfaces due countdown chip, and logs telemetry `campaign.invoice.generate`.
3. When payment received, finance selects `Record payment`. PATCH `/api/campaigns/:id/invoices/:invoiceId` with `{ paymentDate, amount, reference, method }`. Response updates status to `paid` and appends audit event.
4. Overdue scenario: scheduler marks invoice overdue; UI displays red badge and prompts escalation. Escalation action triggers POST `/api/campaigns/:id/invoices/:invoiceId/escalate` notifying finance Slack + email with payload containing invoice metadata.
5. Invoice dispute: button opens modal capturing dispute reason, attachments. POST `/api/campaigns/:id/invoices/:invoiceId/dispute`. Status set to `in_dispute`; UI shows amber badge and logs event.

## 22. Campaign Archive & Deletion Flow
1. User selects `Archive campaign`; modal summarises outstanding invoices and flights. If open invoices exist, disable action with explanation.
2. When eligible, POST `/api/campaigns/:id/actions/archive` setting status `archived`, closing active flights. UI removes campaign from default list, accessible via status filter.
3. Deletion allowed only for drafts with no spend. DELETE `/api/campaigns/:id` prompts confirmation referencing compliance retention note (metrics stored 7 years). Success triggers toast and telemetry `campaign.delete`.

## 23. Provider Mobile Quick Actions
1. Provider opens mobile Campaign screen; app fetches `/api/campaigns?view=provider&status=active`.
2. Swipe left reveals quick actions `Pause` and `Invoices`. Pause sends POST `/api/campaigns/:id/actions/pause` with reason `provider_manual`. Confirmation bottom sheet summarises impact.
3. Selecting `Invoices` opens condensed list; tapping invoice uses deep link to billing drawer anchored to invoice ID. Payment recording optional if user has finance scope; otherwise show info message.
4. Push notifications triggered when overspend pause or invoice overdue; tapping notification routes to campaign detail anchored to relevant section.

## 24. Analytics Export Outbox Refresh
1. Campaign detail screen initialises export tiles by calling `/api/campaigns/:id/analytics-exports/summary` returning counts for `pending`, `sentLast24h`, `failed`, plus `nextRetryAt` timestamp.
2. UI renders tile countdown using `nextRetryAt` and schedules auto-refresh via `setInterval` (every 60s) to keep timers accurate; telemetry `campaign.analytics.export.summary_view` fired with counts.
3. When user selects `View payloads`, modal loads `/api/campaigns/:id/analytics-exports?status=${filter}` with pagination cursor. Response returns `items`, `nextCursor`, `retryAfterSeconds` for failure states.
4. Failed row actions:
   - `Retry now` triggers POST `/api/campaigns/:id/analytics-exports/{exportId}/retry`.
   - On success, UI updates row status to `pending`, resets countdown chip, and logs telemetry `campaign.analytics.export.retry` including `latencyMs` derived from request time.
   - On error (e.g., endpoint missing), display inline alert referencing support article KB-341 and log telemetry `campaign.analytics.export.retry_failed`.
5. `Download JSON` button calls `/api/campaigns/:id/analytics-exports/{exportId}/payload` streaming signed URL; UI triggers file download and records `campaign.analytics.export.download` event with payload hash.
6. When summary indicates `failed > 0`, top-level notification badge displays count and `aria-live="polite"` message (“3 analytics exports require attention”). Dismissing badge requires either successful retry or manual acknowledgement modal.

## 25. Export Failure Notification Flow
1. Background job `campaignAnalyticsJob` posts export to warehouse; if response not ok, service updates record status `failed` with `lastError`.
2. Webhook triggers server-side event -> Notification service creates entry with type `export_failure`, severity `critical`, associated campaign/flight IDs, error details, and recommended action.
3. Admin UI polls `/api/notifications?channel=ads&severity=critical` every 45s (configurable). When new notification arrives:
   - Notification drawer surfaces card with error summary, `Retry export` CTA, and `View logs` link pointing to observability dashboard.
   - Slack template `ads-export-failure` posts to `#fin-ads-ops` containing export ID, campaign, error message, and quick link to console.
   - Email template dispatched to analytics distribution list with same payload plus runbook link.
4. User selects `Retry export` from notification → opens export modal pre-filtered to failed ID and auto-focuses `Retry now` button. On success, notification automatically resolves (PATCH `/api/notifications/{id}` status `resolved`).
5. If retries exceed configured threshold (3 attempts in 30 minutes), escalation rule triggers secondary Slack ping to `#fraud-response` and updates notification severity to `critical` with red badge.

## 26. Fraud Signal Lifecycle & Escalation
1. Fraud evaluation triggered during metrics ingestion emits signal stored via `/api/campaigns/:id/fraud-signals` (status `open`).
2. Campaign detail fetch includes `openFraudSignals` count; UI loads anomaly rail via GET `/api/campaigns/:id/fraud-signals?includeResolved=false` sorted by severity/time.
3. Selecting card opens panel showing detection context (metric date, baseline comparison, raw metrics) and recommended actions (Pause, Adjust budget, Investigate creative). Panel includes `Assign owner` dropdown (Finance Ops, Fraud Ops, Marketing) and due date field.
4. Assigning owner triggers PATCH `/api/campaigns/fraud-signals/{id}` with `{ assigneeId, dueDate }`; UI updates card label and logs telemetry `campaign.fraud.assign`.
5. Resolving signal opens form requiring `resolutionNote`, optional attachment (CSV). POST `/api/campaigns/fraud-signals/{id}/resolve` marks signal resolved; UI removes from open list, adds entry to timeline, and updates summary badge.
6. Escalation path: If signal severity `critical` remains open > SLA (config `CAMPAIGN_FRAUD_ESCALATION_MINUTES`), scheduler posts Slack alert + email to Fraud Ops. UI displays escalation banner with CTA `Join bridge` linking to conference info from runbook. Escalation banner includes `aria-live="assertive"` announcement and ensures keyboard focus moves to CTA for accessibility.

## 27. Mobile Notification Sync
1. Provider mobile app subscribes to push topic `campaign-anomalies`. When backend sends export failure or critical fraud signal, push payload includes `campaignId`, `signalType`, and `ctaDeepLink`.
2. Tapping notification opens mobile anomaly detail bottom sheet summarising status with actions `Acknowledge`, `Escalate`, `View on web`. `Acknowledge` logs telemetry `campaign.fraud.mobile_ack` and syncs with server via POST `/api/campaigns/fraud-signals/{id}/acknowledge`.
3. If offline, app queues acknowledgement/resolution locally and retries when network restored. UI displays offline banner referencing support article for manual escalation.
