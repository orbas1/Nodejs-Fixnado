# User App Wireframe Changes (Flutter)

## 1. Navigation Framework
- **Bottom Navigation Tabs**: Explore, Bookings, Marketplace, Messages, Profile.
- **Global Search**: Persistent search bar at top of Explore tab with voice input and filter shortcut.
- **Floating Quick Action**: Contextual FAB toggles between "Book Now" (Explore) and "Request Support" (Bookings & Messages).
- **Notification Drawer**: Bell icon in top-right opens feed summarising booking milestones, rental reminders, and promotional offers with deep links.

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

## 3a. Authentication & Onboarding Screens
- **Welcome Carousel**
  - Three-panel introduction to Fixnado benefits with CTA buttons for Login, Sign Up, and Explore as Guest.
- **Registration Flow**
  - Step 1: Email/phone capture with OTP verification and password creation.
  - Step 2: Profile setup (name, address, accessibility preferences) with progress indicator.
  - Step 3: Service interest selection for personalised Explore feed.
- **Login & Recovery**
  - Social sign-in buttons, email/password form with inline validation, forgot password flow delivering OTP for reset.

## 4. Booking Management Wireframes
- **Bookings Tab**
  - Segmented controls for Upcoming, In Progress, Completed, Cancelled.
  - Cards show status pill, provider avatar, zone, next milestone (e.g., Provider en route), and quick actions (Chat, Reschedule, Cancel).
- **Booking Detail**
  - Timeline of events (Request sent, Bid accepted, Provider en route, Job completed).
  - Tabs: Overview, Checklist, Payments, Documents.
  - Dispute CTA anchored in footer for eligible statuses.
  - Feedback module appears post-completion capturing ratings, review text, and tip amount.

## 5. Marketplace Tab Wireframes
- **Catalogue Grid**
  - Toggle between Rentals and Purchases; each product card includes price, availability indicator, seller badge.
  - Filter chips (Category, Location, Availability dates, Insurance coverage).
- **Product Detail**
  - Media gallery, specs table, insurance information, reviews, bundle recommendations.
  - CTA to "Add to Booking" or "Rent Separately"; scheduling widget for rental duration.
- **Cart & Checkout**
  - Slide-in cart summarising items, deposit requirements, delivery options, cross-sell suggestions.
  - Payment screen includes saved methods, promo codes, wallet balance application, and T&C checkboxes.

## 6. Messages Tab Wireframes
- **Conversation List**
  - Organised by booking; includes status indicator and unread message count.
- **Chat Detail**
  - Header shows provider name, job status, call buttons.
  - Message composer with quick prompts (Share Location, Confirm Access Instructions, Request Update).
  - Attachments tray for documents/photos.
  - AI Assist preview replies with ability to edit before sending.
- **Shared Media View**
  - Sub-tab showing exchanged photos, documents, and location pins grouped by type for quick retrieval.

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
- **Loyalty & Rewards**
  - Tier progress bar, benefits list, voucher redemption input, referral link sharing module.

## 8. Additional States
- **Empty States**
  - Illustrations and CTA for Explore ("Search services in your area"), Bookings ("No upcoming jobs"), Marketplace ("Browse equipment"), Messages ("No conversations yet"), Profile ("Complete your profile").
- **Error States**
  - Inline form errors with helper text, global error banner for API failures.
- **Offline Mode**
  - Banner indicating limited functionality; cached bookings viewable, actions queued.
- **Maintenance Mode**
  - Full-screen modal shown during major outages with service status, estimated resolution, and contact options.

These wireframe updates establish a comprehensive user journey from discovery to post-job support within the mobile app.

## Screen Inventory & Interaction Spec
| Tab | Screen | Primary Goals | Core Components | Special States |
| --- | --- | --- | --- | --- |
| Explore | Map View | Discover providers by zone | Map canvas, provider list, filter drawer | Offline fallback map snapshot, permission request overlay |
| Explore | Service Detail | Evaluate provider offering | Media gallery, package list, review tabs | Compliance badge callouts, limited-time promo banner |
| Bookings | List | Monitor job pipeline | Status segments, booking cards, quick actions | Empty state guidance, overdue payment chip |
| Bookings | Detail | Manage active booking | Timeline, checklist, payment summary | Dispute mode overlay, provider delay alert |
| Marketplace | Catalogue | Browse rentals/purchases | Toggle tabs, product cards, filter chips | Out-of-stock ribbon, insurance upsell drawer |
| Marketplace | Product Detail | Configure rental | Specs table, price calculator, delivery selector | Damage waiver modal, deposit warning |
| Messages | Conversation List | Access communications | Category filter, conversation cards | Merge booking prompt when duplicates detected |
| Messages | Chat Detail | Converse with provider/support | Message list, quick replies, attachments tray | AI assist suggestions, escalation banner |
| Profile | Overview | Manage account | Avatar, loyalty widget, wallet, quick links | Identity verification prompt, incomplete profile meter |
| Profile | Preferences | Configure settings | Toggle list, language picker, accessibility controls | High-contrast preview, push permission reminder |

### Form & Validation Guidance
- Booking wizard forms specify maximum character counts, placeholder copy, and example responses to reduce user friction.
- Payment step outlines card masking behaviour and wallet utilisation order to maintain transparency.
- Support forms include conditional fields (e.g., attach photo) based on issue type selection.

### Content & Messaging Notes
- Copy uses inclusive, plain language; service descriptions highlight credentials and guarantees.
- Notification feed ensures each entry includes timestamp, action button, and summarised impact.
- Error states instruct users on next best action (retry, contact support, change provider) rather than generic failure messages.

### Developer Delivery Checklist
1. Implement scroll retention for Explore map/list when user returns from provider detail.
2. Ensure booking detail timeline supports infinite scroll for long-running jobs (e.g., maintenance contracts).
3. Provide analytics instrumentation for FAB usage across tabs to evaluate effectiveness of quick actions.
4. Annotate wireframes with component library references to align with Flutter theming and avoid duplication.
