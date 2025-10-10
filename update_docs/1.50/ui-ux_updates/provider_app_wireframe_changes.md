# Provider App Wireframe Changes (Flutter)

## Overview
The Version 1.50 release refactors the provider-facing Flutter experience to support multi-zone operations, collaborative bids, and AI-assisted communications. Wireframes now map a modular navigation paradigm anchored by four primary workspaces: **Operate**, **Leads**, **Inventory**, and **Inbox**.

## Screen Inventory & Layout Updates
1. **Operate Dashboard**
   - Hero card summarising today's jobs, pending approvals, and AI alerts.
   - Zone heatmap mini-widget and KPI strip for response times, SLA breaches.
   - Quick action rail ("Start Route", "Dispatch Team", "Review Compliance").
2. **Schedule & Availability**
   - Dual-layer calendar: top for team roster, bottom for personal availability.
   - Drag-and-drop blocks with conflict indicators, offline cache banners.
   - Side drawer listing service zones with toggle to broadcast availability.
3. **Job Board & Bidding**
   - Tabbed segments for Standard, Custom, and Rental jobs.
   - Each card shows zone badge, margin score, AI sentiment from chat, and risk flags.
   - Persistent "Compose Bid" CTA with cost estimator overlay.
4. **Custom Job Detail**
   - Split view with requirements, attachments, timeline, and Q&A threads.
   - Decision buttons (Accept, Counter, Decline) fixed at bottom for thumb reach.
   - Related bids timeline to compare competitor offers.
5. **Inventory & Rentals**
   - Grid for owned assets and rentals with stock levels and reorder alerts.
   - Rental calendar overlay for bookings, deposit status chips, and asset photos.
6. **Compliance Centre**
   - Progress ring for ID/DBS/insurance statuses and upcoming expirations.
   - Document upload cards with "Scan" and "Upload" buttons, expiry countdown.
   - Escalation checklist and audit log preview.
7. **AI Inbox**
   - Folders for clients, internal teams, system alerts.
   - Message list shows AI suggestion preview, flagged compliance keywords.
   - Compose view integrates quick replies, translation toggle, Agora call button.
8. **Settings & API Keys**
   - Tiles for profile, payments, notifications, AI integrations.
   - API key manager with masked entries, usage analytics, revoke action.

## Interaction Patterns
- Sticky bottom nav replaced by segmented tab bar to prioritise operations vs. communications.
- Floating global "+" entry point configurable to launch job creation, ad campaigns, or availability broadcasts.
- Toasts differentiate AI vs. system automation suggestions using iconography and colour-coded badges.

## Responsiveness Considerations
- Wireframes define breakpoints for small phones (360px), standard (390-430px), and tablets.
- Landscape mode reflows the dashboard into two columns, keeping action buttons accessible.
- Offline states display a grey overlay with cached timestamp and retry controls.
