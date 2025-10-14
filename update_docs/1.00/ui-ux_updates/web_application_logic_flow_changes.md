# Web Application Logic & Flow Changes

## 1. Session Management & Access Control
- **Authentication**
  - Public pages accessible without login; sensitive flows require authentication via JWT stored in httpOnly cookies.
  - MFA enforced for provider and admin roles; fallback recovery codes managed within profile settings.
- **Role-Based Routing**
  - React router guards detect role (user, provider, admin, support) and load corresponding navigation shell.
  - Unauthorized access returns 403 page with link to switch account.
- **Session Timeout Handling**
  - Idle timer warns after 12 minutes of inactivity; extend session modal refreshes tokens without full logout.

## 2. Geo-Zonal Explorer
- **Search Handling**
  - Search queries call `/api/explorer/search`; results paginated and cached to enable map/list sync.
  - Map interactions (pan/zoom) trigger bounding box updates; list re-fetches to stay aligned.
- **Filter Application**
  - Filters update query params; backend supports server-side filtering for performance.
  - Sponsored providers pinned to top with disclosure tooltip.
- **Provider Profile Launch**
  - Clicking provider opens modal with detail; booking CTA initiates booking wizard with pre-filled provider context.
- **Notification Feed**
  - Explorer surfaces notifications in header dropdown; acknowledges read state to reduce duplication across mobile apps.

## 3. Booking Funnel Logic
- **Stepper Control**
  - Each step validates data; incomplete fields block progression and highlight errors.
  - Autosave persists draft booking in local storage and server for cross-device continuity.
- **Provider Selection**
  - When user requests bids, system posts job to providers; UI shows countdown and updates when bids arrive via websocket.
  - Manual selection locks provider and bypasses bidding stage, verifying availability before scheduling step.
- **Pricing Calculation**
  - Real-time pricing updates compute service cost, add-ons, rentals, taxes, commissions, discounts.
  - Payment step integrates with payment gateway; tokenisation occurs before final confirmation.
- **Confirmation**
  - Successful booking triggers email, push notifications, and updates analytics events.
- **Post-Booking Feedback**
  - After confirmation, optional survey records satisfaction rating and passes to analytics pipeline for NPS tracking.

## 3a. Authentication & Account Flows
- **Registration**
  - Account creation orchestrates user profile, consent capture, and optional business verification for provider prospects.
  - Email verification required before enabling bookings; unverified accounts limited to browsing.
- **Password Recovery**
  - Recovery requests generate time-limited tokens; flow requires OTP confirmation plus new password validation.
- **Session Switching**
  - Users with multiple roles (e.g., provider + admin) can switch context via avatar menu; router reloads appropriate shell with minimal flicker.

## 4. Provider Console Workflows
- **Job Management**
  - Data table fetches from `/api/provider/jobs`; websockets push status changes.
  - Inline actions (accept, decline, update status) call respective APIs and optimistically update UI.
- **Availability Editor**
  - Zone polygons edited via map library; changes saved to `/api/provider/zones` with validation for overlaps.
  - Calendar integrates with ICS export; updates propagate to mobile via shared backend.
  - Service coverage sync posts to `/api/zones/:zoneId/services` with optimistic UI reordering, emitting analytics events for attach/update/detach actions; rollback messaging surfaces when conflicts returned with `409` status.
- **Marketplace Management**
  - Inventory updates trigger server-side validation for stock conflicts; UI displays conflict resolution modal.
- **Compliance Lifecycle**
  - Document upload uses chunked uploads; status updates shown in Kanban columns.
- **Ads Manager**
  - Campaign wizard enforces objective selection, targeting parameters, budget allocation, and creative approval. Launch triggers review pipeline.
- **Billing & Subscription**
  - Subscription page retrieves plan data, usage metrics, invoices; updates propagate via billing API and event bus to lock/unlock premium features.
  - Downgrades schedule at end of billing cycle; upgrades immediate with proration.

## 5. Admin & Governance Flows
- **Compliance Queue**
  - Queue fetches paginated data; moderators can bulk approve/deny. Decisions log to audit trail API.
  - Dispute resolution integrates with evidence viewer, enabling final decision and automated notifications.
