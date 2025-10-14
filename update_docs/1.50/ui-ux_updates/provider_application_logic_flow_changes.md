# Provider Application Logic Flow Changes (v1.50)

## High-Level Flow Adjustments
1. **Role-based onboarding branch:** After login the flow evaluates provider type (solo vs. fleet) to route into tailored onboarding sequences with conditional steps for fleet asset upload and team invites.
2. **Verification gating:** Each verification step now exposes completion states (Not Started → In Progress → Under Review → Approved) with dependency checks ensuring downstream actions (publishing listings, receiving payouts) remain disabled until requirements met.
3. **Action queue prioritisation:** Dashboard loads action queue by urgency score calculated from compliance deadlines, booking proximity, and unread communications; logic promotes items above KPI board when severity is critical.
4. **Availability sync loop:** When availability changes, the system triggers occupancy recalculation, notifies matched jobs, and surfaces conflicts with recommended resolutions before persisting updates.

## Detailed Sequence Updates
### Onboarding & Verification
- **Identity verification:** Introduced OCR validation stage; if mismatch occurs user is sent to manual review branch with support escalation option and estimated turnaround messaging.
- **Certification uploads:** Logic now batches document validation; if multiple certifications expire within 30 days, prompts provider to enable reminders and requires acknowledgement before continuing.
- **Fleet onboarding:** Fleet managers invite team members; acceptance triggers asset allocation workflow to ensure each vehicle/operator pair is confirmed before the dashboard unlocks scheduling.

### Job Acquisition & Management
- **Job discovery:** Filters now remember last-used criteria; acceptance flow checks for schedule conflicts and outstanding compliance items before confirming assignment.
- **Negotiation loop:** When provider counters a quote, the system holds slot for 2 hours, triggers notification to client, and auto-releases if no response, logging the event for analytics.
- **Work execution:** Start Work action now confirms geolocation check-in, opens worklog timer, and ensures required pre-start checklist is completed; failure to complete triggers nudge before timer can stop.

### Financial Operations
- **Payout eligibility:** Submission of work report validates mandatory fields (time, materials, photos). Once approved, payout scheduler verifies bank verification status; if pending, funds queue and provider receives guidance.
- **Expense reimbursement:** OCR categorisation stage asks for confirmation; if provider overrides category, machine learning model stores feedback to refine future predictions.
- **Tax document access:** Generating statements now triggers asynchronous job with progress indicator; once ready, pushes notification to inbox and email with secure download link.

## Error Handling & Edge Cases
- Added retry logic for image uploads with offline caching; unsent items appear in new "Upload Outbox" state machine until connectivity is restored.
- Logic flow ensures that deleting availability triggers cascade to cancel dependent drafts while prompting provider to send explanation to affected clients.
- Support escalation integrates with Zendesk API; severe verification failures open ticket automatically with captured context from previous steps.

## Analytics & Telemetry
- New events instrumented for `provider_onboarding_step_view`, `action_queue_item_complete`, `schedule_bulk_edit_applied`, `payout_issue_resolved`, and `upload_retry_success` with contextual properties (role type, time to completion, error codes).
- Funnels updated to monitor drop-offs at each verification stage and the negotiation loop; dashboards highlight segments with >10% attrition for prioritised UX review.
