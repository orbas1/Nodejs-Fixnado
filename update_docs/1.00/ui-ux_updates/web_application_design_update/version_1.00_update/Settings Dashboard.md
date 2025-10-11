# Settings Dashboard Specification — Web Application v1.00

## Layout
- Settings landing page uses 2-column layout: navigation list left (span 3), content panel right (span 9).
- Navigation list items 56px height with icon 20px and text `Inter 16/24`.
- Content panel max width 880px with 32px padding.

## Sections
1. **Profile**: Personal details, avatar upload, contact info.
2. **Notifications**: Email/SMS/app toggle matrix.
3. **Security**: Password, 2FA, session management.
4. **Billing**: Payment methods, invoices, usage.
5. **Marketplace Compliance** (provider/admin): Insurance badge configuration, policy uploads, renewal reminders, rental defaults.
6. **Integrations**: API keys, webhooks, CRM connections.
7. **Team Management** (admin only): Invitations, roles, permissions.

## Navigation Behaviour
- Navigation sticky within viewport; collapses into dropdown on mobile.
- Active item indicator bar 4px, colour `#1445E0`.
- Provide search field (width 240px) to filter settings pages.
- Marketplace compliance section uses sub-navigation chips (`Insurance`, `Badge visibility`, `Rental defaults`) displayed horizontally beneath navigation header.

## Content Panel Patterns
- Group fields into cards with titles `heading-sm`.
- Provide inline feedback after save (toast + inline "Changes saved").
- Display audit metadata ("Last updated by Dana at 14:22 UTC") in grey text 14/20.
- Compliance cards display policy expiry countdown and include `Download certificate` (secondary button) and `Request review` (primary button). Badge visibility toggle sits alongside preview badge showing real-time state updates.
- Rental defaults area features slider for damage deposit percentage (0–40%) with step 5% and info tooltip linking to policy docs.

## Forms & Validation
- Each section uses autosave where possible (profile, notifications). Security actions require explicit submit.
- Multi-step actions (e.g., enabling 2FA) open modal wizard with QR code.
- Validation: highlight errors with red border, show inline message.
- Insurance uploads enforce PDF/JPEG up to 20MB; progress bar 4px tall runs along top of upload card. Failure states show inline error `"File exceeds 20MB"` with retry link.
- Badge visibility toggle performs optimistic update with fallback error banner if `/marketplace/badge-visibility` returns 409 (policy expired).

## Responsiveness
- Tablet: nav list collapses to top tabs (48px height). Content panel full width.
- Mobile: nav transforms into accordion; default view shows Profile section, others collapsible.
- Buttons full width on mobile.

## Data Sources
- Profile data from `/me` endpoint, patched via `PATCH /me`.
- Notification preferences from `/preferences/notifications` (GraphQL mutation `updateNotificationPrefs`).
- Billing data via Stripe integration; invoices download link using signed URL.
- Marketplace compliance data from `/marketplace/policies/:id` (status, expiry, documents), `/marketplace/badge-visibility`, and `/marketplace/rental-preferences`.

## Security
- Sensitive actions (password change) require re-auth modal (enter password or SSO confirm).
- Display sessions list with revoke option; show device, IP, last active.

## Accessibility
- Each section labelled with `<h2>` and ARIA region.
- Provide `aria-live="polite"` for autosave messages.
- Keyboard accessible navigation (Up/Down arrow to move, Enter to select).
