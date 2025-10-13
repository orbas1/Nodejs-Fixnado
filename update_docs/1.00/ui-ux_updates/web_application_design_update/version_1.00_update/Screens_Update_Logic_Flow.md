# Screen Logic Flow — Web Application v1.00

## Public Explorer
1. Landing loads hero with search. Query submission triggers route `/explorer?query=` and loads map/list view.
2. Filters (services, price, zone, availability) update query params; data fetched via GraphQL `searchProviders` with SSR hydration on first load.
3. Selecting provider card opens modal overlay; CTA `Book Now` routes to `/booking/new?providerId=`.

## Booking Journey
- Booking wizard uses multi-step layout (details, schedule, payment). Each step persists state in URL hash for refresh recovery.
- Payment integrates with Stripe hosted elements; on success, route to `/booking/confirmation/:id`.
- Confirmation page shows summary and suggestions for marketplace add-ons.

## Authentication & Session
- Next.js middleware checks JWT in cookies; redirect unauthenticated users from dashboard routes to `/login`.
- Role-based routing: provider/admin loads `/dashboard/provider`, consumer `/dashboard/user`.

## Provider Dashboard
- Sidebar navigation updates route segments `/dashboard/provider/:section`.
- Quick actions open drawers (e.g., `Start Job` -> `/dashboard/provider/jobs/:id`).
- Alerts panel listens to SSE channel `/providers/:id/alerts` for real-time updates.

## Marketplace Admin
- `Marketplace` route loads cards with infinite scroll. Activation triggers modal wizard; on completion, show toast and refresh list.

## Compliance Centre
- Accessed via `/compliance`. Stepper indicates progress. Document upload uses drag area; success triggers `refetch` and updates progress ring.

## Settings
- Located at `/settings`. Tabs update query `?tab=profile|notifications|security` enabling direct linking.
- Forms submit via GraphQL mutations with optimistic UI.

## Notifications
- Top bar bell opens side drawer listing notifications. Clicking item routes to target (booking, compliance, campaign) using router push.
- `Mark all read` mutation triggers UI update and removes badges.

## Responsive Navigation
- Desktop: left sidebar + top bar.
- Tablet: sidebar collapses to icon rail; overlay drawer accessible via hamburger button.
- Mobile: bottom navigation (4 icons) + floating action button for quick actions.

## Admin Dashboard (2025-11-03 update)
1. Load `/admin` route → fetch persona config + feature toggle manifest.
2. Parallel requests for KPI summaries, analytics charts, compliance queues, and performance status (`/api/operations/performance/status`).
3. When performance response returns:
   - Update load drill tile metrics + status badge.
   - Trigger aria-live message if `status === "breach"`.
   - Render drill timeline list sorted by `executedAt`.
4. `View summary` CTA opens drawer with JSON preview; on open fetch `/api/operations/performance/summary/:id` if not cached.
5. `Download report` button triggers file download + telemetry (`performance.load_drill.summary_download`).
6. Empty state path (no drills) displays CTA `Schedule rehearsal` linking to operations planner and logs telemetry `performance.load_drill.schedule_request`.
