# Phone Screens Catalogue — Version 1.00

All layouts described below reference a base viewport of **360 × 780 dp** (Android reference) and scale proportionally via Flutter's `MediaQuery` width ratios. Spacing follows the 8px grid with modifiers (`xxs=4`, `xs=8`, `sm=12`, `md=16`, `lg=24`, `xl=32`, `xxl=40`). Each wireframe lists the component stack, intrinsic heights, and responsive behaviour.

## 1. Authentication & Onboarding Cluster

### 1.1 Splash Screen
- **Layout**: Full-bleed background gradient `linear-gradient(160°, #0066F5 → #00AEEF)` with semi-transparent geo-zonal map overlay at 20% opacity.
- **Safe Area**: Top/bottom padding 32dp.
- **Brand Lockup**: Centered at `y=240dp`, width 200dp, height 56dp, `Manrope 700 28dp` text.
- **Loading Indicator**: Circular progress indicator (48dp) with custom stroke gradient `#FFFFFF → rgba(255,255,255,0.2)`.
- **Motion**: Subtle zoom-in (scale 1.0 → 1.05) over 3s using `Curves.easeInOut`.

### 1.2 Login Screen
| Region | Frame | Components | Notes |
| --- | --- | --- | --- |
| Header | 360×120dp | App logo (120×36), welcome text `"Sign in to manage services"` in `Inter 16/24` | Background neutral `#F7F9FC` |
| Form Card | 360×400dp | Elevated card radius 20dp, elevation 12, drop shadow `rgba(12, 34, 66, 0.18)` offset (0,12) blur 32. Contains two text fields (email, password) each 56dp height, spacing 16dp; remember me toggle; "Forgot password" text button. | Uses `Forms.md` field styles. |
| CTA Area | 360×96dp | Primary button 320×56dp, `--color-primary-500`; secondary ghost button 320×48dp, border `1dp rgba(20,69,224,0.24)` | Buttons spec in `Screen_buttons.md`. |
| Footer | 360×64dp | Social login chips (Apple, Google) 48dp height, icon 24dp, text `Inter 15/22`, gap 12dp. | |

### 1.3 Onboarding Carousel
- Horizontal `PageView` with 3 slides. Each slide has hero illustration 240×240dp Lottie asset, heading `Manrope 24/32`, body `Inter 15/22`, CTA button 320×52dp.
- Pagination dots: 8dp diameter, active colour `#0066F5`, inactive `rgba(0,102,245,0.24)`.
- Bottom safe area padding 40dp to accommodate gesture indicators.

## 2. Explore & Discovery Cluster

### 2.1 Explore Home (Map Priority)
- **Header (Top App Bar)**: Height 88dp (includes status bar). Contains location pill (left) 220×40dp with map-pin icon 20dp, search button 40×40dp (circular), notification icon with badge.
- **Zone Insight Ribbon**: 360×72dp card with gradient background `linear-gradient(135°, #1C62F0 → #4C8DF8)` and overlay grid lines 10% opacity. Contains KPIs arranged in 3 columns each width 96dp.
- **Map Canvas**: 360×340dp using Mapbox view; polygon outlines 2dp, fill opacity 0.32 as defined in `Colours.md`. Overlays include: filter chip row (scrollable, height 40dp), zone legend anchor bottom-left 140×88dp.
- **Provider List Peek**: Bottom sheet (peek height 120dp, full height 520dp). Uses `DraggableScrollableSheet` with handles 32×4dp radius 2dp. Cards defined in `Cards.md`.

### 2.2 Provider List View (Split)
- Layout toggled by icon button in Explore header.
- Upper half map (height 280dp) with `ClipRRect` radius 24dp top corners.
- Lower list uses `SliverList` with 16dp padding. Each provider card: width 328dp, height 168dp, includes hero image 96×96dp, text block, badges (chips 28dp height), rating row (star icon 20dp). CTA buttons (Primary 128×44dp, Outline 128×44dp) anchored bottom of card.

### 2.3 Provider Detail Overlay
- Modal bottom sheet with rounded top corners radius 32dp.
- Hero carousel 360×240dp, page indicator 6×6dp dots.
- Content segments: summary chips row, packages accordion, service guarantees card, review list (each tile 360×96dp), sticky CTA bar with 2 buttons (Book Now, Chat) 160×52dp.

