# Component Functions & Behaviour — Web Application v1.00

## Interaction Matrix
| Component | Primary Function | Data Sources | Failure & Fallback Handling | Telemetry |
| --- | --- | --- | --- | --- |
| `HeroBanner` | Surface key campaigns and zone stats | CMS GraphQL `heroSlides` + fallback JSON `public/assets/hero/hero-default.json` | If CMS fails, load default slide set (3 slides) and display info toast `content_offline`. Carousel paused to prevent user confusion. | `hero_slide_change`, `hero_cta_click`, `hero_dismiss` events via `@fixnado/analytics`
| `GlobalSearch` | Search providers, zones, bookings with autocomplete | GraphQL `search(query, types[])`; caches last 5 queries in IndexedDB | On network error, show inline error `Can't connect` and display cached results below. Offline indicator surfaces in header. | `search_query`, `search_result_click`, `search_empty` (with query length)
| `ZoneHeatmap` | Render zone polygons and metrics | Mapbox vector tiles + GraphQL `zoneMetrics(zoneIds[])` | If map token invalid, fallback to static PNG `public/assets/maps/map-fallback@2x.png` with overlay legend disabled. Provide `Retry` button. | `map_filter_change`, `map_polygon_hover`, `map_polygon_select`
| `ProviderCard` | Present provider summary with quick actions | GraphQL `providerSummary(id)`; requires `rating`, `availability`, `packages` | On stale data (>10 min) show badge `Update pending`. If data missing, show placeholder avatar and disable CTA with tooltip. | `provider_card_open`, `provider_card_book`, `provider_card_compare`
| `BookingTable` | Manage bookings with inline actions | GraphQL `bookings(filter, pagination)`; Websocket `bookingsRealtime` for status updates | If websocket disconnects, switch to polling every 45s and display toast `Live updates paused`. Bulk action failures display modal summary with error rows. | `booking_row_open`, `booking_status_change`, `booking_bulk_action`
| `MessagingDrawer` | Provide persistent chat and call controls | Websocket `chatStream`; REST `GET /chat/threads`, Agora SDK for calls | Offline drafts stored in IndexedDB `chat_drafts`. Socket reconnection attempts exponential backoff (5 attempts). In-call failure triggers `Retry` prompt. | `chat_message_send`, `chat_call_start`, `chat_ai_toggle`
| `ComplianceChecklist` | Track document completion and escalate issues | REST `GET /compliance/items`, SSE `compliance/status` | Document upload errors show inline card with `Retry`. Expired documents escalate to `danger` pill and send notification via `NotificationCentre`. | `compliance_item_upload`, `compliance_item_complete`, `compliance_item_overdue`
| `CampaignBuilder` | Configure marketing campaigns with wizard | GraphQL `campaignConfig`, `POST /campaigns/draft`, file uploads to S3 via signed URL | Autosave every 15s; offline autosave stored locally and sync on reconnect. Upload failure surfaces inline error with `Retry`. Step guard prevents progression with validation errors. | `campaign_step_change`, `campaign_budget_adjust`, `campaign_submit`
| `SettingsForm` | Manage profile, notifications, security | GraphQL `userSettings`, `updateSettings` mutations | Inline validation; unsaved changes prompt on navigation. Security tab integrates MFA enabling via OTP modal. | `settings_save`, `settings_toggle`, `settings_logout_all`
| `CommandPalette` | Quick command execution across app | Aggregated data from local manifest + GraphQL | Debounced 180ms; offline uses cached commands. Unknown command surfaces suggestion link to knowledge base. | `command_palette_open`, `command_palette_execute`

