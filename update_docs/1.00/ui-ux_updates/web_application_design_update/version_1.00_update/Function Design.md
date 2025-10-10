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
