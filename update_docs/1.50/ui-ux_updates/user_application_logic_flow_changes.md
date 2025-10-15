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

## Analytics & Measurement
- Added events: `user_booking_step_view`, `user_booking_exit`, `user_issue_report_submitted`, `user_payment_method_update`, and `user_support_article_viewed` with metadata for industry, booking value, and session length.
- Funnel dashboards monitor drop-off per step, highlight response times for issue resolution, and track adoption of add-on bundles to inform future pricing experiments.

## Compliance Operations
- Warehouse export tab follows a review → trigger → monitor sequence: users first review latest run summaries, then optionally trigger a new export after confirming dataset scope and retention notices, and finally monitor progress via streamed status updates.
- Manual triggers require biometric confirmation when enabled and log `compliance_export_trigger` analytics events with dataset, region, and justification metadata to maintain DPIA evidence.
- Completed runs surface actionable buttons (`Download`, `Copy secure link`, `View DPIA guidance`) with guardrails preventing downloads on expired retention windows; errors route operators into troubleshooting checklists referencing backend status codes.
