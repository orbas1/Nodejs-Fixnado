# User App Wireframe Changes (Flutter)

## Navigation Model
- Persistent bottom navigation with tabs: **Discover**, **Bookings**, **Messages**, **Profile**.
- Global floating action button for "Request Custom Job" accessible from all tabs.

## Key Screens
1. **Discover Explorer**
   - Search bar with filters (zone, category, rating, language).
   - Scrollable hero for Finova Ads and promotional banners targeted by zone.
   - Provider and rental cards showing compliance badges, availability, and price range.
2. **Service Detail**
   - Carousel for images/videos, quick facts, AI summary of reviews.
   - Tabs for Packages, Custom Work, Tool Rentals.
   - Sticky CTA area (Book Now, Schedule Call, Start Chat) with pricing transparency.
3. **Booking Wizard**
   - Step progress indicator (Service > Schedule > Extras > Review > Payment).
   - Calendar integrated with provider availability; alternative recommendations for conflicts.
   - Add-ons and rental selection stage with visual cards and deposit info.
4. **Custom Job Request**
   - Guided template capturing problem statement, budget, attachments, zone selection.
   - AI helper chip suggests clarifying questions.
   - Confirmation screen summarises bids timeline and notification expectations.
5. **Messages & Collaboration**
   - Inbox segmented by job, provider, and system notifications.
   - Thread view integrates Agora call entry points and AI-suggested follow-ups.
   - Document exchange panel for quotes, compliance proof, and invoices.
6. **Booking Management**
   - Timeline of job status (Requested, Confirmed, In Progress, Completed, Review Pending).
   - Real-time map for provider en route, with ETA and contact actions.
   - Cancellation/reschedule options with policy reminders.
7. **Profile & Preferences**
   - Sections for payment methods, addresses, accessibility settings, AI consent toggles.
   - Activity summary featuring completed jobs, favourite providers, and loyalty rewards.

## Interaction Enhancements
- Microcopy emphasises transparency on fees, deposits, cancellation terms.
- Loading skeletons shaped to final card layout to reduce perceived wait times.
- Empty states include illustrations and quick actions (Explore Services, Post Custom Job).

## Accessibility & Localisation
- Font scaling tested up to 200% with responsive card stacking.
- Multi-language support toggled from profile; ensures text expansion by 30% without truncation.
- VoiceOver labels include zone and compliance status for each provider card.
