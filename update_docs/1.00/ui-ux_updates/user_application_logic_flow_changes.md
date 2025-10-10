# User Application Logic & Flow Changes

## 1. Authentication & Onboarding
- **Entry Decision Tree**
  - Splash screen checks login state; authenticated users routed to Explore, unauthenticated to login/register.
  - Social login (Apple, Google) integrates with existing account linking; fallback email OTP available.
  - Onboarding wizard collects location permission, service interests, notification preferences, and optional identity verification for high-risk services.
- **Consent Management**
  - GDPR modal requires explicit acceptance of data usage, AI assist disclaimer, and marketing preferences.

## 2. Geo-Zonal Discovery Flow
- **Location Detection**
  - App requests GPS or manual address entry; geocoded coordinates determine default zone overlay.
  - Zone selection persists to local storage; cross-device sync via user profile.
- **Search Execution**
  - Typing triggers debounced query to `/search/providers` with zone context; results update list and map.
  - Filters apply client-side first, then server call for refined dataset.
- **Provider Selection**
  - Selecting provider opens overlay; "Book" initiates booking flow pre-filled with provider ID, "Chat" opens conversation.
- **Notification Feed**
  - Booking milestones, promotions, and compliance alerts aggregated into feed with deep links; ack state stored server-side to maintain cross-device consistency.

## 3. Booking Lifecycle
- **Job Definition**
  - Stepper validates required fields before allowing progression; attachments upload asynchronously with progress indicator.
  - Urgent bookings enforce minimum lead time checks; if unmet, displays alternative providers offering on-demand support.
- **Provider Matching**
  - If user opts for auto-match, system posts job to bidding queue; UI displays "Awaiting bids" state with estimated response time.
  - Manual selection bypasses bidding and immediately reserves slot if provider availability exists.
- **Package Customisation**
  - Add-ons and rentals adjust pricing summary in real-time; incompatible combinations disabled with tooltip explanation.
- **Scheduling & Payment**
  - Calendar ensures provider availability; conflicts prompt alternative slot suggestions.
  - Payment step supports wallet balance application, promo codes, split payments; validations ensure deposit coverage.
- **Confirmation & Post-Booking**
  - Upon confirmation, booking detail page opens with timeline and ability to invite collaborators (family members) via share link.
  - Notifications scheduled for reminders (24h, 2h) and check-in prompts.

## 4. Booking Management
- **Status Tracking**
  - Real-time updates via push sockets; statuses include Requested, Bidding, Pending Confirmation, Scheduled, En Route, On Site, Completed, Disputed, Cancelled.
  - Each status updates timeline and available actions (e.g., during Bidding -> View bids, accept; Scheduled -> Reschedule/Cancel).
- **Rescheduling & Cancellation**
  - Reschedule flow enforces provider availability check; if unavailable, suggests alternative providers or times.
  - Cancellation collects reason, displays fee breakdown, and triggers refund logic via payments API.
- **Dispute Handling**
  - Dispute CTA opens structured form capturing issue type, description, evidence uploads; submission notifies compliance team.

## 5. Marketplace Transactions
- **Catalogue Interaction**
  - Filters persist across sessions; adding to cart triggers verification of stock availability.
  - Rental durations auto-calculate deposit and extension fees.
- **Checkout**
  - Mixed cart (service + rental) merges into single checkout; logic ensures scheduling alignment.
  - Delivery options require address validation; same-day delivery prompts cut-off warnings.
- **Order Tracking**
  - Post-purchase timeline shows fulfilment stages (Processing, Packed, In Transit, Delivered, Return Due, Returned).
  - Overdue returns trigger notifications and penalty calculation.
- **Rental Extensions**
  - Users can request extension; system validates overlapping bookings and recalculates charges before confirming.

## 6. Communication & Support
- **Chat Flow**
  - Conversations scoped per booking; system messages log status updates (provider accepted, ETA changes).
  - AI Assist suggestions appear as chips; selecting inserts editable draft.
  - Read receipts and typing indicators provide transparency.
- **Voice/Video Calls**
  - Launching call checks provider availability and permissions; failure states redirect to message with fallback instructions.
- **Support Escalation**
  - Within chat, users can escalate to Fixnado support, creating ticket with context.
  - Support centre form auto-populates booking ID when accessed via booking detail.

## 7. Profile & Preferences
- **Payment Methods**
  - Adding card uses tokenisation; validation ensures billing address completeness.
  - Wallet top-up integrates with payment gateway; success updates balance immediately.
- **Addresses & Access**
  - Address list supports geofencing; gating ensures providers only see relevant access details when job confirmed.
- **Notifications & Accessibility**
  - Preferences stored server-side; toggling updates push/email subscription services.
  - Accessibility settings (font size, high contrast) persist across sessions.
- **Loyalty & Rewards**
  - Loyalty progress updates after completed bookings; rewards redemption triggers wallet credit or discount application logic.
  - Referral tracking generates shareable link, monitoring conversion status for bonus unlocks.

## 8. Error & Offline Handling
- **Offline Mode**
  - App caches recent bookings and messages; actions (new booking, payment) queue with warning banners.
- **Error Resolution**
  - Failed payments prompt retry or alternate method selection; logs error code for support.
  - API errors show contextual messages and offer to contact support.
- **Observability & Support**
  - Client logs sync to monitoring service when severe errors occur, attaching anonymised booking IDs to assist support agents.
  - In-app status page surfaces incident notifications sourced from status API with auto-refresh every 60 seconds.

The updated logic ensures a seamless, transparent booking experience while maintaining compliance and providing robust support pathways.

## Analytics, Automation & Support Workflows
- **Automation Events**: Booking milestones automatically schedule notifications, invoice generation, and loyalty point accrual; logic ensures cancellations reverse pending rewards.
- **AI Assist Governance**: AI suggestions logged with user override decisions to refine training data while respecting privacy policies.
- **Telemetry Coverage**: Flow documents specify events for search engagement, filter application, bid acceptance, and dispute initiation to support product analytics dashboards.

## Exceptional Scenarios & Safeguards
- **High-Risk Services**: Certain categories (e.g., electrical) require additional waiver flow; logic inserts consent step before final confirmation.
- **Provider Unavailability**: When provider cancels, system proposes top alternative matches and offers compensation voucher automatically.
- **Payment Failures**: Retries limited to three; after failure, wallet automatically refunds deposits and prompts user to update method.
- **Service Interruptions**: Status page integration surfaces incidents; bookings in progress display fallback instructions (emergency contacts, offline checklist).

## Implementation Reminders
1. Persist draft bookings securely with encryption to protect sensitive notes and attachments.
2. Ensure chat history sync prioritises latest 50 messages for faster load, with lazy fetch for older threads.
3. Configure push notification categories for bookings, marketplace, support to align with new preference toggles.
4. Validate localisation for currency, date/time, and measurement units across booking summaries and invoices.
