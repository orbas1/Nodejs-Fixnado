# Component Functions & Behaviour — Web Application v1.00

## Interactive Logic Matrix
| Component | Primary Function | Data Dependencies | Error/Empty Handling | Performance Notes |
| --- | --- | --- | --- | --- |
| `HeroBanner` | Showcase campaigns and call-to-actions | CMS endpoint `GET /content/hero` returning slides | Default to static hero with fallback copy if API fails; show skeleton on load | Lazy-load background images with `loading="lazy"`, prefetch first slide |
| `GlobalSearch` | Cross-entity search with typeahead | GraphQL `search(query, entityTypes)` | Display "No matches" state with quick links; offline shows cached history | Debounce 250ms, limit 6 results per group |
| `ZoneHeatmap` | Visualise zone metrics | Mapbox tiles + GraphQL `zoneMetrics` | Show fallback choropleth PNG on Mapbox failure; overlay alert banner | Memoise GeoJSON features; throttle hover events 16ms |
| `ProviderCard` | Summarise provider offerings | REST `GET /providers/:id/summary` | Display placeholder avatar + contact CTA; `Unavailable` badge if offline | Preload detail page on hover using Next.js prefetch |
| `BookingTable` | Manage bookings with actions | GraphQL `bookings(filter, pagination)` | Empty state illustration with CTA to explore | Virtualise rows beyond 40 records; optimistic updates for status changes |
| `MessagingDrawer` | Persistent conversations | Websocket `wss://chat.fixnado.com` + REST history | Show retry toast on socket drop; offline compose stored in IndexedDB | Load thread list first, fetch messages on demand |
| `ComplianceChecklist` | Track document status | REST `GET /compliance/items` | Flag expired documents with red badge; link to upload | Use SSE to update statuses when verification completes |
| `CampaignBuilder` | Configure marketing campaigns | GraphQL `campaignConfig`, `mutateCampaign` | Inline validation for budget, schedule; show wizard progress | Autosave draft every 15s; chunk file uploads |

## State Machines
- **Booking Lifecycle**: `requested → quoted → confirmed → on_site → completed → invoiced → archived`. Each state triggers UI updates (status pill colour, available actions). State transitions defined in `web_application_logic_flow_changes.md`.
- **Sidebar Navigation**: `expanded ↔ collapsed ↔ drawer`. Controlled by viewport width and user preference stored in `localStorage.sidebarState`.
- **Form Autosave**: `idle → dirty → saving → saved` with 5s inactivity threshold to trigger autosave, spinner displayed next to section title.
- **Command Palette**: `closed → opening → ready → executing → closing`. Animations 120ms fade, 160ms slide.

## Accessibility Behaviours
- All interactive components implement ARIA roles: `role="dialog"` for modals, `role="tablist"` for tab bars.
- Focus trapping inside overlays using `focus-trap` utility. ESC closes overlays; shift+tab wraps.
- Live regions for asynchronous feedback: toasts use `aria-live="polite"`, error banners `aria-live="assertive"`.

## Animations & Micro-interactions
- Buttons use `transition: background-color 160ms ease, transform 160ms ease` with `transform: translateY(-1px)` on hover, `translateY(0)` on active.
- Map markers scale from `0.8 → 1` and fade when hovered to indicate selection.
- Progress steppers animate bar fill `width` transitions 240ms.
- Drawer reveals using `translateX(100%) → 0` over 320ms, easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Error Prevention & Recovery
- `FormSection` disables submit until validation passes; show inline tooltip for numeric inputs exceeding thresholds.
- `CampaignBuilder` warns when budget below recommended using `info` banner with link to knowledge base.
- `BookingTable` mass actions require confirmation modal with summary counts.
- `MessagingDrawer` auto-saves drafts locally; unsent messages restored on reconnect.

## Telemetry & Analytics
- Components emit events via `@fixnado/analytics` package. Example payload: `{ component: 'HeroBanner', action: 'cta_click', variant: 'geo-coverage', userRole: 'consumer' }`.
- Performance metrics tracked with `web-vitals` (CLS, FID) and custom events (map render time, chat connect time).
- Error logs forwarded to Sentry with component context, props snapshot (sanitised).

## Testing Considerations
- Provide Storybook stories with controls for state permutations; include accessibility tests via Axe addon.
- Cypress component tests cover keyboard navigation, responsive breakpoints, API error handling.
- Visual regression snapshots stored in Chromatic; diff threshold 0.2% per component.
