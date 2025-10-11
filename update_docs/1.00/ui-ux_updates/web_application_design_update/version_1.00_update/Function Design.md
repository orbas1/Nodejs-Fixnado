# Functional Design Overview — Web Application v1.00

## Core Journeys
1. **Zone Discovery → Booking**
   - User lands on Explorer, selects zone polygon, reviews provider list, books slot via multi-step modal.
   - Integration: Mapbox GL, GraphQL zone endpoints, booking REST API.
   - Key screens: Explorer, Provider profile, Booking wizard.
2. **Provider Campaign Management**
   - Provider logs in, navigates to Marketplace, configures ad campaign, monitors performance.
   - Integration: Campaign GraphQL API, analytics feed, billing microservice.
3. **Compliance Renewal**
   - Provider receives alert, opens Compliance Centre, uploads documents, tracks verification status.
   - Integration: Document storage service (S3), compliance API with SSE updates.
4. **Admin Oversight**
   - Admin views dashboards, filters by zone, exports reports, manages disputes.
   - Integration: Admin GraphQL queries, export service, messaging tools.

## Functional Modules
| Module | Responsibilities | Key Components | Dependencies |
| --- | --- | --- | --- |
| Explorer | Map rendering, zone filtering, provider listings | `ZoneHeatmap`, `FilterDrawer`, `ProviderCard` | Mapbox, zone metrics API |
| Booking | Availability selection, checkout, confirmation | `BookingTable`, `FormSection`, `ProgressStepper` | Booking API, payments service |
| Marketplace | Campaign creation, pricing, analytics | `CampaignBuilder`, `BudgetSlider`, `TrendChart` | Billing API, analytics |
| Compliance | Document management, status tracking | `ComplianceChecklist`, `UploadZone`, `Timeline` | Compliance API, notifications |
| Messaging | Conversations, notifications, AI assist | `MessagingDrawer`, `MessageComposer`, `AttachmentPicker` | Chat websocket, AI suggestion API |
| Settings | Profile, notifications, billing preferences | `FormSection`, `Toggle`, `CardList` | User profile API, billing |

## Functional Requirements
- **Real-time Updates**: Bookings and chat use websockets for immediate state sync. Fallback to polling (30s interval) if websocket fails.
- **Offline Support**: Cache last 20 providers and messages using IndexedDB. Provide banner when offline with limited functionality.
- **Role-based Access**: Use `@fixnado/auth` guard to gate routes by role (consumer, provider, admin). Sidebar menu items filtered accordingly.
- **Auditing**: Capture user actions (exports, status changes) with timestamp and user ID for compliance logs.

## Error Handling
- Implement global error boundary showing friendly message with `Retry` button. Provide error codes for support reference.
- Module-specific fallback content (e.g., Explorer fallback static map with CTA to refresh).
- Upload errors show inline details (max file size 15MB, accepted formats PDF/JPG/PNG).

## Automation Hooks
- Provide event bus topics: `booking.confirmed`, `campaign.updated`, `document.approved` consumed by automation workflows.
- Use webhooks for external integrations (CRMs). Document handshake flows in `web_application_logic_flow_changes.md`.

## Security Considerations
- All sensitive data requests require JWT with scopes. Refresh tokens handled server-side; UI indicates session expiry.
- File uploads scanned via antivirus lambda; UI displays "Scanning" status until cleared.
- Input sanitisation enforced at API, but UI escapes all user-generated content before rendering.

## Measurement & KPIs
- Track conversion funnel: visits → zone views → provider clicks → bookings. Display in analytics dashboard.
- Monitor booking completion time (goal < 4 minutes) and chat response time (goal < 2 minutes).
- A/B testing harness toggles hero variations; UI reads feature flags from LaunchDarkly.

## Implementation Plan
1. Prioritise Explorer and Booking modules for sprint 1 (foundation for other flows).
2. Build shared components (buttons, cards, forms) aligning with design tokens.
3. Integrate analytics and telemetry early to capture baseline metrics.
4. Conduct usability testing with providers/admins to validate flows before release.

## Communications Suite Functional Flows (Updated 2025-10-22)

### Messages Workspace Initialisation
1. Authenticate via `@fixnado/auth` guard ensuring scopes `chat:read`, `chat:write`, `chat:notifications` and feature flag `communications-suite` enabled.
2. Fire parallel data requests:
   - `GET /api/chat/threads?include=lastMessage,unreadCount,slaDueAt` with `If-None-Match` for cache validation.
   - `GET /api/chat/notifications?status=pending&channels=chat,ops` returning `X-Quiet-Hours` header (e.g., `22:00-06:00`).
   - `GET /api/chat/preferences` fetching AI consent timestamp, notification override state, and composer defaults.
