# User App Wireframe Changes (Flutter)

## 1. Navigation Framework
- **Bottom Navigation Tabs**: Explore, Bookings, Marketplace, Messages, Profile.
- **Global Search**: Persistent search bar at top of Explore tab with voice input and filter shortcut.
- **Floating Quick Action**: Contextual FAB toggles between "Book Now" (Explore) and "Request Support" (Bookings & Messages).

## 2. Explore Tab Wireframes
- **Geo-Zonal Map View**
  - Full-screen map with polygon overlays representing service zones; legend accessible via fold-out panel.
  - Split view toggle to display map + provider list; list cards show provider rating, badges (Verified, Top Rated), pricing chips.
  - Filter drawer with categories: Services, Availability, Price Range, Response Time, Languages, Safety Credentials.
  - Zone insights ribbon with stats (Avg. response time, Active providers, Promotions).
- **Service Detail Overlay**
  - Slide-up sheet containing provider gallery, packages, reviews, service guarantees, and CTA buttons (Book, Chat, Save).
  - Add-on carousel for upsells (rental equipment, maintenance plans).
- **Promotion Carousel**
  - Horizontal cards featuring campaigns, each linking to curated service bundles.

## 3. Booking Flow Wireframes
- **Step 1: Define Job**
  - Form collects service category, job description, media upload (photos/videos), and urgency toggle (On-demand/Scheduled).
- **Step 2: Select Zone & Provider**
  - Map + list split; user can pick a provider or allow system match. Providers show bid estimates and availability slots.
- **Step 3: Customise Package**
  - Add-on selection grid, rental equipment checklist, special instructions field with templates.
- **Step 4: Schedule & Confirm**
  - Calendar picker, time slot selection, travel ETA preview.
  - Payment summary includes service cost, rentals, taxes, discounts.
- **Step 5: Review & Pay**
  - Confirmation of contact details, payment method (wallet, card, split payment), consent checkboxes (GDPR, safety policy).
  - CTA "Confirm Booking" with secondary "Save as Draft" option.
- **Post-Confirmation Screen**
  - Success banner, share booking link, add to calendar button, recommended add-ons.

## 4. Booking Management Wireframes
- **Bookings Tab**
  - Segmented controls for Upcoming, In Progress, Completed, Cancelled.
  - Cards show status pill, provider avatar, zone, next milestone (e.g., Provider en route), and quick actions (Chat, Reschedule, Cancel).
- **Booking Detail**
  - Timeline of events (Request sent, Bid accepted, Provider en route, Job completed).
  - Tabs: Overview, Checklist, Payments, Documents.
  - Dispute CTA anchored in footer for eligible statuses.

## 5. Marketplace Tab Wireframes
- **Catalogue Grid**
  - Toggle between Rentals and Purchases; each product card includes price, availability indicator, seller badge.
  - Filter chips (Category, Location, Availability dates, Insurance coverage).
- **Product Detail**
  - Media gallery, specs table, insurance information, reviews, bundle recommendations.
  - CTA to "Add to Booking" or "Rent Separately"; scheduling widget for rental duration.
- **Cart & Checkout**
  - Slide-in cart summarising items, deposit requirements, delivery options, cross-sell suggestions.

## 6. Messages Tab Wireframes
- **Conversation List**
  - Organised by booking; includes status indicator and unread message count.
- **Chat Detail**
  - Header shows provider name, job status, call buttons.
  - Message composer with quick prompts (Share Location, Confirm Access Instructions, Request Update).
  - Attachments tray for documents/photos.
  - AI Assist preview replies with ability to edit before sending.

## 7. Profile & Settings Wireframes
- **Profile Overview**
  - User avatar, loyalty tier, wallet balance, saved providers.
  - Quick links to Payment Methods, Addresses, Preferences, Compliance (GDPR data, consents).
- **Preferences**
  - Notification toggles by channel, language selection, accessibility options (font size, high contrast).
- **Support Centre**
  - Help topics, ticket history, escalate to live agent form.
- **Trust & Safety**
  - Verified identity badge, safety checklist, emergency contact setup.

## 8. Additional States
- **Empty States**
  - Illustrations and CTA for Explore ("Search services in your area"), Bookings ("No upcoming jobs"), Marketplace ("Browse equipment"), Messages ("No conversations yet"), Profile ("Complete your profile").
- **Error States**
  - Inline form errors with helper text, global error banner for API failures.
- **Offline Mode**
  - Banner indicating limited functionality; cached bookings viewable, actions queued.

These wireframe updates establish a comprehensive user journey from discovery to post-job support within the mobile app.
