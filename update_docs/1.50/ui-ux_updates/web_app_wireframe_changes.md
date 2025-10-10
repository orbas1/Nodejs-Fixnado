# Web Application Wireframe Changes

## Global Layout
- Introduced unified shell with top navigation (Fixnado brand, search, notifications) and left rail for persona switching (Consumer, Provider, SME, Enterprise, Admin).
- Content canvas adopts 12-column grid (1280px max width) with responsive breakpoints at 1024px and 1440px.
- Right-hand contextual panel surfaces AI insights, compliance alerts, or ads inventory based on context.

## Key Workspaces
1. **Explorer & Marketplace**
   - Hero mosaic for ads, zone banners, curated categories.
   - Multi-filter panel with toggles for services, packages, rentals, promotions.
   - Card layout includes compliance badges, pricing matrix, CTA cluster (Book, Chat, Add to Compare).
2. **Custom Job Hub**
   - Kanban board for request status (Draft, Out for Bids, Reviewing, Awarded, Archived).
   - Detail pane summarises job requirements, timeline, attachments, and communication log.
   - Bid comparison modal with scoring matrix (price, SLA, reviews, compliance).
3. **Provider Console**
   - Dashboard with KPIs (utilisation, response time, revenue), zone heatmap, AI assistant suggestions.
   - Tabs for Jobs, Inventory, Ads Campaigns, Compliance, Team.
   - Team scheduling uses stacked timeline view with drag handles and availability overlays.
4. **Inventory & Rentals**
   - Table + card hybrid: summary chips for stock health, reorder alerts, rental bookings.
   - Asset detail view includes depreciation tracker, rental calendar, and photo gallery.
5. **Admin Governance**
   - Multi-panel layout: metrics overview, consent management, dispute timeline.
   - Audit log viewer with filters (persona, zone, action type) and export options.
6. **Analytics & Ads**
   - Dashboard featuring charts (line, bar, funnel) and toggles to switch persona context.
   - Campaign builder wizard with preview pane for ad placements.

## Wireframe States
- Designed skeleton screens, empty states with call-to-action, error fallbacks, and loading transitions.
- Outlined states for: offline mode, AI suggestions disabled, compliance overdue, and multi-currency display.

## Interaction Guidelines
- Breadcrumb navigation for deep workflows, supporting back-tracking without losing context.
- Modal usage restricted to decision-heavy actions (bid compare, compliance review) with clear primary/secondary CTAs.
- Keyboard shortcuts defined for power users (e.g., `G+J` go to Jobs, `G+C` compliance centre).
