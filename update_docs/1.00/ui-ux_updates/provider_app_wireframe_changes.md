# Provider App Wireframe Changes (Flutter)

## 1. Global Navigation & Structure
- **Navigation Pattern**
  - Bottom navigation bar with five primary tabs: Dashboard, Jobs, Marketplace, Messages, Settings.
  - Floating action button (FAB) anchored to bottom-right for quick "Start Job" / "Log Availability" actions.
  - Persistent top app bar with contextual actions (filters, add, export) depending on tab.
- **Drawer & Secondary Navigation**
  - Swipe-in drawer offers shortcuts to Compliance Centre, Earnings, Ad Campaigns, Support, and Language/Currency toggles.
  - Drawer header displays provider avatar, business rating, and subscription tier badge.
- **Notification Surface**
  - Global notification bell in top bar opens slide-in feed with actionable alerts (new bids, expiring documents, payment holds).
  - Badge counter mirrors unread messages from Messages tab to maintain parity across entry points.

## 2. Dashboard Tab Wireframes
- **Dashboard Overview Screen**
  - Hero summary card showing Active Jobs count, Current Earnings, Compliance Status (traffic light), and Zone Coverage map thumbnail.
  - Quick actions row (Add Availability, Upload Documents, Launch Campaign, View Alerts).
  - KPI widgets: Bookings This Week (sparkline), Average Response Time, Bid Win Rate, Customer Satisfaction.
  - Alerts timeline for expiring documents, disputes, unpaid invoices.
- **Zone Heatmap Modal**
  - Full-screen map overlay with polygon toggles, heatmap intensity legend, and call-to-action to expand coverage.
- **Earnings Drilldown**
  - Tabbed modal splitting Service Revenue vs. Marketplace Rentals, each with filters by zone, service, or time range.

## 2a. Onboarding & Authentication Screens
- **Welcome & Role Selection**
  - Carousel describing platform value props, CTA buttons for "Sign In" and "Create Provider Account".
  - Support link surfaces privacy policy and terms for compliance.
- **Registration Wizard**
  - Step 1: Business info form with masked inputs for phone/tax ID, inline validation, and progress tracker.
  - Step 2: Service configuration cards (select services offered, zones of interest) with contextual tooltips.
  - Step 3: Compliance checklist preview guiding required documents before upload stage.
- **Login & MFA**
  - Email/password form with "Use SSO" option, password visibility toggle, forgot password link.
  - MFA challenge screen accepts OTP, includes resend timer and fallback to recovery codes.

## 3. Jobs Tab Wireframes
- **Kanban View**
  - Horizontal swimlanes: New Requests, Bidding, Scheduled, On Site, Completed, Disputed.
  - Cards show booking ID, service type, zone, SLA timer, bid status, and badges (AI Estimate, Priority, Upsell).
  - Drag-and-drop enabled between columns (with confirmation dialogues where automation restricted).
  - Top toolbar filters by zone, service, status, and timeframe.
- **Calendar View**
  - Toggle button switches to calendar grid with day/week/month views.
  - Events include color-coded service types, icons for video consultations, and overlay for travel time buffers.
- **Job Detail Screen**
  - Header with booking status pill, countdown timer, client name, zone.
  - Tabs: Overview (scope, attachments, custom questions), Team (assigned providers, add collaborators), Logistics (travel route, equipment checklist), Communication (chat history, call log).
  - Action footer: Accept/Decline, Submit Bid, Check-in On Site, Complete Job, Raise Dispute.
- **Bid Composer**
  - Stepper with Pricing (base, add-ons, discounts), Availability slots, Notes, Terms acknowledgement.
  - Preview card summarising quote before submission.

## 4. Marketplace Tab Wireframes
- **Inventory Ledger**
  - Table list of owned equipment with status (Available, In Use, Under Maintenance), rental price, location.
  - Inline actions to mark maintenance, adjust price, or assign to booking.
- **Listing Manager**
  - Card grid of active listings showing thumbnail, badge (Insured, Featured), and KPIs (views, bookings, rating).
  - FAB for "Create Listing" launching multi-step form (Details, Media, Pricing, Policies).
- **Rental Logistics**
  - Timeline view of upcoming rentals with pickup/drop-off status, integrated courier tracking widget.
  - CTA to "Offer Upsell" linking to packages.

## 5. Messages Tab Wireframes
- **Conversation List**
  - Segmented control to switch between Bookings, Marketplace, Compliance, Support.
  - Each conversation card displays last message snippet, unread badge, and channel icon (chat, voice, video).
- **Chat Detail**
  - Header includes job reference, zone, AI assist toggle, voice/video buttons.
  - Message composer with quick replies (Confirm Arrival, Share ETA, Request Documents) and file attachment tray.
  - Side panel (slide-up on mobile) for Job summary, Notes, and Checklist.
- **Video Call Overlay**
  - Picture-in-picture layout with controls for mute, switch camera, screen share (if compatible), take photo, mark issue resolved.