## 3. Booking Flow Cluster

### 3.1 Booking Wizard Steps
| Step | Height | Key Components | Interaction |
| --- | --- | --- | --- |
| Stepper Header | 360×72dp | Progress indicator with 4 steps, active step accent `#0066F5`, inactive `#D0DEF9`. | Animates with `AnimatedContainer` 280ms. |
| Service Details | 360×520dp | Form sections: service package cards (cards 328×120dp), add-on toggles (switch 52×32dp), schedule picker (calendar tile 44×48dp). | Calendar uses `TableCalendar` with custom cell style described in `Forms.md`. |
| Confirmation | 360×400dp | Summary card (radius 20dp), payment method selector (cards 328×64dp), compliance acknowledgement checkbox (touch target 48×48dp). | |

### 3.2 Payment Success Screen
- Confetti Lottie 220×220dp (asset `assets/lottie/booking/success.json`).
- Success headline `Manrope 24/32`, supporting text `Inter 15/22` center aligned.
- Primary button 320×56dp "View Booking"; tertiary ghost button `"Back to Explore"`.

## 4. Marketplace & Promotions Cluster

### 4.1 Marketplace Home
- Tabs `Services`, `Rentals`, `Subscriptions` using segmented control 328×44dp, border radius 24dp.
- Banner carousel height 180dp, uses image ratio 16:9, overlay gradient `rgba(12,18,32,0.64)`. CTA pill 140×40dp.
- Product cards (grid 2 columns). Each card width 160dp, height 216dp, includes image 160×120dp, title, price, rating chips.

### 4.2 Campaign Detail
- Header: hero image 360×200dp with overlay text.
- Body: statistics row (3 metrics), description paragraph, "Included Providers" horizontal list (avatar 64dp). CTA button sticky bottom.

### 4.3 Provider Inventory Console
- **Header Strip**: 360×120dp gradient bar `linear-gradient(138°, #1445E0 → #36A2FF)` with stock health summary ("72 tools available"), low-stock badge (pill 28×16dp `#F97316` background, text `Inter 12/16` white) and overflow menu for exporting CSV.
- **Ledger Tabs**: Segmented control 328×44dp with `Inventory`, `Reservations`, `Adjustments` states. Active tab uses 2dp underline `#1445E0` spanning 88dp; inactive tabs 40% opacity label.
- **Inventory Table Cards**: Scrollable list of cards 328×188dp, each containing:
  - Item banner 328×64dp with thumbnail 56×56dp, title `Manrope 16/24`, SKU `IBM Plex Mono 13/18`.
  - Stock meter horizontal progress 280×8dp using gradient `#1BBF92 → #36A2FF` with threshold markers at 20% and 5% (colours `#F97316`, `#DC2626`).
  - Metrics row (3 columns) for `On-hand`, `Reserved`, `In repair`; values `Manrope 18/24` bold, captions `Inter 12/16` muted.
  - Action bar sticky bottom inside card (height 44dp) with `Log Adjustment` ghost button 144×36dp and `View Ledger` tertiary button 160×36dp.
- **Empty State**: When ledger empty, display illustration 220×180dp, message "No inventory yet" and CTA 200×48dp linking to add item flow.

### 4.4 Rental Agreement Detail
- **Timeline Header**: Horizontal stepper height 88dp with five nodes (`Request`, `Inspection`, `Pickup`, `In Use`, `Return`). Completed nodes filled `#1BBF92`, current node accent `#1445E0`, future nodes outline `rgba(20,69,224,0.24)`.
- **Summary Card**: 328×220dp card showing renter info, asset photo 88×88dp, rental dates chip (icon calendar 20dp). Settlement amount displayed using `Manrope 20/28` with currency prefix `IBM Plex Mono` style.
- **Checkpoint List**: Accordion with sections (Pre-pickup photos, Inspection notes, Return checklist). Each row height 72dp includes status pill, `View evidence` button 120×36dp, timestamp `Inter 12/16` grey.
- **Dispute CTA Bar**: Sticky bottom sheet 360×96dp with primary button `Open dispute` 200×52dp (destructive variant) and ghost button `Message renter` 140×44dp. Displays SLA countdown (capsule 96×28dp `#F97316`).

