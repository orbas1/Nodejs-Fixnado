# Navigation Menus — Web Application v1.00

## Primary Sidebar (Authenticated)
| Order | Icon | Label | Route |
| --- | --- | --- | --- |
| 1 | `home` | Dashboard | `/dashboard/user` or `/dashboard/provider` |
| 2 | `map` | Explorer | `/explorer` |
| 3 | `calendar` | Bookings | `/bookings` |
| 4 | `megaphone` | Marketplace | `/marketplace` |
| 5 | `chat` | Messages | `/messages` |
| 6 | `shield-check` | Compliance | `/compliance` (provider) |
| 7 | `bar-chart` | Analytics | `/analytics` (provider/admin) |
| 8 | `settings` | Settings | `/settings` |

## Top Bar Menus
- **Notifications**: Bell icon, opens side drawer width 420px listing alerts.
- **User Menu**: Avatar menu with links `Profile`, `Switch role` (if multi-role), `Help Center`, `Sign out`.
- **Global Search**: Command palette triggered by `Ctrl/Cmd + K`, results grouped by entity (Providers, Bookings, Campaigns).

## Mobile Navigation
- Bottom nav with 4 icons: Dashboard, Explorer, Bookings, Menu (opens sheet). Menu sheet contains remaining options and settings.
- Floating action button bottom-right for quick booking / create actions depending on role.

## Contextual Menus
- **Table Row Menu**: Options `View`, `Edit`, `Duplicate`, `Delete`. For provider bookings include `Reschedule`, `Assign`.
- **Kanban Card Menu**: `View details`, `Move to column`, `Archive`, `Share`.
- **Campaign Card Menu**: `Activate`, `Pause`, `Edit budget`, `Duplicate`.

## Footer Links
- Global footer contains `Privacy`, `Terms`, `Support`, `Status`, `Language selector`.

## Accessibility
- Provide `aria-label` for icons, `role="menu"`/`menuitem` for dropdowns.
- Keyboard navigation: arrow keys cycle within menus, ESC closes.
- High-contrast focus state for all menu items.
