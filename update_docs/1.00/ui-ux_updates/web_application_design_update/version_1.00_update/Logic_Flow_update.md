# Logic & Flow Update — Web Application v1.00

## Architecture Overview
- **Framework**: Next.js 13 app router with server components for data fetching, client components for interactive modules (map, charts).
- **State Management**: `@tanstack/react-query` (SWR alternative) for data caching + optimistic updates.
- **Styling**: `styled-components` with CSS variables from design tokens.

## Core Flows
### Authentication
1. Middleware checks JWT cookie. If absent, redirect to `/login`.
2. Login form posts to `/api/auth/login`; on success sets httpOnly cookie, triggers revalidation.
3. `useSession` hook provides role, permissions, zone context.

### Explorer
- Query parameters `?query=&zone=&service=&price=` drive GraphQL `searchProviders`.
- Map interactions dispatch `setBounds`, triggers re-fetch with bounding box filter.
- Provider selection opens modal, uses `router.push` with `?providerId=` for deep linking.

### Booking
- Multi-step wizard stored at `/booking/new`. Each step uses context provider storing details.
- Payment uses Stripe Elements; on confirmation, call `/api/bookings` to persist.
- Confirmation page fetches booking details server-side for SEO.

### Dashboard (User)
- Fetch summary via GraphQL `userDashboard` query returning metrics, bookings, alerts.
- Activity feed uses websocket `wss://api.fixnado.com/events` filtered by user id.

### Provider Dashboard
- GraphQL query `providerDashboard` with nested data: jobs, bids, compliance, earnings.
- Bidding console uses `@dnd-kit` for drag; updates order via `/api/bids/reorder`.
- Compliance tasks fetch from `complianceTasks` query; upload uses signed URLs.

### Marketplace
- `marketplaceCampaigns` query with pagination. Activation wizard triggers mutation `activateCampaign`.
- Analytics view uses aggregated data `campaignAnalytics(zoneId, period)`.

### Settings
- `/settings` page loads sections lazily. Mutations update profile, preferences, notifications. Use optimistic UI with fallback.
- Security actions (enable MFA) call `/api/security/mfa` and refresh session.

### Notifications
- SSE endpoint `/notifications/stream`. Drawer subscribes and updates `react-query` cache.
- `MarkAllRead` mutation invalidates list.

## Error Handling
- Global error boundary renders friendly error page with retry.
- API errors surface toast with message from `error.message` fallback "Unexpected error occurred".
- Offline detection via `navigator.onLine`; shows banner and disables fetch triggers.

## Performance Targets
- Largest Contentful Paint < 2.5s on desktop, < 3.0s on mobile.
- Interaction to Next Paint (INP) < 200ms for navigation interactions.
- Use code splitting for heavy modules (map, charts) with dynamic imports.

## Security
- CSRF protection via anti-forgery token in forms.
- Strict Content Security Policy for Mapbox + CDN domains.
- Sanitize file uploads server-side.