- **Commission Settings**
  - Forms update rules with effective dates; UI warns if conflicts detected with existing rules.
- **Analytics & Reporting**
  - Dashboards pull from analytics service; filters update charts and export options.
  - Scheduled exports allow cron-like configuration saved server-side.
- **Audit Trail**
  - Admin actions log with metadata (user, entity, timestamp, diff) accessible via audit viewer; API supports pagination and filtering.

## 6. User Account & Support
- **Bookings Dashboard**
  - Data aggregated from bookings service; statuses drive available actions (reschedule, cancel, contact provider).
  - Reschedule flow checks provider availability; alternate suggestions retrieved if unavailable.
- **Marketplace Orders**
  - Order detail view shows fulfilment timeline; return scheduling integrates with courier booking if required.
- **Support Tickets**
  - Submissions create ticket via `/api/support/tickets`; chat widget escalations link conversation history.
- **Loyalty & Referral Management**
  - Loyalty events update points ledger; redemption triggers wallet credit or coupon creation.
  - Referral tracking monitors invite link conversions and awards bonuses after verification.

## 7. Communications Suite
- **Unified Inbox**
  - Conversations loaded via `/api/messages`; websockets deliver new messages, read receipts, typing indicators.
  - AI assist requests call AI service; results inserted as drafts requiring confirmation.
- **Voice/Video Calls**
  - Launch checks Agora token; session metadata stored post-call for compliance.
- **Notifications**
  - Notification centre consumes aggregated feed; clicking item routes to relevant screen.
- **Template Management**
  - Support agents can create/update canned responses; changes versioned to allow rollback.

## 8. Error Handling & Resilience
- **Global Error Boundary**
  - Catches unexpected exceptions, logs to monitoring service, displays fallback UI with reload option.
- **Network Failures**
  - API calls have retry/backoff; UI surfaces inline error with retry button.
- **Offline Support**
  - Limited caching for key pages (bookings, provider jobs) using service workers to maintain read access.
- **Status Communication**
  - System status API feeds header banner and dedicated status page to inform users of incidents; updates poll every minute.

These logic flow updates ensure the React web app delivers seamless, role-specific experiences backed by real-time data and governance controls.

## Automation, Integrations & Observability
- **Automation**: Booking confirmation triggers invoice generation, CRM updates, and loyalty accrual jobs; admin approvals send webhook notifications to compliance systems.
- **External Services**: Geo-zonal explorer integrates with map provider for overlays; fallback static map image provided when API limits reached.
- **Analytics**: Each funnel step emits analytics events captured via Segment -> warehouse pipeline; dashboards referenced in analytics update docs.
- **Feature Flags**: New flows (e.g., AI assist, ads manager) gated via LaunchDarkly to allow gradual rollout and rollback.

## Error Handling & Recovery Enhancements
- **Graceful Degradation**: If websocket unavailable, system falls back to polling for job updates and chat messages with visual indicator.
- **Form Autosave**: Booking and campaign forms autosave to prevent data loss on navigation or connectivity issues, with restore prompt on return.
- **Rate Limiting Feedback**: When users hit API rate limits, UI surfaces countdown timer before next attempt.
- **Global Maintenance Mode**: Admin can trigger read-only mode; UI displays banner and disables modifying actions while still allowing browsing.

## Security & Compliance Notes
- **PII Handling**: Sensitive fields masked by default; reveal requires re-auth with MFA for admins handling disputes or compliance.
- **Audit Logging**: All admin and provider changes recorded with diff payloads stored for 2 years per compliance mandate.
- **Data Residency**: Logic flows ensure uploads route to region-specific storage; cross-region requests blocked with descriptive messaging.

## Implementation Checklist
1. Implement optimistic updates with rollback for high-frequency actions (kanban moves, chat messages).
2. Ensure GraphQL/REST clients handle token refresh uniformly across modules.
3. Validate keyboard navigation order for booking funnel and admin tables to comply with accessibility specs.
4. Coordinate with DevOps to set monitoring alerts on new websocket channels and automation jobs.
