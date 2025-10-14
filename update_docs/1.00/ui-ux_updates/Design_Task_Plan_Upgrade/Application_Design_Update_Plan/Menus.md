# Menu Structures — Zone Coverage Update (2025-11-03)

## Admin Navigation
- **Geo Services → Coverage**
  - Entry appears beneath `Geo Zones` and links to `/admin/zones/:zoneId/coverage` when a zone is selected. Breadcrumbs read `Geo Services / {Zone name} / Coverage`.
  - Badge displays count of attached services and highlights expiring coverage (badge colour warning when <14 days remaining).
  - Secondary actions: `Download GeoJSON bundle`, `Open overlap guidance`. Both emit telemetry `zone.menu.coverage_action` with `{ action }` payload.

## Provider Navigation
- **Zones & Territories**
  - Collapsible section listing assigned zones with pill showing coverage tier (Primary/Secondary). Selecting a zone opens coverage drawer with quick actions `Call ops`, `Request support`.
  - Offline states display greyed icons with tooltip “Sync coverage when back online”.

## Mobile Drawer
- **Coverage Shortcuts**
  - Adds quick action to bottom nav overflow: `Manage coverage`. Uses icon `icon-coverage` and opens the same drawer as web.
  - When zone overlap conflict occurs, drawer entry displays warning badge linking to troubleshooting article.

## QA Hooks
- Navigation items expose `data-qa="menu-coverage-link"`, `data-qa="menu-coverage-geojson"`, and `data-qa="menu-coverage-support"` selectors for automation.