## 5a. Compliance & Document Centre Screens
- **Document Inventory**
  - Tabbed layout for Identity, Insurance, Certifications, Contracts with status pills and expiry countdown.
  - Upload CTA launches bottom sheet explaining accepted formats and size limits.
- **Verification Detail**
  - Timeline showing submission, review, approval, rejection events; includes reviewer notes and escalation CTA.
- **Policy Acknowledgements**
  - Checklist of safety policies with digital signature capture and time-stamp confirmation summary.

## 6. Settings & Support Tab Wireframes
- **Settings Home**
  - Sections: Profile & Business Info, Payments & Tax, Notifications, Language & Region, Integrations (calendar sync, CRM).
  - Each item opens dedicated detail screen with forms using consistent input patterns (floating label, inline validation, helper text).
- **Compliance Centre**
  - Document list with status chips (Pending, Approved, Expiring), upload CTA, timeline of verification steps.
  - Guidance panel with accepted document formats, SLA timers, and contact support link.
- **Support Hub**
  - FAQ accordion, live chat launcher, schedule support call form, and incident history table.
- **Status Page**
  - Embedded service status banner summarising platform uptime, scheduled maintenance, and incident history links.

## 7. Responsive & Device Considerations
- Designed primarily for phones (iOS/Android) with adaptive layout for tablets (two-column splits for Dashboard and Jobs).
- Landscape mode: bottom navigation transforms into side rail to increase vertical real estate.
- Incorporates offline states with greyed-out action buttons and sync status banner.

## 8. Micro-interactions & Motion
- Column transitions in Kanban animate with 200ms ease-in-out to indicate status change.
- FAB expands into radial menu when long-pressed (Quick Log Time, Upload Proof, Contact Client).
- Pull-to-refresh surfaces subtle ripple indicating data sync with backend.

## 9. Accessibility Notes
- Dynamic type enabled; layouts flex to accommodate font scale up to 130%.
- VoiceOver/ TalkBack labels defined for all controls, including status chips and map overlays.
- High contrast theme variant available via Settings.

These wireframe updates provide the structural basis for the styling and logic flows documented in the companion files.

## Detailed Screen Inventory & Specifications
| Module | Screen | Primary Purpose | Key UI Elements | Notes |
| --- | --- | --- | --- | --- |
| Dashboard | Overview | Surface KPIs and quick actions | Hero metric card, quick action row, alerts feed | Supports contextual education tooltips during first-run. |
| Dashboard | Zone Heatmap | Expand geo coverage insights | Map overlay, legend, CTA to manage zones | Includes offline fallback image with static insights. |
| Jobs | Kanban | Track job lifecycle | Columns, draggable cards, status filters | Cards include microcopy placeholders for SLA warnings. |
| Jobs | Calendar | Visualise schedule | Month/week/day views, job badges | Dragging job prompts reschedule confirmation dialogue. |
| Jobs | Detail | Manage single job | Tabs (Overview, Team, Logistics, Communication) | Footer CTA adjusts per status (e.g., Submit Proof). |
| Jobs | Bid Composer | Submit quotes | Stepper, pricing fields, preview card | Inline validation for price minimum/maximum thresholds. |
| Marketplace | Inventory Ledger | Manage equipment | Data table, inline actions, status chips | Supports bulk select for maintenance updates. |
| Marketplace | Listing Wizard | Publish listing | Multi-step form, media uploader, policy checklist | Integrates progress save/resume microcopy. |
| Messages | Conversation List | Access chats | Segmented control, conversation cards | Empty state emphasises enabling notifications. |
| Messages | Chat Detail | Communicate | Message stream, quick replies, attachments | Includes compliance disclaimer banner for recording. |
| Compliance | Document Inventory | Track submissions | Tabbed lists, upload CTAs, expiry countdown | Each row includes CTA to view requirements. |
| Settings | Support Hub | Access help | FAQ accordion, chat launcher, incident history | Contains status indicator showing platform health. |

### Form & Interaction Guidance
- All forms specify helper text slots for clarifying required documents, price formats, and equipment dimensions.
- Buttons follow action hierarchy: primary for completion, secondary for navigation/back, tertiary for optional helper flows (e.g., "Preview Listing").
- Toast notifications triggered for autosave, sync completion, and offline queue events; design ensures they do not obstruct FAB.

### Copy & Localization Notes
- Microcopy placeholders provided for compliance warnings, marketplace upsells, and dispute escalation prompts to maintain tone alignment.
- Drawer menu supports right-to-left languages by mirroring icon alignment and slide direction.
- Date/time formats adopt locale-specific patterns with fallback to ISO format in export dialogs.

### Developer Handoff Checklist
1. Confirm SafeArea usage on iOS/Android for all tabs, especially map overlays and bottom sheets.
2. Implement skeleton loaders for kanban cards, inventory tables, and chat threads to improve perceived performance.
3. Ensure high-frequency screens (Jobs, Dashboard) have analytics instrumentation for load time and primary CTA engagement.
4. Annotate wireframes with component references (`ProviderCard`, `ComplianceChip`) to map to Flutter widget library.
