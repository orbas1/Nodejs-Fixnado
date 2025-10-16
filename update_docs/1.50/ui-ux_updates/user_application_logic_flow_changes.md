# User Application Logic Flow Changes (v1.50)

## Booking Lifecycle Updates
1. **Persona-aware onboarding:** After registration the app collects industry segment and project scale to customise recommended services, pricing defaults, and compliance prompts.
2. **Guided booking wizard:** Each step validates required fields before proceeding, auto-saving progress and providing exit/resume tokens for cross-device continuation.
3. **Availability matchmaking:** Schedule selection queries providers for availability windows, returning ranked matches; conflict handling suggests alternative slots or waitlist option.
4. **Add-on selection logic:** Based on service type and project size, system surfaces recommended add-ons (operators, logistics) and calculates dynamic pricing while showing savings for bundle choices.
5. **Confirmation & payment:** Payment authorisation is held until provider acceptance; the flow sends push/email notifications at each status change and updates booking timeline.

## Tracking & Communication
- **Real-time updates:** Job timeline polls provider status; if provider goes offline, fallback logic switches to SMS/email updates with disclaimers.
- **Issue escalation:** Issue reporting triggers triage workflow; severity level determines if routed to automated troubleshooting tips or live support within 2 minutes.
- **Message centre routing:** Threads tagged by booking ID; when provider replies, user receives both push notification and inbox badge update; read receipts show timestamp for transparency.

## Profile & Preferences
- **Safety controls:** Enabling two-factor authentication forces verification on new device login; failure loops to support contact form with identity confirmation steps.
- **Notification preferences:** Toggle updates propagate to push notification service and email marketing platform with 15-minute sync window; user receives confirmation toast.
- **Saved payment logic:** Expiring cards prompt reminder 30 days in advance; if card becomes invalid during active booking, user is guided through update before completion.

## Error Handling & Offline Support
- Booking wizard caches form data locally; if user loses connection, they can resume without re-entering information once online.
- Payment failures display detailed reasons (insufficient funds, 3DS required) and offer alternative payment method or support contact.
- When provider cancels, automated flow suggests replacements ranked by compatibility, provides compensation voucher when policy applies, and collects feedback for analytics.

## Marketplace Discovery & Explorer
- Explorer ranking mirrors the web heuristics by weighting zone demand, company compliance scores, rental availability, and price telemetry so in-zone providers and rentable stock appear before out-of-region listings while offline states fall back to cached ordering.

## Analytics & Measurement
- Added events: `user_booking_step_view`, `user_booking_exit`, `user_issue_report_submitted`, `user_payment_method_update`, and `user_support_article_viewed` with metadata for industry, booking value, and session length.
- Funnel dashboards monitor drop-off per step, highlight response times for issue resolution, and track adoption of add-on bundles to inform future pricing experiments.

## Compliance Operations
- Warehouse export tab follows a review → trigger → monitor sequence: users first review latest run summaries, then optionally trigger a new export after confirming dataset scope and retention notices, and finally monitor progress via streamed status updates.
- Manual triggers require biometric confirmation when enabled and log `compliance_export_trigger` analytics events with dataset, region, and justification metadata to maintain DPIA evidence.
- Completed runs surface actionable buttons (`Download`, `Copy secure link`, `View DPIA guidance`) with guardrails preventing downloads on expired retention windows; errors route operators into troubleshooting checklists referencing backend status codes.

## Creation Studio & Service Publishing
1. **Blueprint discovery:** Entry point surfaces blueprints relevant to the operator’s persona with channel, compliance, and automation badges; selection hydrates a draft with persona defaults, recommended regions, and automation hints.
2. **Autosave wizard:** Every field change queues an autosave through the controller repository; UI surfaces save spinners, success toasts, and retry banners when offline, persisting drafts locally until server confirmation is received.
3. **Slug and compliance validation:** Slug field performs debounce validation against `/creation-studio/slug-check`; compliance checklist warns when blueprint-required items remain unticked and blocks publish CTA until resolved.
4. **Availability & pricing guards:** Lead hours enforce minimum thresholds per blueprint while pricing inputs normalise currency, setup fees, and highlight inconsistent combinations (e.g., subscription model without cadence) with inline helper text.
5. **Publish orchestration:** Publish CTA requests confirmation, runs final validation, displays compliance summary, and on success redirects to storefront preview with analytics event `creation_publish_completed`; errors surface actionable guidance referencing backend status codes.

## Finance Escalation Handling
- Alert inbox polls orchestration telemetry every five minutes; when new SLA breaches appear the flow highlights the alert card, preloads context, and prompts the user to confirm or delegate the responder from a quick-pick roster.
- Acknowledge action posts responder details and optional notes, pauses repeat notifications, and records analytics event `user_finance_alert_acknowledged` with severity, retry count, and downstream channel metadata.
- Retry countdown timers update locally every 30 seconds; when a timer expires without acknowledgement the flow escalates severity, vibrates the device (respecting quiet hours), and surfaces direct links to finance runbooks stored in the knowledge base module.