3. Establish websocket `wss://api.fixnado.com/chat` (JWT auth). Listen for `thread.updated`, `message.created`, `notification.created`, `session.updated`. Fallback pollers trigger if socket closes >3 times in 2 minutes.
4. Render 320px thread rail, 640px conversation canvas, and persistent notification drawer anchored right. Emit telemetry `chat.thread.index_load` capturing pinned/unread counts, quiet-hour flag, and AI consent status.

### Conversation Hydration & Infinite Scroll
1. Selecting a thread calls `GET /api/chat/threads/:id/messages?cursor=latest` (50 messages). Response includes `nextCursor` and `hasMore`.
2. Messages mount in virtualised list with reversed order; day separators inserted server-side. SSE/WS events append inbound messages; fallback poll `GET ...?since=lastMessageAt` every 20s.
3. Moderated messages display red border + tooltip linking to compliance runbook. Attachments >25MB blocked client-side; download uses signed URL from payload.
4. Offline detection (`navigator.onLine === false`) surfaces offline banner, disables send button, and queues outbound messages in IndexedDB `chat_drafts`.
5. Telemetry: `chat.message.fetch`, `chat.message.stream`, `chat.message.attachment_open`, `chat.message.moderation_view`.

### Composer, AI Assist & Draft Persistence
1. Composer initialises with AI toggle from `/api/chat/preferences`. If `aiConsentAt` missing, enabling toggle opens modal summarising moderation, retention, and billing usage. Confirmation posts to `/api/chat/threads/:id/ai-toggle`.
2. Draft autosave runs every 2s storing `{ body, attachments }` in IndexedDB keyed by thread. Offline queue prompts `Queued — tap to retry` chip which posts stored payload when network restores.
3. Sending message posts to `/api/chat/messages`. Response success updates optimistic bubble; failure `409 moderation_required` triggers guidance modal with link to `KB-CHAT-014`.
4. AI suggestions call `/api/chat/messages/assist` using conversation summary (last 5 messages). Results show chips with confidence scores; acceptance logs `chat.ai.suggestion.accept` and populates composer.
5. Token usage meter reads `X-AI-Token-Usage` header; >80% shows amber banner, 100% disables toggle + displays contact support CTA.

### Notification Drawer & Escalation
1. Drawer polls `/api/chat/notifications` (45s) unless websocket event arrives. Cards sorted severity → SLA due time.
2. Acknowledgement uses PATCH `/api/chat/notifications/:id/acknowledge` with optional note; success removes card, triggers toast, logs `chat.notification.ack`.
3. Escalation opens modal prefilled by `/api/chat/notifications/:id/escalation-options`; POST escalate writes Slack/email jobs and adds `Escalated` chip with audit metadata.
4. Quiet hours show info banner summarising deferred alerts. Override CTA posts `/api/chat/notifications/override` granting 60-minute window; analytics event `chat.notification.override` recorded.
5. Accessibility: drawer focus trap, `aria-live="assertive"` for severity critical, ack/escalate buttons maintain 44px targets.

### Agora Session Launch & Fallback
1. `Start call` button runs hardware check via `navigator.mediaDevices.enumerateDevices()`. Missing device triggers help banner.
2. POST `/api/chat/sessions` returns token, channel, expiry, `pstnFallbackNumber`. Preflight modal renders video preview, audio meter, bandwidth indicator (Agora stats API).
3. Joining session initialises Agora SDK with handlers for connection state and token refresh. Token expiry warning calls `/api/chat/sessions/:id/refresh`.
4. Failure flows: `Retry connection`, `Switch to voice`, `Dial in` (shows PSTN number + PIN). Dial-in logs `chat.session.pstn` and collapses to audio-only controls.
5. Session end posts analytics `chat.session.end` with duration, participants, MOS score. Accessibility includes keyboard shortcuts (`M` mute, `V` video, `Esc` exit) and screen reader announcements for join/leave.

### Compliance & Telemetry Hooks
- Data retention copy references DPIA appendix `docs/compliance/dpia.md#chat-transcripts`.
- Telemetry payloads include `{ threadId, messageId, aiAssistEnabled, quietHoursActive, sessionType }` ensuring analytics dashboards map adoption + SLA adherence.
- QA selectors (`data-qa="thread-card"`, `data-qa="message-bubble"`, `data-qa="composer-ai-toggle"`, `data-qa="notification-card"`, `data-qa="session-launch"`) documented for automation harness.