### 4.5 Marketplace Alert Drawer
- Swipe up drawer anchored to home screen; peek height 96dp, full height 480dp.
- Alert rows 328×92dp using severity stripe 6dp along left edge (success `#1BBF92`, warning `#F97316`, critical `#DC2626`).
- Each row includes message `Inter 14/20`, timestamp, CTA chip ("Review policy" 120×32dp). Fraud alerts show `Investigation ETA` badge `IBM Plex Mono 12/16`.
- Drawer supports batch actions (Select all → `Mark as read`, `Escalate`). Batch toolbar appears when ≥1 selected; height 56dp, background `rgba(20,69,224,0.08)`.

### 4.6 Performance Drill Monitor (2025-11-03)
- **Status Cards:** Three cards 328×148dp stacked vertically showing Booking latency, Chat success, Campaign ingestion. Each card includes metric (Manrope 28/36), status badge (Healthy/Warning/Breach) using palette `#0F766E`, `#B45309`, `#B91C1C`, and last run timestamp caption `Inter 12/16`.
- **Action Buttons:** Row of buttons `View summary` (primary 320×52dp) and `Schedule drill` (outline) separated by 12dp gap; schedule button opens modal capturing desired profile + rehearsal date/time.
- **Drill Timeline Sheet:** Secondary sheet reveals past runs list (tiles 64dp high) with profile chip, actor initials avatar, status pill, download icon. Tapping tile opens details screen with JSON snippet, CTA `Download report` (telemetry `performance.load_drill.summary_download`).
- **Empty/Breach States:** Empty state uses illustration 200×160dp + CTA `Schedule rehearsal`; breach state surfaces amber banner with copy "Threshold exceeded—review summary" and CTA `Notify SRE` linking to contact sheet.
- **Accessibility & Telemetry:** SnackBar announces breaches for screen readers; ensure semantics labels for status badges. Emit telemetry `performance.load_drill.run` when refreshing, `performance.load_drill.schedule_request` when scheduling, and `performance.load_drill.summary_download` on report export.

## 5. Messaging & Support Cluster

### 5.1 Conversation List
- Search bar 328×48dp, filter chip row.
- Conversation cards height 88dp, include avatar 56dp, name `Manrope 16/24`, last message `Inter 14/20`, status badges.
- Swipe actions: left to archive, right to pin; reveal area width 72dp.

### 5.2 Chat Screen
- App bar 88dp with provider avatar, status indicator 12dp.
- Message bubble widths: max 78% width. User bubble colour `#0066F5`, text `#FFFFFF`; provider bubble `#F1F5FF`, text `#1F2937`.
- Input bar height 72dp: text field 248×48dp, attachment button 48×48dp, send button 48×48dp gradient `#1C62F0 → #4C8DF8`.

## 6. Profile, Settings & Account Cluster

### 6.1 Profile Overview
- **Header**: 360×200dp hero with blurred polygon background overlay 20% opacity. Avatar 96dp circular, tier badge 32dp top-right.
- **Stats Row**: Three metric chips (Bookings, Loyalty Tier, Compliance) each 104×88dp, spacing 12dp. Uses `FixnadoMetricCard` tokens.
- **Action List**: Tiles 72dp height with icon container 40×40dp, trailing chevron. Sections separated by 24dp with uppercase labels.
- **Motion**: Avatar subtle parallax (-12dp offset) on scroll using `SliverAppBar` flexible space.

### 6.2 Profile Detail & Edit
- Form contained within 360×560dp scroll area. Fields follow `Forms.md` spec with 16dp spacing.
- Section "Business Details" uses card 328×200dp with double-column layout when width >400dp.
- Save CTA pinned bottom (320×56dp). Cancel ghost button stacked below (full width) with 12dp gap.
- Validation icons 16dp appear inside field trailing area when error.

### 6.3 Payment Methods
- Card list in 328dp width column. Each card tile 88dp height, uses brand logo 48×32dp left, masked card number `Inter 16/24`.
- Add new card button ghost style 320×48dp with dashed border `#9CA3AF` 1dp, corner radius 16dp.
- Default indicator is pill 28×16dp `#1BBF92` text white.

