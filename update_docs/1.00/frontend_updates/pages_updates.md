# Explorer Page Updates — Version 1.00

## 2025-10-21 — Explorer Search & Zone Intelligence
- Replaced the static explorer stub with a production-ready experience that synchronises filters to the URL, persists demand-level selections, and hydrates results directly from `/api/search`. Cards now expose provider/company metadata, price formatting, and CTA routing that aligns with Services marketing flows.
- Embedded MapLibre maps with governed styling, sticky positioning, and legend overlay. Zone polygons, match counts, and SLA metrics hydrate from `/api/zones?includeAnalytics=true`, while click interactions drive filter updates and accessibility-safe announcements through the zone insight panel.
- Added reusable explorer components (`components/explorer/ExplorerFilters.jsx`, `ExplorerMap.jsx`, `ExplorerResultList.jsx`, `ZoneInsightPanel.jsx`) and data utilities (`pages/explorerUtils.js`, `api/explorerClient.js`). Vitest coverage ensures demand filtering, zone match indexing, and bounds calculations remain deterministic across SQLite/PostGIS geometry representations.
