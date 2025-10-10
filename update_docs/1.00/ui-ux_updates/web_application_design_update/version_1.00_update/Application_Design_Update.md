# Web Application Design Update — Version 1.00

## Executive Summary
The web application redesign aligns desktop and responsive breakpoints with the geo-zonal marketplace strategy. The documentation in this directory details page templates, component tokens, navigation patterns, and data dependencies so React squads can implement the experience across public explorer, authenticated dashboards, and administrative consoles.

## Objectives
- Deliver a cohesive responsive system (1440/1280/1024/768/480 breakpoints) with consistent theming to support both consumer and provider portals.
- Provide granular specifications for cards, tables, forms, and navigation to scale enterprise workflows (compliance, bidding, analytics).
- Document asset usage (maps, photography, illustrations) with repository references and licensing notes.
- Outline logic flows and data requirements for dynamic modules (map explorer, booking wizard, campaign management).

## Artefact Overview
| Document | Focus |
| --- | --- |
| `Screens_Update.md` | Page-by-page layout specs for desktop/tablet/mobile |
| `Screens_Update_Plan.md` | Delivery sequencing and dependencies |
| `Screen_buttons.md`, `Cards.md`, `Forms.md` | Component-level styling |
| `Colours.md`, `Fonts.md` | Theme tokens + typographic system |
| `Logic_Flow_update.md`, `Logic_Flow_map.md` | Application flow, routing, API touchpoints |
| `Dummy_Data_Requirements.md`, `Menus.md`, `Settings*.md` | Data seeding, navigation structures |

## Implementation Roadmap
1. **Design Token Integration** — Export tokens to `packages/design-system` as CSS variables and TypeScript theme definitions. Update `styled-components` theme provider.
2. **Component Library Update** — Extend `@fixnado/ui` with responsive layout primitives (grid, stack, side panel) and new interactive components (zone map, analytics cards).
3. **Page Template Development** — Build React route shells for Public Explorer, Authenticated Dashboard, Marketplace Admin, Support Centre using Next.js dynamic routing.
4. **Data Layer Wiring** — Connect to GraphQL/REST endpoints enumerated in logic docs. Implement SWR caching + websocket subscriptions for live updates.
5. **QA & Accessibility** — Validate WCAG AA across breakpoints, run automated tests (Lighthouse, Axe), verify SSR hydration.

## Dependencies & Assets
- **Icons & Illustrations**: Figma library `fixnado-web/v1.00`. Export to `apps/web/public/assets/`.
- **Maps**: Mapbox GL JS style `fixnado-zones-web-v7` with vector tiles. Provide fallback static images for SSR.
- **Charts**: Utilise `ECharts` with theme overrides defined in `Colours.md`.

## Acceptance Criteria
- Page layouts conform to specified column widths within ±4px.
- Responsive navigation shifts (sidebar ↔ icon rail ↔ menu drawer) occur at defined breakpoints.
- All interactive components accessible via keyboard, have visible focus, and pass contrast checks.
- Map/list interactions maintain 1000ms or less latency between filter change and results update.

## Next Actions
- Schedule design review with front-end guild to walkthrough specs.
- Sync with backend for GraphQL schema updates enabling new analytics cards.
- Publish updated Storybook with all components referencing this documentation.