### 6.4 Settings Screen
- Detailed spec in `Settings_Screen.md`. Layout uses `CustomScrollView` with pinned section headers height 40dp.
- Danger zone card 328×140dp with red border 2dp, background `rgba(231,76,60,0.08)`, contains warning icon 32dp.

## 7. Provider & Compliance Cluster

### 7.1 Provider Dashboard
- **Hero Summary**: 360×220dp card with gradient `linear-gradient(142°, #1C62F0 → #3B8DFF)` overlay grid 10% opacity. Contains KPI stack: active jobs, earnings (IBM Plex Mono 24/28), compliance score gauge (88dp donut).
- **Quick Actions**: Horizontal scroll of pill buttons 120×44dp (Start Job, Log Availability, Launch Campaign) with icons 20dp.
- **Job Kanban Preview**: Horizontal cards 280×160dp, each representing column with top badge and job chips.
- **Insights Row**: Two cards 160×160dp summarising bidding health & response time.

### 7.2 Compliance Center
- List of requirement cards 328×144dp. Each includes icon 32dp, title, due date, status pill (success/warning/danger), progress bar 320×6dp at bottom.
- Top filter segmented control 3 states (All, Pending, Submitted). Sticky at top after 48dp scroll.
- Upload action button ghost style per card; tapping opens modal described in 7.3.

### 7.2.1 Insured Seller Badge Manager
- Module resides above compliance list when provider enrolled. Card 328×120dp with badge illustration 72×72dp, coverage copy, and renewal countdown chip (96×28dp `#F97316`).
- Includes toggle `Show badge on storefront` (switch 56×32dp). Toggling open triggers inline confirmation toast and API call to `/marketplace/badge-visibility`.
- `Policy Docs` button 148×36dp opens document viewer modal pre-filtered to insurance uploads.
- SLA reminder banner appears at 14 days before expiry: background `rgba(249,115,22,0.12)`, icon 24dp, CTA `Request renewal review` 160×40dp (primary style).

### 7.3 Document Upload Modal
- Modal bottom sheet full height minus 48dp top margin, radius 32dp.
- Drop zone 328×200dp dashed border `#1C62F0` 2dp, background `rgba(28,98,240,0.05)` with icon 48dp.
- Steps list enumerated 1–3 with `Manrope 16/24` headings, checkboxes for completion.
- Footer CTA primary 320×56dp "Submit for review"; secondary text button "Save draft".

### 7.4 Availability Calendar
- Month view grid 7×6 cells each 44×48dp, radius 12dp. Active days tinted `rgba(28,98,240,0.12)`.
- Header contains month label `Manrope 20/28`, arrow buttons icon 24dp.
- Bottom sheet detail for selected day 360×200dp listing slots as pill chips 88×36dp (toggleable).

### 7.5 Rental Preparation Checklist
- Inline card inserted between Availability Calendar and Document Upload when provider has active rentals. Card height 200dp with step list (`Prepare asset`, `Capture pre-pickup photos`, `Review renter deposit`).
- Each step row 72dp with checkbox, due-by timestamp, and action links (`Open inspection form`, `View renter profile`). Completed steps show icon `CheckCircle` tinted `#1BBF92`.
- `Start pickup workflow` primary button 320×52dp disabled until mandatory steps complete; tooltip clarifies missing items.

## 8. System Overlays & Special States

### 8.1 Offline Mode Banner
- Height 48dp across top of app, background `#B91C1C`, text `Inter 14/20` white. Includes retry button ghost style 96×36dp.
- Icon 20dp left with warning glyph.
- Banner slides in from top 200ms, remains sticky until connection restored.

### 8.2 Error Dialog
- Modal 320×260dp radius 28dp. Icon 56dp top center, gradient background circle `#E74C3C → #F59E0B`.
- Title `Manrope 20/28` centre, body `Inter 15/22` left aligned.
- Buttons arranged horizontally: Primary 144×52dp "Retry", Ghost 144×52dp "Contact support".

### 8.3 Success Toast
- Floating at bottom above nav, width 320dp, height 60dp, radius 16dp. Background `rgba(27,191,146,0.95)`, icon 24dp left, text `Inter 14/20` white.
- Appears with fade + slide 24dp upward, auto-dismiss 2.5s.

