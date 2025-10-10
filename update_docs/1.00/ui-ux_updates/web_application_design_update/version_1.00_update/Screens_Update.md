# Web Page Catalogue — Version 1.00

Specifications reference desktop (1440×900), tablet (1024×768), and mobile (375×812) breakpoints. Layout uses responsive 12-column grid (column width 80px, gutter 24px, margin 96px on desktop; 72px columns / 20px gutter / 64px margin tablet; 4-column grid with 16px gutter mobile).

## Public Experience

### 1. Landing / Explorer Entry
- **Hero Section**: Full-bleed map background with overlay gradient `rgba(12,18,32,0.72)` bottom. Centered search bar width 640px, height 64px, radius 32px, icon left 28px, CTA button right 56px. Subtext `Inter 18/28`, CTA "Find providers" (primary button 200×56px).
- **Quick Filters**: Row of 6 pill buttons (width 144px) with icons, spacing 16px.
- **How It Works**: 3-card layout (cards 360×280px) with icon 64px, heading `Manrope 22/30`, body 16/24. On tablet, cards stack 2+1; on mobile, vertical stack.

### 2. Geo-Zonal Explorer
- **Layout**: Map left 60% width, results right 40% (min width 420px). Map height fills viewport minus header (calc(100vh - 72px)).
- **Map Controls**: Filter button (48px), zone legend panel (width 240px) collapsible. Heatmap legend anchored bottom-left with gradient scale.
- **Result List**: Scrollable area with sticky filter bar (height 64px). Cards 100% width, height 180px, image 120×120px, metrics row with icons. CTA buttons (Book, View profile) 140×44px.
- **Responsive**: Tablet collapses to stacked layout (map top 50vh, list bottom). Mobile uses map toggle button; default to list view with map as overlay.

### 3. Provider Profile Page
- **Header**: Hero image 1440×420px with gradient overlay. Provider avatar 120px circle overlapping hero. Title `Manrope 32/40`, rating badge, zone badges.
- **Content Tabs**: `Services`, `Packages`, `Reviews`, `Compliance`. Tabs 64px height, underline active indicator 4px.
- **Sidebar**: Right column width 320px containing contact card, availability calendar preview, CTA button 100% width 56px.

## Authenticated Consumer Portal

### 4. Dashboard
- **Navigation**: Left sidebar width 264px, icons 24px, text `Inter 16/24`. Collapsible to 88px icon rail at <1280px.
- **Top Bar**: Height 72px, includes breadcrumb, search, notifications.
- **Content Grid**: 12-column layout with KPI cards (span 3 columns), charts (span 6 columns). Cards 280×160px with metric `IBM Plex Mono 28/32`.
- **Activity Feed**: Right column span 4 columns, list items height 88px.

### 5. Bookings Management
- Filter bar top with segmented controls (All, Pending, Upcoming, Completed).
- Data table with sticky header height 56px. Columns: Booking ID, Service, Provider, Date, Status, Actions. Row height 72px.
- Bulk actions bar appears when rows selected (height 56px) with actions `Export`, `Reschedule`, `Cancel`.

### 6. Booking Detail Modal
- Modal width 720px desktop, 100% width mobile. Contains summary header, timeline, payment info, compliance section.
- CTA buttons `Reschedule`, `Cancel`, `Contact provider`.

### 7. Marketplace
- Banner carousel height 320px with gradient overlay, CTA button 180×52px.
- Card grid 4 columns on desktop, 2 on tablet, 1 on mobile. Cards 280×360px.
- Sponsored badges top-right 24×24px.

## Provider/Admin Portal

### 8. Provider Dashboard
- Dual column layout: metrics area (span 8), task queue (span 4).
- Quick actions row with icon tiles 120×120px, gradient backgrounds.
- Compliance widget: checklist with progress ring 120px.

### 9. Bidding Console
- Kanban board with columns (New, In Review, Submitted, Awarded). Column width 320px desktop; horizontal scroll when overflow.
- Cards height 160px with details, countdown timer badge.
- Drawer opens from right (width 420px) for bid details.

### 10. Compliance Centre
- Stepper header showing overall progress.
- Document list table with status pills, expiry dates, action buttons.
- Upload modal 560px width with drag-and-drop area 100% width, height 200px.

### 11. Analytics Overview
- Use ECharts for zone heatmap, line charts for bookings. Charts span 8 columns, height 320px.
- KPI summary cards top row 4 columns each.

### 12. Settings & Account
- Two-column layout (form left 8 columns, preview right 4 columns). On mobile, stack vertically.
- Tabs for Profile, Notifications, Security. Each tab loads form sections with 24px spacing.

## Shared Overlays & States
- **Toast**: 360×56px, positioned top-right offset 24px, background `#111827`, text white.
- **Dialogs**: 480px width default, radius 16px, button row right-aligned.
- **Loading Skeleton**: 12px radius bars, shimmer animation 1.2s.
- **Error Pages**: 3-up cards showing potential actions, hero illustration 320px.

## Accessibility Notes
- Focus outlines 3px `#0EA5E9` on all interactive elements.
- Ensure table cells maintain 44px min height for keyboard navigation.
- Provide skip-to-content link anchored top-left (visible on focus).