## State Machines & Logic
- **Sidebar Navigation**: `expanded → collapsed → drawer`. Default state stored in `localStorage('sidebar_state')`. Drawer triggered automatically on `<1024px` or when user toggles via hamburger. On reload, UI respects stored preference but ensures accessible path (if collapsed and focus trap required, focus moves to first nav item).
- **Booking Lifecycle**: `requested → quoted → confirmed → en_route → on_site → completed → invoiced → archived`. Each transition triggers UI updates:
  - `requested`: CTA `Assign provider` active.
  - `quoted`: CTA `Send quote` -> `Awaiting approval` badge.
  - `confirmed`: Timeline card highlight.
  - `on_site`: Map pin pulses (#00B894) every 800ms.
  - `completed`: Survey toast triggered.
  - `invoiced`: Payment summary displayed.
  - `archived`: Row dims to 60% opacity and moves to history filter.
- **Form Autosave**: `idle → dirty → saving → saved`. Dirty state triggered when field changes; 5s debounce before `saving`. If response >3s, show inline spinner + `Saving…`. If failure, state reverts to dirty and error banner surfaces with `Retry` button.
- **Filter Drawer**: `closed → opening → open → applying → closing`. On apply, overlay stays visible until data fetch resolves; spinner in CTA. ESC or overlay click triggers closing with focus return to trigger button.
- **Command Palette**: `closed → opening (scale 0.96 → 1) → ready`. On command execution, `executing` state disables inputs, shows progress indicator; success closes palette, failure shows inline error.

## Accessibility Behaviours
- All focusable elements implement `focus-visible` outlines `3px #0EA5E9` offset 3px.
- Drawer and modal components use `focus-trap` ensuring shift+tab cycles inside. On close, focus returns to initiating button.
- Map controls support keyboard: arrow keys pan 60px, `+/-` zoom, `F` toggles full screen, `L` opens legend. Provide textual instructions inside help tooltip.
- Charts expose underlying data table via `aria-describedby` linking to hidden table toggled by `View data as table` button.
- Carousel auto-rotation pauses on `prefers-reduced-motion` or user interaction.

## Motion & Micro-interactions
- Hover transitions 160ms `cubic-bezier(0.4, 0, 0.2, 1)` for buttons, cards.
- Drawer entrance `transform: translateX(100%) → 0` over 320ms `cubic-bezier(0.22, 1, 0.36, 1)`; exit symmetrical.
- Map polygon hover adds 1px stroke animation scaling with `transition: stroke-width 120ms ease-out`.
- Notification badge pulses once (scale 1→1.12→1) 400ms when new items available.
- Command palette fade uses `opacity 0 → 1` 140ms, `backdrop-filter: blur(6px)`.

## Error Prevention & Recovery
- **Form Validation**: Real-time validation for email, phone, numeric budgets. Numeric inputs clamp to defined ranges using `clamp()` functions; exceeding values show tooltip with allowed range.
- **Unsaved Changes**: `beforeunload` prompt triggered when forms in dirty state. Navigation guard modal summarises unsaved fields.
- **File Uploads**: Accepts PDF, DOCX, PNG, JPG ≤ 15MB. Progress bar 4px height showing percentage; failure surfaces red message with `Retry` (retries up to 3 times). Virus scanning status displayed as secondary badge.
- **Session Expiry**: Warning modal triggers 2 minutes before token expiry with CTA `Extend session`. Auto-logout returns to `/login` with toast `Session expired`.
- **Rate Limits**: Search throttle ensures <10 requests/min; when exceeded, surfaces banner `Rate limit reached` with countdown timer.

## Telemetry & Observability
- All components emit analytics via `@fixnado/analytics` with payload structure `{ component, action, variant, metadata }`.
- Performance metrics logged with `web-vitals` and custom spans: `map_render_duration`, `table_refresh_duration`, `drawer_time_to_interaction`.
- Errors reported to Sentry include component name, props snapshot (sanitised), user role, correlation IDs from backend.
- Logging level toggled by feature flag `web-telemetry-enhanced`. When enabled, components output debug logs to console group for QA.

## Testing Strategy
- **Storybook**: Each component has stories for default, hover, active, focus, error, loading, empty. Accessibility addon ensures contrast and keyboard paths.
- **Unit/Integration**: React Testing Library covers event handlers (click, keyboard) and ensures ARIA attributes present. Mock API responses using MSW.
- **E2E**: Cypress flows verifying cross-component coordination (e.g., map filter updates results list). Includes network throttling scenarios to test skeletons.
- **Visual Regression**: Chromatic snapshots captured across breakpoints. Tolerance 0.2% for gradient transitions, 0.1% for static components.
- **Performance**: Playwright with Lighthouse plugin for hero load (LCP), map interactions (FID). Set budgets LCP < 2.7s, total blocking time < 150ms.

## Implementation Notes
- Components must be tree-shakeable. Expose as named exports from `@fixnado/ui` with TypeScript interfaces referencing design tokens (`FixnadoColorToken`, `FixnadoSpacingToken`).
- Keep DOM structure minimal: avoid nested div >4 levels for cards; use semantic elements (`<article>`, `<aside>`, `<nav>`, `<header>`).
- Provide CSS variables for theming; avoid hardcoded colours.
- Ensure components degrade gracefully when JavaScript disabled (hero shows static hero, forms still submit).
- Document dependencies in component README linking to spec sections.
