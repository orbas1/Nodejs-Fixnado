# Provider Application Logic & Flow Changes

## 1. Onboarding & Authentication
- **Revised Entry Sequence**
  - Splash screen checks authentication token and compliance status before routing to login or dashboard.
  - Multi-factor authentication (MFA) integrates OTP or authenticator app challenge. Flow includes fallback for SMS delivery failure with support link.
  - New role-based onboarding wizard collects business profile, service areas, compliance documents, bank details, and marketplace preferences in a progressive disclosure format.
- **Document Verification Hook**
  - After onboarding, documents enter verification queue. App displays pending status and prevents marketplace listing until approvals complete.
- **Account State Management**
  - Accounts flagged for audit enter read-only mode, displaying banner with reason and expected resolution time.
  - Dormant accounts (no activity 60 days) trigger reactivation wizard confirming availability, compliance currency, and payment method validity.

## 2. Dashboard Lifecycle
- **Contextual Data Fetch**
  - Dashboard loads aggregated metrics via `/providers/:id/summary` endpoint; caching ensures <1s reload when switching tabs.
  - Real-time sockets update KPI widgets and alerts (e.g., new bid invites, expiring compliance).
- **Action Routing**
  - Quick actions trigger deep links: Add Availability -> Calendar screen pre-filtered to current week; Launch Campaign -> Ads flow with provider context.

## 3. Job Management Flow
- **Lead Intake**
  - New job requests push notifications and appear in Kanban "New" column. Accepting request transitions to "Bidding" and opens Bid Composer.
  - Declining requires reason selection (Out of Zone, Capacity, Price) captured for analytics.
- **Bidding Process**
  - Bid Composer enforces completion of pricing, availability, and terms before enabling submission.
  - App handles counter-offers by surfacing negotiation thread; logic merges chat and bid updates for context.
  - SLA timers trigger warnings if bid not submitted within defined window.
- **Scheduling & Execution**
  - Upon bid acceptance, job auto-moves to "Scheduled" with calendar entry created.
  - Check-in process: provider hits "On Site" -> prompts to capture geo-location and photo proof.
  - Completion requires checklist submission (tasks, materials, client signature). Non-compliance results in blocking payout.
- **Dispute Handling**
  - Raising dispute opens modal collecting evidence, with direct upload to compliance backend.
  - Jobs in dispute disable completion actions and notify compliance team via webhook.

## 4. Availability & Zone Configuration
- **Calendar Sync**
  - Availability updates call `/availability/block` or `/availability/open` endpoints, supporting recurring rules.
  - Zone selection uses polygon list; toggling zone updates provider coverage and recalculates estimated reach metrics.
- **Travel Radius & Buffer**
  - Slider adjusts maximum travel distance; logic updates job visibility feed via server call.
  - Buffer times auto-added around jobs; conflict detection prompts adjustments.

## 5. Marketplace Workflow
- **Inventory Updates**
  - Editing item triggers optimistic UI update; failure states revert and show toast with retry.
  - Maintenance status change checks for conflicting rentals, offering reassign or notify customer options.
- **Listing Publication**
  - Multi-step listing form validates required fields; final review step allows toggling "Featured" with associated credit cost confirmation.
  - Listings remain in "Draft" until compliance approvals satisfied.
- **Rental Fulfilment**
  - Pickup status transitions: Scheduled -> Out for Delivery -> Delivered -> Returned -> Inspected.
  - Notifications sent to renters at each stage; provider can escalate issues to support via inline action.

## 6. Communication Flow
- **Real-time Messaging**
  - Chat connects to websocket; messages tagged with job context, stored with read receipts.
  - AI Assist toggling triggers backend prompt injection; flow includes confirmation modal describing liability boundaries.
- **Voice & Video Calls**
  - Launching call checks Agora token; if expired, refreshes before connecting.
  - Call summary (duration, participants) appended to job timeline on hang-up.
- **Notification Routing**
  - Providers choose channel (push, SMS, email) per conversation; preferences stored in profile settings.

