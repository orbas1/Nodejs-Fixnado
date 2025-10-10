# Web Application Wireframe Changes (React)

## 1. Global Layout
- **Responsive Grid**
  - 12-column layout with breakpoints at 1440px (desktop), 1024px (tablet), 768px (small tablet), 480px (mobile).
  - Persistent header containing logo, global search, notifications, user menu.
  - Left side navigation for authenticated dashboards (Provider/Admin); collapsible to icon rail.
- **Global Footer**
  - Contains support links, compliance policies, language selector, and marketing CTAs.

## 2. Public Explorer & Landing
- **Hero Section**
  - Full-bleed map background with search bar overlay, quick filters (Home Repair, Cleaning, Installations, Rentals).
  - CTA buttons for "Find Providers" and "Become a Provider".
- **Geo-Zonal Explorer**
  - Split layout: map (left 60%) with polygon overlays, result list (right 40%) with provider cards.
  - Filter panel slides from right: zone, services, price, availability, ratings, promotions.
  - Result cards include badges (Verified, Top Rated, Sponsored), CTA to view profile or book.
- **Curated Collections**
  - Horizontal scrollers featuring seasonal services, packages, rental bundles.
- **Testimonial & Trust Section**
  - Grid of customer stories, compliance badges, partner logos.

## 3. Booking Funnel (Web)
- **Step 1: Requirements**
  - Multi-column form with structured inputs (service type, description, property details, media uploads).
  - Helper sidebar summarises benefits and SLA.
- **Step 2: Provider Selection**
  - Table view of bidding providers with sorting (price, rating, availability) and compare drawer.
  - Map inline to visualise provider locations.
- **Step 3: Package Customisation**
  - Modular cards for add-ons, rental equipment, warranties.
  - Cost summary updates in sticky sidebar.
- **Step 4: Schedule & Checkout**
  - Calendar/time slot picker, payment method selection, invoice preview.
  - Consent checkboxes and terms links.
- **Confirmation Page**
  - Summary card, timeline of next steps, share/export PDF, add to calendar, refer-a-friend module.

## 4. Provider Web Console
- **Dashboard**
  - KPI tiles (Active Jobs, Bids Pending, Earnings, Compliance Tasks) with trend charts.
  - Activity feed, notifications, upcoming schedule, zone performance heatmap.
- **Jobs Module**
  - Data table with filters and bulk actions; timeline view for quick updates.
  - Job detail panel slides in with tabs: Overview, Timeline, Documents, Financials, Communication.
- **Availability & Zones**
  - Map editor for polygon drawing, zone metrics, coverage recommendations.
- **Marketplace Manager**
  - Inventory table, listing cards, rental logistics timeline, analytics charts.
- **Compliance Centre**
  - Kanban columns (To Submit, Under Review, Approved, Expiring). Document upload modal with drag-and-drop.
- **Ads Manager**
  - Campaign list with performance metrics, create campaign wizard, budget allocation chart.

## 5. Admin & Governance Portal
- **Global Overview**
  - Multi-tab dashboard: Bookings, Providers, Users, Zones, Compliance, Financials.
  - Each tab includes KPI summary, trend charts, alert list.
- **Compliance Queue**
  - Table with filters (document type, status, risk score), bulk approve/reject, audit trail side panel.
- **Dispute Resolution**
  - Master-detail layout: dispute list (left), selected dispute details (right) with evidence gallery, decision controls, resolution checklist.
- **Commission & Tax Settings**
  - Form-based interface to configure percentage tiers, regional overrides, effective dates.
- **Analytics Exports**
  - Modal to configure CSV/BI exports, schedule, recipients.

## 6. User Account Area (Web)
- **Bookings Dashboard**
  - Card layout summarising upcoming and past bookings, quick actions.
  - Timeline widget with notifications.
- **Marketplace Orders**
  - Table of orders with filters (status, date, fulfillment method).
- **Profile & Preferences**
  - Forms for personal info, payment methods, addresses, accessibility options.
- **Support Centre**
  - Knowledge base list, ticket history, chat widget integration.

## 7. Communications Suite
- **Unified Inbox**
  - Left column conversation list with filters (Bookings, Marketplace, Compliance, Support).
  - Main panel shows chat transcript, attachments, AI assist sidebar.
  - Right rail displays context (booking summary, tasks, notes).
- **Call & Video Launchpad**
  - Modal overlay with device checks, ability to invite participants, record session toggle.
- **Notification Centre**
  - Dropdown panel grouped by priority with mark-as-read actions and quick navigation links.

## 8. Analytics Dashboards
- **Zone Analytics**
  - Map overlay with performance metrics, time range selector, export button.
- **Booking Funnel Analytics**
  - Conversion funnel visual, segmented by zone/service.
- **Marketplace Analytics**
  - Inventory turnover charts, revenue per listing, rental utilisation heatmap.
- **Ads Analytics**
  - Campaign performance charts, audience breakdown, spend vs. target gauge.

## 9. System States
- **Empty States**
  - Provide illustrative graphics and call-to-action links to create first campaign, add listing, or initiate booking.
- **Error States**
  - Display reason, suggested actions, retry buttons; include support contact.
- **Loading Skeletons**
  - Use skeleton loaders for tables, cards, charts to maintain perceived performance.

These wireframe revisions establish a scalable, data-rich web experience tailored to both consumers and enterprise administrators.
