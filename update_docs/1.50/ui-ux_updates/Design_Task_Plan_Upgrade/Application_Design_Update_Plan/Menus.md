# Navigation & Menu Specifications

## Primary Navigation
- Bottom navigation with five destinations: **Dashboard**, **Jobs**, **Calendar**, **Inbox**, **Financials**.
- Icons 26px with 4px label; active state uses primary colour and filled icon; inactive states outlined.
- Floating quick action button (FAB) anchored above centre to create booking or log activity; includes long-press for shortcuts.

## Secondary Menus
- **Hamburger menu** removed; settings and support accessible via profile avatar in dashboard header.
- **Context menus** within cards triggered by three-dot icon; options vary by card type (e.g., job -> view details, share, cancel).
- **Tab bars** within detail screens (e.g., Job detail: Overview, Messages, Files, Activity) highlight active tab with pill indicator.

## Menu Behaviour
- Navigation items maintain state when switching tabs; data persists to avoid reload where possible.
- Provide double-tap to scroll-to-top functionality on dashboard and job list tabs.
- Long labels truncated with ellipsis but full label announced via accessibility label.

## Drawer & Modal Menus
- Availability bulk edit uses bottom sheet menu listing templates; includes search and preview snippet.
- Support centre menu accessible from inbox overflow; offers quick links to help centre, contact support, emergency hotline.

## Personalisation & Context
- Menu order locked to maintain consistency; context-specific shortcuts (e.g., active job quick actions) appear within header chips rather than altering navigation.
- Display badge counts for Inbox (unread messages) and Action Queue (pending tasks) with accessible labels.

## Analytics
- Track `nav_tab_select` events with properties `tab_name`, `previous_tab`, `surface` for analysis.
- Monitor overflow menu usage to identify seldom-used actions for potential redesign.
