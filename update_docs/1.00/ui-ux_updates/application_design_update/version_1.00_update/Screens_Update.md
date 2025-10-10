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

## 5. Messaging & Support Cluster

### 5.1 Conversation List
- Search bar 328×48dp, filter chip row.
- Conversation cards height 88dp, include avatar 56dp, name `Manrope 16/24`, last message `Inter 14/20`, status badges.
- Swipe actions: left to archive, right to pin; reveal area width 72dp.

### 5.2 Chat Screen
- App bar 88dp with provider avatar, status indicator 12dp.
- Message bubble widths: max 78% width. User bubble colour `#0066F5`, text `#FFFFFF`; provider bubble `#F1F5FF`, text `#1F2937`.
- Input bar height 72dp: text field 248×48dp, attachment button 48×48dp, send button 48×48dp gradient `#1C62F0 → #4C8DF8`.
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
