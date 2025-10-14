# Web Application Wireframe Changes (React)

## 1. Global Layout
- **Responsive Grid**
  - 12-column layout with breakpoints at 1440px (desktop), 1024px (tablet), 768px (small tablet), 480px (mobile).
  - Persistent header containing logo, global search, notifications, user menu.
  - Left side navigation for authenticated dashboards (Provider/Admin); collapsible to icon rail.
- **Global Footer**
  - Contains support links, compliance policies, language selector, and marketing CTAs.
- **Session Entry Points**
  - Header includes "Log In" / "Create Account" CTAs for anonymous users; once authenticated, surfaces avatar dropdown with profile, billing, and logout links.

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
- **Support CTA Band**
  - Full-width strip promoting chat support, phone contact, and knowledge base for rapid assistance.

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
  - Survey widget capturing booking experience feedback with 1–5 rating and optional text.

## 3a. Authentication & Account Access
- **Login Modal**
  - Two-column layout with form on left (email/password, SSO buttons) and benefits panel on right; includes remember me checkbox.
- **Registration Flow**
  - Multi-step overlay capturing personal details, address, preferred communication channel, and optional business verification.
- **Password Recovery**
  - Email entry form leading to OTP verification, new password creation, and confirmation screen.

## 4. Provider Web Console
- **Dashboard**
  - KPI tiles (Active Jobs, Bids Pending, Earnings, Compliance Tasks) with trend charts.
  - Activity feed, notifications, upcoming schedule, zone performance heatmap.
- **Jobs Module**
  - Data table with filters and bulk actions; timeline view for quick updates.
  - Job detail panel slides in with tabs: Overview, Timeline, Documents, Financials, Communication.
- **Availability & Zones**
  - Map editor for polygon drawing, zone metrics, coverage recommendations.
  - Service coverage drawer lists attached services with priority pills, effective window badges, and overlap warnings sourced from `/api/zones/:id/services`; admins can reorder priorities, toggle coverage types, and view audit metadata before publishing.
  - Conflict banner surfaces when backend rejects overlaps, linking to analytics drill-down and escalation workflow captured in zone governance specs.
- **Marketplace Manager**
  - Inventory table, listing cards, rental logistics timeline, analytics charts.
- **Compliance Centre**
  - Kanban columns (To Submit, Under Review, Approved, Expiring). Document upload modal with drag-and-drop.
- **Ads Manager**
  - Campaign list with performance metrics, create campaign wizard, budget allocation chart.
- **Billing & Subscription**
  - Page summarising current plan, usage caps, invoices, and upgrade/downgrade options with confirmation modals.

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
- **Audit Trail Viewer**
  - Timeline view listing admin actions with filters for user, entity, and date; includes export to CSV.

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
- **Loyalty & Referrals**
  - Dashboard highlighting reward tier, available coupons, referral link performance, and redemption history.

## 7. Communications Suite
- **Unified Inbox**
  - Left column conversation list with filters (Bookings, Marketplace, Compliance, Support).
  - Main panel shows chat transcript, attachments, AI assist sidebar.
  - Right rail displays context (booking summary, tasks, notes).
- **Call & Video Launchpad**
  - Modal overlay with device checks, ability to invite participants, record session toggle.
- **Notification Centre**
  - Dropdown panel grouped by priority with mark-as-read actions and quick navigation links.
- **Message Templates Library**
  - Sidebar for saved canned responses accessible to support teams with preview and edit capabilities.

## 8. Analytics Dashboards
- **Zone Analytics**
  - Map overlay with performance metrics, time range selector, export button.
- **Booking Funnel Analytics**
  - Conversion funnel visual, segmented by zone/service.
- **Marketplace Analytics**
  - Inventory turnover charts, revenue per listing, rental utilisation heatmap.
- **Ads Analytics**
  - Campaign performance charts, audience breakdown, spend vs. target gauge.
- **Financial Health**
  - Revenue vs. payouts graphs, outstanding invoices list, and churn heatmaps segmented by zone.

## 9. System States
- **Empty States**
  - Provide illustrative graphics and call-to-action links to create first campaign, add listing, or initiate booking.
- **Error States**
  - Display reason, suggested actions, retry buttons; include support contact.
- **Loading Skeletons**
  - Use skeleton loaders for tables, cards, charts to maintain perceived performance.
- **Service Interruptions**
  - Full-screen banner for major outages with live status feed and alternative contact options.

These wireframe revisions establish a scalable, data-rich web experience tailored to both consumers and enterprise administrators.

## Screen Matrix & Responsibilities
| Area | Screen | Objective | Key Modules | Special Considerations |
| --- | --- | --- | --- | --- |
| Public | Landing Hero | Drive discovery | Hero, search bar, CTA buttons | Seasonal campaign banner slot, localisation support |
| Public | Explorer | Map/list search | Map canvas, filter panel, provider cards | Debounce interactions for performance, sponsored badge disclosure |
| Booking | Requirements | Capture details | Multi-column form, helper sidebar | Inline progress tracker, saved draft state |
| Booking | Provider Selection | Compare bids | Table, compare drawer, map inset | Supports manual/auto selection toggle |
| Booking | Checkout | Finalise booking | Calendar, payment form, summary | Legal consent block, invoice preview |
| Provider Console | Dashboard | Operational overview | KPI tiles, activity feed, zone heatmap | Customisable widget layout (drag/drop) |
| Provider Console | Jobs Table | Manage jobs | Data table, filters, quick actions | Bulk actions require confirmation drawer |
| Provider Console | Marketplace Manager | Manage listings | Inventory table, listing cards, analytics | Inline status indicators for compliance |
| Admin | Compliance Queue | Approve docs | Table, detail drawer, evidence gallery | Multi-select bulk decision bar |
| Admin | Dispute Resolution | Resolve conflicts | Master/detail layout, action footer | Decision confirmation modals with audit logging |
| User Account | Bookings Dashboard | Track engagements | Booking cards, timeline widget | Quick actions contextual to status |
| Communications | Unified Inbox | Manage conversations | Conversation list, chat window, context rail | Role-based templates, AI assist panel |
| Analytics | Zone Analytics | Monitor performance | Map overlays, charts, filters | Export triggers background job with toast feedback |

### Content & Interaction Guidelines
- Each screen annotated with copy tone (professional, supportive) and CTA labels to maintain consistency across modules.
- Forms highlight required vs optional fields using iconography and tooltips to minimise completion errors.
- Navigation breadcrumbs added for deep admin flows to improve orientation.

### Handoff Requirements
1. Provide responsive measurements for breakpoints (desktop, tablet, mobile) including collapsed navigation states.
2. Document skeleton states for tables, cards, and charts to ensure consistent loading experiences.
3. Supply component naming aligned with React component library (`<ZoneAnalyticsMap>`, `<BookingStepper>`).
4. Include accessibility annotations (ARIA roles, keyboard navigation) within wireframe notes for developer reference.