## 7. Compliance & Earnings
- **Document Lifecycle**
  - Upload -> Pending Review -> Approved/Rejected; rejection triggers modal with reason and resubmit action.
  - Expiring documents move to "Expiring" list 30 days prior and appear in dashboard alerts.
- **Commission & Payouts**
  - Earnings screen pulls statements; user can drill into job to see commission breakdown.
  - Payout requests require verifying bank details and compliance status; errors provide inline guidance.
- **Tax & Invoice Handling**
  - Tax forms (W-9, VAT) tracked with expiry; missing forms block payouts beyond threshold with escalation workflow.
  - Invoice downloads generated on demand with itemised service, commission, and tax lines.

## 8. Ads & Promotions Flow
- **Campaign Creation**
  - Wizard steps: Objective -> Targeting (zones, services, budget caps) -> Creative upload -> Schedule -> Review & Launch.
  - Validation ensures payment method on file; otherwise directs to Payments settings.
- **Performance Monitoring**
  - Analytics cards update daily; anomalies trigger alerts recommending optimisation actions.
- **Credit & Subscription Ledger**
  - Campaign spend draws from pre-paid credit balance; low balance alerts prompt top-up via payments API with secure confirmation.
  - Subscription tier changes immediately recalibrate available campaign slots and impression caps, with pro-rated billing handled server-side.

## 9. Error & Offline Handling
- Offline mode allows read-only access to cached jobs and inventory; actions queue for sync when connection restored.
- System errors show contextual modals with support contact and log reference ID.
- Form validation errors summarised at top with inline highlights for accessibility.
- **Observability & Recovery**
  - Critical user actions emit telemetry events (job status changes, bid submissions) with correlation IDs for support diagnostics.
  - Crash recovery relaunches to last visited tab with toast summarising restored state and outstanding sync actions.

These flow updates ensure providers can manage bookings, marketplace operations, compliance, and monetisation with reduced friction and clear governance.

## Automation, Integrations & Telemetry
- **Automation Hooks**: Job stage transitions trigger automated checklists (e.g., equipment prep) and notifications to team members through webhook integrations.
- **External Integrations**: Calendar sync supports Google and Outlook; inventory integrates with third-party rental providers via REST connectors with retry logic defined.
- **Telemetry Plan**: Each critical action emits analytics events (`job_stage_changed`, `bid_submitted`, `campaign_launched`) with metadata to support funnel diagnostics.

## Exception & Recovery Scenarios
- **Payment Holds**: If payout blocked due to compliance, dashboard surfaces banner with direct link to document upload; logic prevents duplicate submissions.
- **Document Rejections**: Rejection triggers forced path to re-upload wizard; new flow requires acknowledgement of reviewer notes before proceeding.
- **Network Failures**: Offline queue monitors maximum retries (3) before prompting manual retry; persistent failures escalate to support ticket creation.
- **Dispute Escalation**: When dispute escalated to arbitration, system locks editing and opens two-way chat with compliance agent; timeline shows arbitration deadlines.

## Governance & Security Considerations
- **Role Permissions**: Business owners can manage staff access; staff accounts limited to job execution modules; logic flow includes invitation acceptance and role assignment.
- **Audit Trails**: Every update to bids, documents, campaigns logs actor, timestamp, before/after states for regulatory compliance.
- **Data Privacy**: Sensitive data (IDs, bank details) masked in UI except when explicitly requested via secure reveal pattern requiring biometric/PIN confirmation.

## Implementation Notes for Engineering
1. **State Machines**: Encode job lifecycle as finite state machine to ensure transitions follow defined paths, preventing skipped states.
2. **Sync Conflicts**: When simultaneous edits detected (e.g., two devices editing availability), prompt user to merge or override with diff view.
3. **Push Notifications**: Align Flutter push channels with new categories (Jobs, Marketplace, Compliance) for granular user control.
4. **Performance Targets**: Aim for <500ms response for kanban updates; apply caching and pagination to inventory endpoints to maintain responsiveness.
