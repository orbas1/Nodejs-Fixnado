# Navigation Menu Specification

## Global Header
- Primary navigation: Dashboard, Marketplace, Resources, Reports, Support.
- Utility icons: Notifications, Help, Profile menu with account + logout.
- Responsive behaviour: collapse into hamburger with slide-out panel on mobile.

## Contextual Dock
- Appears on dashboard pages; includes shortcuts to Approvals, Scheduling, Analytics, Settings.
- Dock items show tooltip on hover and keyboard focus.

## Breadcrumbs
- Display current location for nested pages with clickable ancestors.
- Auto-generated from route metadata.

## Dropdown Menus
- Multi-level support limited to two levels to maintain clarity.
- Include icons for frequent actions (Create request, Upload resource).

## Accessibility
- Menus fully keyboard accessible: arrow keys to navigate, escape to close.
- Screen reader announcements for open/close state.

## Analytics
- Track `menu_item_selected` with properties `menu_type`, `item_id`, `source_page`.
