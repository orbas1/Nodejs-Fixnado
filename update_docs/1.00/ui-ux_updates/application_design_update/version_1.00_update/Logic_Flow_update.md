# Logic Flow Update — Phone Application v1.00

## High-Level Architecture
- **State Management**: Riverpod with feature-specific providers. Use `StateNotifierProvider` for complex flows (booking, messaging).
- **Navigation**: `GoRouter` adoption with nested routes to handle deep linking and bottom nav structure.
- **Data Layer**: RESTful endpoints with caching via `dio` + interceptors. Real-time via WebSocket for messaging, SSE for alerts.

## Core Flows
### Authentication
1. App launch triggers `AuthBootstrap` provider.
2. Validate token via `/auth/token/validate`.
3. Fetch profile `/users/me`. If `role=provider` fetch `/providers/:id/status` else `/users/:id/preferences`.
4. Determine next screen per logic map.

### Explore
- Map data fetched from `/zones/active` with query `lat`, `lng`, `radius`.
- Provider list from `/providers/search` with filters (service_type, price_range, language, availability, rating, zone_id).
- When filter applied, update query parameters and re-fetch concurrently. Use caching TTL 5 min.
- Map interactions (pan/zoom) update bounding box; throttle to 800ms to avoid API flooding.

### Booking Flow
1. Step 1 loads packages from `/providers/:id/packages` + add-ons from `/providers/:id/addons`.
2. Step 2 collects address via `/users/:id/addresses` + manual entry with Google Places API fallback.
3. Step 3 initiates payment intent `/payments/intent`. Use Stripe PaymentSheet. On success, call `/bookings` to create record, update provider availability.
4. Success updates analytics event `booking_created` with zone + service tags.

### Marketplace Promotions
- Pull campaigns from `/marketplace/campaigns?zone_id=...`.
- Activation triggers `/campaigns/:id/activate` requiring provider subscription check `/subscriptions/status`.

### Messaging
- WebSocket channel `wss://api.fixnado.com/messages` with JWT auth.
- Message send posts to `/messages`, receives ack event. Typing indicators send `typing` events with TTL 8s.
- Attachments upload to `/storage/upload` returning CDN URL.

### Profile & Settings
- Preferences saved via `/users/:id/preferences` patch.
- Theme toggle stored locally but also in remote config for cross-device sync.
- Document uploads call `/compliance/documents` with metadata.

### Provider Dashboard
- Summary endpoint `/providers/:id/summary` returns KPIs (active_jobs, earnings_7d, compliance_score).
- Quick actions route to relevant endpoints `/jobs/start`, `/availability/log`.
- Alerts fetched via `/providers/:id/alerts` SSE stream.

## Error Handling
- Standard error model `{code, message, action}` displayed using `FixnadoErrorDialog`.
- Network errors trigger offline banner and exponential backoff (max 5 retries). Provide manual retry.

## Analytics
- Use Segment track events. Key events: `app_launch`, `login_success`, `zone_filter_applied`, `booking_started`, `booking_completed`, `campaign_activated`, `message_sent`, `document_uploaded`.
- Screen views logged with `screen_name`, `role`, `zone_id`.

## Security Considerations
- All requests use TLS 1.2+. Sensitive data stored with `flutter_secure_storage`.
- Document uploads sanitized; preview uses presigned URLs valid 5 minutes.
- Payment flows rely on Stripe ephemeral keys refreshed every 24 hours.

## Performance Targets
- API responses cached via HTTP caching headers. Preload next-step data (e.g., Step 2 address list) while user on Step 1.
- Keep provider list to max 20 items per page to maintain scroll performance.
- Use lazy loading for chat history with `ListView.builder` reversed, fetch earlier messages when scrolled to top.

## Telemetry & Experimentation
- Integrate with Experimentation service (`/experiments/config`) to toggle UI variants. Provide fallback path if config fails (assume control).
- Capture `experiment_id`, `variant` on analytics events to support A/B testing of booking CTA copy and marketplace banner placements.
- Use `FeatureProbe` gating for limited release modules (e.g., AI-assist chat suggestions).

## Edge Case Handling
- When user toggles provider/user role (dual-role accounts), reset caches and re-fetch context-specific data before navigating to ProviderDashboard.
- Payment intents expire after 15 minutes; schedule timer to refresh intent if user idle on Step 3 beyond 10 minutes.
- Offline bookings store payload locally with `uuid` and sync once connection restored; status shows `queued` until confirmation arrives.
- Document uploads support pause/resume; chunked uploads 5 MB segments with progress persisted via local storage.

## Security & Compliance Enhancements
- Logging: mask PII before sending analytics or crash reports. Use `SensitiveDataRedactor` in interceptors.
- Access control: guard provider-only routes with `ProviderGuard` verifying `profile.role` and `complianceStatus != suspended`.
- GDPR: Provide `Delete account` flow that triggers `data_export` before removal, ensure confirmation UI references legal copy.

## Testing Strategy
- Implement unit tests for `StateNotifier` flows (auth, booking) verifying state transitions align with logic map.
- Integration tests using `flutter_driver` to validate cross-screen navigation, especially multi-step flows and deep links.
- Contract tests with backend mocks verifying error responses display correct messaging and fallbacks.