### 8.4 Tutorial Coach Marks
- Sequence of overlays highlighting map filters, booking CTA, compliance tasks. Mask uses blur `BackdropFilter` radius 16.
- Tooltip cards 240×120dp, arrow 16×24dp pointing to target. Buttons "Next" (primary) and "Skip" (ghost) inline.

## 9. Responsiveness & Breakpoints

- **Compact (<360dp)**: Reduce margins to 12dp, convert horizontal metric cards to vertical stack. Map height reduces to 300dp.
- **Medium (361–414dp)**: Default specs. Buttons remain 320dp but use `LayoutBuilder` to max width.
- **Large (>480dp)**: Introduce dual-pane layout for Explore (map left 60%, list right 40%), Profile (list left, detail right). Increase card padding to 24dp.
- **Orientation Change**: When landscape, bottom nav converts to rail 72dp width with labels hidden; FAB shifts to right side offset 16dp.
- Typing indicator uses 3-dot animation, dot size 8dp, spacing 4dp.

### 5.3 Support Centre
- Accordion list of FAQs using expansion panels height 64dp collapsed, 160dp expanded.
- Contact options card with icons (phone, email, chat) sized 36dp, button 320×52dp "Schedule Call".

## 6. Profile & Settings Cluster

### 6.1 Profile Overview
- Header with gradient background height 200dp, overlay of polygon map 15% opacity.
- Avatar 88dp centered, ring indicator 4dp width representing subscription tier (colour tokens in `Screen_update_Screen_colours.md`).
- Stats row (Bookings, Reviews, Response Time) each 100×72dp.
- Section cards: Personal Info, Payment Methods, Preferences, Documents (each card 328×88dp, icon 32dp, chevron 24dp).

### 6.2 Settings Detail
- List view with sections labelled using `Manrope 14/20` uppercase letter-spacing 0.1em.
- Toggles 52×32dp; slider for notification intensity width 280dp.
- Danger zone card background `#FEF2F2`, border `#FCA5A5`, button `Destructive` variant.

### 6.3 Document Vault
- Grid of document tiles 160×200dp, preview icon 48dp, status badges (Approved, Pending). Upload button sticky bottom, ghost style.

## 7. Provider-Facing Extensions (Phone)

### 7.1 Provider Dashboard Snapshot
- KPI cards (Active Jobs, Earnings, Compliance) each 160×140dp with drop shadow `rgba(16,42,90,0.14)` blur 20dp.
- Quick actions row (icons 48dp) with label `Inter 13/18`.
- Alerts timeline list items height 96dp with severity indicator strip 6dp width using tokens from `Screen_update_Screen_colours.md`.

### 7.2 Bidding Composer
- Stepper header as in booking, but with timeline chips.
- Bid amount input (numeric keyboard) 88dp height, includes `IBM Plex Mono` text style.
- Attachment upload row with 3 placeholder tiles 88×88dp.

## 8. Compliance Centre
- Checklist view with progress donut 120dp, textual summary.
- Requirement cards: status pill, description, due date. Expand reveals document upload component (drag area 320×140dp, dashed border `rgba(20,69,224,0.32)`).

## 9. Notifications Centre
- Filter tabs (All, Jobs, Compliance, Marketplace) using pill chips 96×36dp.
- Notification card height 88dp, includes icon circle 40dp with background gradient `#EEF3FF`.
- Swipe to manage (mute, mark read) using `Dismissible` with background colours `#D1FAE5` and `#FEE2E2`.

## 10. Offline & Error States
- Offline banner 360×44dp `#FF6B3D` background, icon 20dp, text `Inter 14/20` white.
- Empty state cards height 280dp with illustration 200×200dp, message, CTA 200×48dp.

## Responsiveness & Orientation
- **Compact width (<360dp)**: reduce card horizontal padding to 12dp, convert two-column grids to carousel.
- **Expanded width (>600dp)**: adopt split view; map and content side-by-side using `Flex` ratio 1:1.
- Orientation change triggers `AnimatedSwitcher` to reposition map top to left.

## Accessibility Notes
- Minimum text size 13dp (captions), ensure dynamic type scaling up to 120% retains layout integrity.
- VoiceOver labels included for every icon button; map interactions provide haptic feedback and textual tooltips.
- Colour contrast validated >4.5:1 for text, >3:1 for non-text as referenced in `Screen_update_Screen_colours.md`.
